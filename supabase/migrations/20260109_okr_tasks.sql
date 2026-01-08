-- Migration: OKR Tasks (Tarefas/Checklist para OKRs)
-- Sistema de tarefas vinculadas a Objectives e Key Results

-- =====================================================
-- TABELA: okr_tasks (Tarefas de OKRs)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.okr_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Pode ser vinculado a um Objective OU a um Key Result
  objective_id UUID REFERENCES objectives(id) ON DELETE CASCADE,
  key_result_id UUID REFERENCES key_results(id) ON DELETE CASCADE,
  -- Dados da tarefa
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  -- Prioridade e ordem
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  sort_order INTEGER DEFAULT 0,
  -- Responsavel
  assignee_id UUID REFERENCES profiles(id),
  due_date DATE,
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint: deve ter objective_id OU key_result_id
  CONSTRAINT okr_tasks_parent_check CHECK (
    (objective_id IS NOT NULL AND key_result_id IS NULL) OR
    (objective_id IS NULL AND key_result_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_okr_tasks_objective ON okr_tasks(objective_id);
CREATE INDEX IF NOT EXISTS idx_okr_tasks_kr ON okr_tasks(key_result_id);
CREATE INDEX IF NOT EXISTS idx_okr_tasks_assignee ON okr_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_okr_tasks_completed ON okr_tasks(is_completed);

-- =====================================================
-- TRIGGER para updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_okr_tasks_updated_at ON okr_tasks;
CREATE TRIGGER update_okr_tasks_updated_at
  BEFORE UPDATE ON okr_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE okr_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS okr_tasks_select ON okr_tasks;
CREATE POLICY okr_tasks_select ON okr_tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS okr_tasks_insert ON okr_tasks;
CREATE POLICY okr_tasks_insert ON okr_tasks FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS okr_tasks_update ON okr_tasks;
CREATE POLICY okr_tasks_update ON okr_tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS okr_tasks_delete ON okr_tasks;
CREATE POLICY okr_tasks_delete ON okr_tasks FOR DELETE TO authenticated USING (true);
