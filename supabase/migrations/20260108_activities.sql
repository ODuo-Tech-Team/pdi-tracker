-- Migration: Activities (Log de atividades)
-- Sistema de registro de atividades para OKRs, KPIs, etc.

-- =====================================================
-- TABELA: activities (Log de atividades)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('objective', 'key_result', 'kpi', 'comment', 'goal')),
  entity_id UUID NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'checked_in', 'commented', 'deleted', 'approved', 'rejected')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_actor ON activities(actor_id);
CREATE INDEX IF NOT EXISTS idx_activities_action ON activities(action);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Activities policies
DROP POLICY IF EXISTS activities_select ON activities;
CREATE POLICY activities_select ON activities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS activities_insert ON activities;
CREATE POLICY activities_insert ON activities FOR INSERT TO authenticated WITH CHECK (true);

-- Normalmente atividades nao devem ser deletadas, mas permitir para admins
DROP POLICY IF EXISTS activities_delete ON activities;
CREATE POLICY activities_delete ON activities FOR DELETE TO authenticated USING (false);
