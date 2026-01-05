-- PDI Tracker - ODuo
-- Schema SQL para Supabase
-- Execute este SQL no SQL Editor do Supabase

-- Limpar tipos existentes (caso precise recriar)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS goal_status CASCADE;
DROP TYPE IF EXISTS goal_category CASCADE;
DROP TYPE IF EXISTS goal_priority CASCADE;
DROP TYPE IF EXISTS habit_type CASCADE;

-- Enum types
CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'colaborador');
CREATE TYPE goal_status AS ENUM ('not_started', 'in_progress', 'completed', 'overdue');
CREATE TYPE goal_category AS ENUM ('profissional', 'pessoal', 'saude', 'tecnico');
CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE habit_type AS ENUM ('boolean', 'counter', 'time');

-- Users (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role DEFAULT 'colaborador',
  manager_id UUID REFERENCES public.profiles(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals (Metas)
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category goal_category NOT NULL,
  status goal_status DEFAULT 'not_started',
  priority goal_priority DEFAULT 'medium',
  due_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits (Hábitos)
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type habit_type DEFAULT 'boolean',
  target_value INTEGER DEFAULT 1,
  frequency TEXT[] DEFAULT ARRAY['seg', 'ter', 'qua', 'qui', 'sex'],
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit Logs (Registros)
CREATE TABLE public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  value INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

-- Achievements (Conquistas)
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  habit_id UUID REFERENCES public.habits(id),
  goal_id UUID REFERENCES public.goals(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments (Feedback gestor/colaborador)
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para performance
CREATE INDEX idx_goals_user ON public.goals(user_id);
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_goals_due_date ON public.goals(due_date);
CREATE INDEX idx_habits_user ON public.habits(user_id);
CREATE INDEX idx_habits_active ON public.habits(is_active);
CREATE INDEX idx_habit_logs_habit ON public.habit_logs(habit_id);
CREATE INDEX idx_habit_logs_date ON public.habit_logs(date);
CREATE INDEX idx_achievements_user ON public.achievements(user_id);
CREATE INDEX idx_comments_goal ON public.comments(goal_id);
CREATE INDEX idx_comments_habit ON public.comments(habit_id);
CREATE INDEX idx_profiles_manager ON public.profiles(manager_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Managers can view team profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role IN ('gestor', 'admin'))
    )
  );

CREATE POLICY "Admins can do everything on profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Goals policies
CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team goals" ON public.goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_id AND p.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can update team goals" ON public.goals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_id AND p.manager_id = auth.uid()
    )
  );

-- Habits policies
CREATE POLICY "Users can view own habits" ON public.habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits" ON public.habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON public.habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON public.habits
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team habits" ON public.habits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_id AND p.manager_id = auth.uid()
    )
  );

-- Habit logs policies
CREATE POLICY "Users can view own habit logs" ON public.habit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_id AND h.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own habit logs" ON public.habit_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_id AND h.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own habit logs" ON public.habit_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_id AND h.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view team habit logs" ON public.habit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.habits h
      JOIN public.profiles p ON p.id = h.user_id
      WHERE h.id = habit_id AND p.manager_id = auth.uid()
    )
  );

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON public.achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view comments on their content" ON public.comments
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.habits h WHERE h.id = habit_id AND h.user_id = auth.uid())
  );

CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view team comments" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.goals g
      JOIN public.profiles p ON p.id = g.user_id
      WHERE g.id = goal_id AND p.manager_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.habits h
      JOIN public.profiles p ON p.id = h.user_id
      WHERE h.id = habit_id AND p.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can comment on team content" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM public.goals g
        JOIN public.profiles p ON p.id = g.user_id
        WHERE g.id = goal_id AND (p.manager_id = auth.uid() OR p.id = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM public.habits h
        JOIN public.profiles p ON p.id = h.user_id
        WHERE h.id = habit_id AND (p.manager_id = auth.uid() OR p.id = auth.uid())
      )
    )
  );

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'colaborador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Função para calcular e atualizar streak
CREATE OR REPLACE FUNCTION public.update_habit_streak()
RETURNS TRIGGER AS $$
DECLARE
  habit_record RECORD;
  streak_count INTEGER := 0;
  check_date DATE;
  log_exists BOOLEAN;
BEGIN
  -- Get the habit
  SELECT * INTO habit_record FROM public.habits WHERE id = NEW.habit_id;

  -- Only calculate if the log is completed
  IF NEW.completed = true THEN
    check_date := NEW.date;

    -- Count consecutive days backwards
    LOOP
      SELECT EXISTS (
        SELECT 1 FROM public.habit_logs
        WHERE habit_id = NEW.habit_id
        AND date = check_date
        AND completed = true
      ) INTO log_exists;

      IF log_exists THEN
        streak_count := streak_count + 1;
        check_date := check_date - INTERVAL '1 day';
      ELSE
        EXIT;
      END IF;

      -- Safety limit
      IF streak_count > 1000 THEN EXIT; END IF;
    END LOOP;

    -- Update habit streaks
    UPDATE public.habits
    SET
      current_streak = streak_count,
      best_streak = GREATEST(best_streak, streak_count)
    WHERE id = NEW.habit_id;
  ELSE
    -- If uncompleted, reset current streak
    UPDATE public.habits
    SET current_streak = 0
    WHERE id = NEW.habit_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar streak
CREATE TRIGGER update_streak_on_log
  AFTER INSERT OR UPDATE ON public.habit_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_habit_streak();
