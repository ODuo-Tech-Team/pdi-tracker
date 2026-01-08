-- Migration: Goal Tasks (Atividades de Metas PDI)
-- Sistema de atividades/tarefas vinculadas a metas com suporte a recorrencia

-- =====================================================
-- TABELA: goal_tasks (Atividades de Metas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.goal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  -- Recorrencia
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')) DEFAULT NULL,
  recurrence_days INTEGER[] DEFAULT NULL, -- dias da semana (0=domingo, 1=segunda, etc) ou dias do mes
  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  -- Peso para calculo de progresso (permite atividades com pesos diferentes)
  weight INTEGER DEFAULT 1 CHECK (weight >= 1 AND weight <= 10),
  -- Ordem de exibicao
  sort_order INTEGER DEFAULT 0,
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_tasks_goal ON goal_tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_tasks_completed ON goal_tasks(is_completed);

-- =====================================================
-- TABELA: goal_task_completions (Historico de conclusoes para recorrentes)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.goal_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES goal_tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_task_completions_task ON goal_task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_date ON goal_task_completions(completed_at);

-- =====================================================
-- TRIGGER para updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_goal_tasks_updated_at ON goal_tasks;
CREATE TRIGGER update_goal_tasks_updated_at
  BEFORE UPDATE ON goal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCAO: Calcular progresso da meta baseado nas tarefas
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_goal_progress(p_goal_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_weight INTEGER;
  completed_weight INTEGER;
  calculated_progress INTEGER;
BEGIN
  -- Buscar peso total das tarefas
  SELECT COALESCE(SUM(weight), 0)
  INTO total_weight
  FROM goal_tasks
  WHERE goal_id = p_goal_id;

  -- Se nao tem tarefas, retorna o progresso atual da meta
  IF total_weight = 0 THEN
    RETURN (SELECT progress FROM goals WHERE id = p_goal_id);
  END IF;

  -- Buscar peso das tarefas completadas
  SELECT COALESCE(SUM(weight), 0)
  INTO completed_weight
  FROM goal_tasks
  WHERE goal_id = p_goal_id AND is_completed = true;

  -- Calcular porcentagem
  calculated_progress := ROUND((completed_weight::DECIMAL / total_weight) * 100);

  RETURN calculated_progress;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCAO: Atualizar progresso da meta quando tarefa muda
-- =====================================================
CREATE OR REPLACE FUNCTION update_goal_progress_on_task_change()
RETURNS TRIGGER AS $$
DECLARE
  new_progress INTEGER;
BEGIN
  -- Calcular novo progresso
  new_progress := calculate_goal_progress(COALESCE(NEW.goal_id, OLD.goal_id));

  -- Atualizar progresso da meta
  UPDATE goals
  SET progress = new_progress,
      status = CASE
        WHEN new_progress >= 100 THEN 'completed'
        WHEN new_progress > 0 THEN 'in_progress'
        ELSE status
      END
  WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar progresso quando tarefa e criada/atualizada/deletada
DROP TRIGGER IF EXISTS trigger_update_goal_progress ON goal_tasks;
CREATE TRIGGER trigger_update_goal_progress
AFTER INSERT OR UPDATE OF is_completed, weight OR DELETE ON goal_tasks
FOR EACH ROW
EXECUTE FUNCTION update_goal_progress_on_task_change();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE goal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_task_completions ENABLE ROW LEVEL SECURITY;

-- Goal Tasks policies
DROP POLICY IF EXISTS goal_tasks_select ON goal_tasks;
CREATE POLICY goal_tasks_select ON goal_tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS goal_tasks_insert ON goal_tasks;
CREATE POLICY goal_tasks_insert ON goal_tasks FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS goal_tasks_update ON goal_tasks;
CREATE POLICY goal_tasks_update ON goal_tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS goal_tasks_delete ON goal_tasks;
CREATE POLICY goal_tasks_delete ON goal_tasks FOR DELETE TO authenticated USING (true);

-- Task Completions policies
DROP POLICY IF EXISTS task_completions_select ON goal_task_completions;
CREATE POLICY task_completions_select ON goal_task_completions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS task_completions_insert ON goal_task_completions;
CREATE POLICY task_completions_insert ON goal_task_completions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS task_completions_delete ON goal_task_completions;
CREATE POLICY task_completions_delete ON goal_task_completions FOR DELETE TO authenticated USING (true);
