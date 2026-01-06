-- PDI Tracker - ODuo
-- Migration V2: Admin Panel, Organograma, Notificações
-- Execute este SQL no SQL Editor do Supabase

-- =====================================================
-- 1. ALTERAÇÕES NA TABELA PROFILES
-- =====================================================

-- Adicionar campo is_active para soft delete
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Adicionar campo department para organograma
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS department TEXT;

-- Adicionar campo position (cargo) para organograma
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS position TEXT;

-- Index para busca por is_active
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);

-- Index para busca por department
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);

-- =====================================================
-- 2. TABELA DE NOTIFICAÇÕES
-- =====================================================

-- Tipo de notificação (criar apenas se não existir)
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'goal_due_soon',      -- Meta vencendo em breve
    'goal_overdue',       -- Meta vencida
    'goal_completed',     -- Meta completada (para gestor)
    'streak_milestone',   -- Marco de streak (7, 30, 100 dias)
    'team_update',        -- Atualização da equipe (para gestor)
    'system'              -- Notificação do sistema
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,                    -- Link para a página relacionada
  is_read BOOLEAN DEFAULT false,
  related_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  related_habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies para notificações
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. FUNÇÃO PARA CRIAR NOTIFICAÇÃO DE META VENCENDO
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_goals_due_soon()
RETURNS void AS $$
DECLARE
  goal_record RECORD;
BEGIN
  -- Buscar metas que vencem em 3 dias e não têm notificação
  FOR goal_record IN
    SELECT g.id, g.user_id, g.title, g.due_date
    FROM public.goals g
    WHERE g.due_date = CURRENT_DATE + INTERVAL '3 days'
    AND g.status NOT IN ('completed', 'overdue')
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.related_goal_id = g.id
      AND n.type = 'goal_due_soon'
      AND n.created_at > CURRENT_DATE - INTERVAL '1 day'
    )
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link, related_goal_id)
    VALUES (
      goal_record.user_id,
      'goal_due_soon',
      'Meta vencendo em breve',
      'A meta "' || goal_record.title || '" vence em 3 dias.',
      '/dashboard/metas/' || goal_record.id,
      goal_record.id
    );
  END LOOP;

  -- Buscar metas vencidas e marcar como overdue
  FOR goal_record IN
    SELECT g.id, g.user_id, g.title
    FROM public.goals g
    WHERE g.due_date < CURRENT_DATE
    AND g.status NOT IN ('completed', 'overdue')
  LOOP
    -- Atualizar status para overdue
    UPDATE public.goals SET status = 'overdue' WHERE id = goal_record.id;

    -- Criar notificação se não existir
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.related_goal_id = goal_record.id
      AND n.type = 'goal_overdue'
    ) THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, related_goal_id)
      VALUES (
        goal_record.user_id,
        'goal_overdue',
        'Meta vencida',
        'A meta "' || goal_record.title || '" está vencida.',
        '/dashboard/metas/' || goal_record.id,
        goal_record.id
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FUNÇÃO PARA NOTIFICAR GESTOR SOBRE CONCLUSÃO
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_manager_goal_completed()
RETURNS TRIGGER AS $$
DECLARE
  manager_id_var UUID;
  user_name_var TEXT;
BEGIN
  -- Só executar quando status muda para 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Buscar gestor do usuário
    SELECT p.manager_id, p.name INTO manager_id_var, user_name_var
    FROM public.profiles p
    WHERE p.id = NEW.user_id;

    -- Se tiver gestor, notificar
    IF manager_id_var IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, related_goal_id, related_user_id)
      VALUES (
        manager_id_var,
        'goal_completed',
        'Meta completada',
        user_name_var || ' completou a meta "' || NEW.title || '".',
        '/dashboard/metas/' || NEW.id,
        NEW.id,
        NEW.user_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar gestor
DROP TRIGGER IF EXISTS notify_manager_on_goal_complete ON public.goals;
CREATE TRIGGER notify_manager_on_goal_complete
  AFTER UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.notify_manager_goal_completed();

-- =====================================================
-- 5. ATUALIZAR POLICIES DE PROFILES PARA ADMIN
-- =====================================================

-- Admin pode inserir novos profiles (criar usuários)
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =====================================================
-- 6. VIEW PARA ESTATÍSTICAS DO ADMIN
-- =====================================================

CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE is_active = true) as total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin' AND is_active = true) as total_admins,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'gestor' AND is_active = true) as total_gestores,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'colaborador' AND is_active = true) as total_colaboradores,
  (SELECT COUNT(*) FROM public.goals) as total_goals,
  (SELECT COUNT(*) FROM public.goals WHERE status = 'completed') as completed_goals,
  (SELECT COUNT(*) FROM public.goals WHERE status = 'overdue') as overdue_goals,
  (SELECT COUNT(*) FROM public.goals WHERE status = 'in_progress') as in_progress_goals,
  (SELECT COUNT(*) FROM public.habits WHERE is_active = true) as total_habits,
  (SELECT COUNT(*) FROM public.achievements) as total_achievements,
  (SELECT COALESCE(AVG(progress), 0) FROM public.goals) as avg_goal_progress;

-- =====================================================
-- 7. ATUALIZAR HANDLE_NEW_USER PARA NOVOS CAMPOS
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'colaborador',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
