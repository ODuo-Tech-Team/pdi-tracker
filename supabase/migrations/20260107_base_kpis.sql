-- Migration: Base KPIs Table
-- Criar tabela de KPIs se nao existir

-- =====================================================
-- FUNCAO: update_updated_at_column (alias para handle_updated_at)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABELA: kpis (Key Performance Indicators)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  area TEXT,
  owner_id UUID REFERENCES profiles(id),
  metric_type TEXT CHECK (metric_type IN ('number', 'percentage', 'currency', 'boolean')) DEFAULT 'number',
  unit TEXT,
  current_value DECIMAL DEFAULT 0,
  target_value DECIMAL,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
  is_active BOOLEAN DEFAULT true,
  linked_objective_id UUID REFERENCES objectives(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpis_owner ON kpis(owner_id);
CREATE INDEX IF NOT EXISTS idx_kpis_area ON kpis(area);
CREATE INDEX IF NOT EXISTS idx_kpis_active ON kpis(is_active);

-- =====================================================
-- TABELA: kpi_values (Historico de valores)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  value DECIMAL NOT NULL,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_values_kpi ON kpi_values(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_values_recorded ON kpi_values(recorded_at);

-- =====================================================
-- TRIGGER para updated_at em kpis
-- =====================================================
DROP TRIGGER IF EXISTS update_kpis_updated_at ON kpis;
CREATE TRIGGER update_kpis_updated_at
  BEFORE UPDATE ON kpis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;

-- KPIs policies
DROP POLICY IF EXISTS kpis_select ON kpis;
CREATE POLICY kpis_select ON kpis FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS kpis_insert ON kpis;
CREATE POLICY kpis_insert ON kpis FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS kpis_update ON kpis;
CREATE POLICY kpis_update ON kpis FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS kpis_delete ON kpis;
CREATE POLICY kpis_delete ON kpis FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- KPI Values policies
DROP POLICY IF EXISTS kpi_values_select ON kpi_values;
CREATE POLICY kpi_values_select ON kpi_values FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS kpi_values_insert ON kpi_values;
CREATE POLICY kpi_values_insert ON kpi_values FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS kpi_values_delete ON kpi_values;
CREATE POLICY kpi_values_delete ON kpi_values FOR DELETE TO authenticated USING (true);
