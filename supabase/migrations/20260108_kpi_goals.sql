-- Migration: KPI Goals e 5W2H Actions
-- Sistema de metas vinculadas a KPIs e plano de acao

-- =====================================================
-- TABELA: kpi_goals (Metas vinculadas a KPIs)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kpi_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_operator TEXT CHECK (target_operator IN ('>', '<', '>=', '<=', '=')) DEFAULT '>',
  target_value DECIMAL NOT NULL,
  deadline DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'failed', 'cancelled')) DEFAULT 'active',
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_goals_kpi ON kpi_goals(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_goals_status ON kpi_goals(status);
CREATE INDEX IF NOT EXISTS idx_kpi_goals_deadline ON kpi_goals(deadline);

-- =====================================================
-- TABELA: goal_actions (Plano de Acao 5W2H)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.goal_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES kpi_goals(id) ON DELETE CASCADE,
  -- 5W2H
  what TEXT NOT NULL,                          -- O que?
  why TEXT,                                    -- Por que?
  where_location TEXT,                         -- Onde?
  when_date DATE,                              -- Quando?
  who UUID REFERENCES profiles(id),            -- Quem?
  how TEXT,                                    -- Como?
  how_much DECIMAL,                            -- Quanto custa?
  -- Status
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_actions_goal ON goal_actions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_actions_who ON goal_actions(who);
CREATE INDEX IF NOT EXISTS idx_goal_actions_status ON goal_actions(status);

-- =====================================================
-- TRIGGERS para updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_kpi_goals_updated_at ON kpi_goals;
CREATE TRIGGER update_kpi_goals_updated_at
  BEFORE UPDATE ON kpi_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goal_actions_updated_at ON goal_actions;
CREATE TRIGGER update_goal_actions_updated_at
  BEFORE UPDATE ON goal_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCAO: Verificar se meta foi atingida
-- =====================================================
CREATE OR REPLACE FUNCTION check_goal_completion()
RETURNS TRIGGER AS $$
DECLARE
  goal_record RECORD;
  kpi_current_value DECIMAL;
BEGIN
  -- Buscar metas ativas do KPI
  FOR goal_record IN
    SELECT g.*, k.current_value
    FROM kpi_goals g
    JOIN kpis k ON k.id = g.kpi_id
    WHERE g.kpi_id = NEW.kpi_id
      AND g.status = 'active'
  LOOP
    kpi_current_value := goal_record.current_value;

    -- Verificar se meta foi atingida baseado no operador
    IF (goal_record.target_operator = '>' AND kpi_current_value > goal_record.target_value) OR
       (goal_record.target_operator = '>=' AND kpi_current_value >= goal_record.target_value) OR
       (goal_record.target_operator = '<' AND kpi_current_value < goal_record.target_value) OR
       (goal_record.target_operator = '<=' AND kpi_current_value <= goal_record.target_value) OR
       (goal_record.target_operator = '=' AND kpi_current_value = goal_record.target_value) THEN

      -- Marcar meta como completada
      UPDATE kpi_goals
      SET status = 'completed',
          completed_at = NOW()
      WHERE id = goal_record.id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar metas quando KPI valor e atualizado
DROP TRIGGER IF EXISTS trigger_check_goal_completion ON kpi_values;
CREATE TRIGGER trigger_check_goal_completion
AFTER INSERT ON kpi_values
FOR EACH ROW
EXECUTE FUNCTION check_goal_completion();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE kpi_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_actions ENABLE ROW LEVEL SECURITY;

-- KPI Goals policies
DROP POLICY IF EXISTS kpi_goals_select ON kpi_goals;
CREATE POLICY kpi_goals_select ON kpi_goals FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS kpi_goals_insert ON kpi_goals;
CREATE POLICY kpi_goals_insert ON kpi_goals FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS kpi_goals_update ON kpi_goals;
CREATE POLICY kpi_goals_update ON kpi_goals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS kpi_goals_delete ON kpi_goals;
CREATE POLICY kpi_goals_delete ON kpi_goals FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Goal Actions policies
DROP POLICY IF EXISTS goal_actions_select ON goal_actions;
CREATE POLICY goal_actions_select ON goal_actions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS goal_actions_insert ON goal_actions;
CREATE POLICY goal_actions_insert ON goal_actions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS goal_actions_update ON goal_actions;
CREATE POLICY goal_actions_update ON goal_actions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS goal_actions_delete ON goal_actions;
CREATE POLICY goal_actions_delete ON goal_actions FOR DELETE TO authenticated USING (created_by = auth.uid());
