-- PDI Tracker - Intranet ODuo
-- Migration: OKRs + Comunicados + Calendario + Diretorio + Base de Conhecimento
-- Execute APOS o supabase-schema.sql

-- =====================================================
-- PARTE 1: NOVOS ENUMS
-- =====================================================

-- OKR Enums
CREATE TYPE okr_level AS ENUM ('company', 'area', 'head', 'individual');
CREATE TYPE okr_status AS ENUM ('draft', 'pending_validation', 'approved', 'rejected', 'tracking', 'completed');
CREATE TYPE area_type AS ENUM ('vendas', 'marketing', 'tech', 'operacoes', 'pessoas', 'financeiro');

-- Comunicados Enums
CREATE TYPE announcement_scope AS ENUM ('company', 'department', 'team');
CREATE TYPE announcement_priority AS ENUM ('normal', 'important', 'urgent');

-- Calendario Enums
CREATE TYPE event_type AS ENUM ('meeting', 'training', 'holiday', 'deadline', 'personal', 'team', 'company');
CREATE TYPE event_visibility AS ENUM ('private', 'team', 'department', 'company');
CREATE TYPE rsvp_status AS ENUM ('pending', 'accepted', 'declined', 'maybe');

-- Base de Conhecimento Enums
CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');

-- =====================================================
-- PARTE 2: ATUALIZAR TABELA PROFILES
-- =====================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS area area_type,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS office_location TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_area ON public.profiles(area);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);

-- =====================================================
-- PARTE 3: TABELAS DE OKRs
-- =====================================================

-- Ciclos de OKR
CREATE TABLE public.okr_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Objectives (OKRs)
CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.okr_cycles(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_objective_id UUID REFERENCES public.objectives(id) ON DELETE SET NULL,

  level okr_level NOT NULL,
  area area_type,

  title TEXT NOT NULL,
  description TEXT,
  status okr_status DEFAULT 'draft',

  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMPTZ,
  validation_notes TEXT,

  current_score DECIMAL(3,1) DEFAULT 0 CHECK (current_score >= 0 AND current_score <= 10),
  final_score DECIMAL(3,1) CHECK (final_score >= 0 AND final_score <= 10),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT area_required_for_levels CHECK (
    (level IN ('area', 'head') AND area IS NOT NULL) OR
    (level IN ('company', 'individual'))
  )
);

-- Key Results
CREATE TABLE public.key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,

  metric_type TEXT NOT NULL DEFAULT 'number',
  start_value DECIMAL(15,2) DEFAULT 0,
  target_value DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) DEFAULT 0,
  unit TEXT,

  current_score DECIMAL(3,1) DEFAULT 0 CHECK (current_score >= 0 AND current_score <= 10),
  position INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check-ins mensais
CREATE TABLE public.kr_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id UUID NOT NULL REFERENCES public.key_results(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),

  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  previous_value DECIMAL(15,2),
  new_value DECIMAL(15,2) NOT NULL,
  score DECIMAL(3,1) NOT NULL CHECK (score >= 0 AND score <= 10),

  notes TEXT,
  blockers TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(key_result_id, check_in_date)
);

-- Comentarios em OKRs
CREATE TABLE public.okr_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID REFERENCES public.objectives(id) ON DELETE CASCADE,
  key_result_id UUID REFERENCES public.key_results(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),

  content TEXT NOT NULL,
  is_validation_feedback BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes OKRs
CREATE INDEX idx_objectives_cycle ON public.objectives(cycle_id);
CREATE INDEX idx_objectives_owner ON public.objectives(owner_id);
CREATE INDEX idx_objectives_parent ON public.objectives(parent_objective_id);
CREATE INDEX idx_objectives_level ON public.objectives(level);
CREATE INDEX idx_objectives_area ON public.objectives(area);
CREATE INDEX idx_objectives_status ON public.objectives(status);
CREATE INDEX idx_key_results_objective ON public.key_results(objective_id);
CREATE INDEX idx_kr_check_ins_kr ON public.kr_check_ins(key_result_id);
CREATE INDEX idx_kr_check_ins_date ON public.kr_check_ins(check_in_date DESC);
CREATE INDEX idx_okr_comments_objective ON public.okr_comments(objective_id);

-- =====================================================
-- PARTE 4: TABELAS DE COMUNICADOS
-- =====================================================

-- Categorias de comunicados
CREATE TABLE public.announcement_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comunicados
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  scope announcement_scope DEFAULT 'company',
  priority announcement_priority DEFAULT 'normal',
  department TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link comunicados-categorias
CREATE TABLE public.announcement_category_links (
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.announcement_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (announcement_id, category_id)
);

-- Leituras de comunicados
CREATE TABLE public.announcement_reads (
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (announcement_id, user_id)
);

-- Indexes comunicados
CREATE INDEX idx_announcements_author ON public.announcements(author_id);
CREATE INDEX idx_announcements_published ON public.announcements(is_published, published_at DESC);
CREATE INDEX idx_announcements_pinned ON public.announcements(is_pinned, published_at DESC);
CREATE INDEX idx_announcements_scope ON public.announcements(scope);
CREATE INDEX idx_announcement_reads_user ON public.announcement_reads(user_id);

-- =====================================================
-- PARTE 5: TABELAS DE CALENDARIO/EVENTOS
-- =====================================================

-- Eventos
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_type event_type DEFAULT 'meeting',
  visibility event_visibility DEFAULT 'team',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  color TEXT DEFAULT '#3B82F6',
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convidados/RSVP
CREATE TABLE public.event_invitees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rsvp_status rsvp_status DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Indexes eventos
CREATE INDEX idx_events_creator ON public.events(creator_id);
CREATE INDEX idx_events_start ON public.events(start_time);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_events_visibility ON public.events(visibility);
CREATE INDEX idx_event_invitees_user ON public.event_invitees(user_id);
CREATE INDEX idx_event_invitees_event ON public.event_invitees(event_id);

-- =====================================================
-- PARTE 6: TABELAS DA BASE DE CONHECIMENTO
-- =====================================================

-- Categorias KB
CREATE TABLE public.kb_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  parent_id UUID REFERENCES public.kb_categories(id),
  department TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artigos KB
CREATE TABLE public.kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.kb_categories(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  status article_status DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  department TEXT,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Versoes de artigos
CREATE TABLE public.kb_article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags KB
CREATE TABLE public.kb_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link artigos-tags
CREATE TABLE public.kb_article_tags (
  article_id UUID REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.kb_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Favoritos KB
CREATE TABLE public.kb_bookmarks (
  article_id UUID REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (article_id, user_id)
);

-- Indexes KB
CREATE INDEX idx_kb_articles_category ON public.kb_articles(category_id);
CREATE INDEX idx_kb_articles_author ON public.kb_articles(author_id);
CREATE INDEX idx_kb_articles_status ON public.kb_articles(status, published_at DESC);
CREATE INDEX idx_kb_articles_featured ON public.kb_articles(is_featured, published_at DESC);
CREATE INDEX idx_kb_categories_parent ON public.kb_categories(parent_id);
CREATE INDEX idx_kb_article_versions_article ON public.kb_article_versions(article_id);

-- =====================================================
-- PARTE 7: TABELA DE NOTIFICACOES IN-APP
-- =====================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  related_user_id UUID REFERENCES public.profiles(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- =====================================================
-- PARTE 8: RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.okr_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kr_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okr_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_category_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invitees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- OKR CYCLES POLICIES
CREATE POLICY "Everyone can view cycles" ON public.okr_cycles
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage cycles" ON public.okr_cycles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- OBJECTIVES POLICIES
CREATE POLICY "Company OKRs visible to all" ON public.objectives
  FOR SELECT USING (level = 'company');

CREATE POLICY "Area OKRs visible to all" ON public.objectives
  FOR SELECT USING (level = 'area');

CREATE POLICY "Head OKRs visible to area" ON public.objectives
  FOR SELECT USING (
    level = 'head' AND (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.area = objectives.area) OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
    )
  );

CREATE POLICY "Users view own individual OKRs" ON public.objectives
  FOR SELECT USING (level = 'individual' AND owner_id = auth.uid());

CREATE POLICY "Managers view team OKRs" ON public.objectives
  FOR SELECT USING (
    level = 'individual' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = owner_id AND manager_id = auth.uid())
  );

CREATE POLICY "Admins view all objectives" ON public.objectives
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users create individual OKRs" ON public.objectives
  FOR INSERT WITH CHECK (auth.uid() = owner_id AND level = 'individual');

CREATE POLICY "Admins create any OKR" ON public.objectives
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users update own draft OKRs" ON public.objectives
  FOR UPDATE USING (owner_id = auth.uid() AND status IN ('draft', 'rejected'));

CREATE POLICY "Managers validate team OKRs" ON public.objectives
  FOR UPDATE USING (
    level = 'individual' AND status = 'pending_validation' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = owner_id AND manager_id = auth.uid())
  );

CREATE POLICY "Admins update any OKR" ON public.objectives
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users delete own draft OKRs" ON public.objectives
  FOR DELETE USING (owner_id = auth.uid() AND status = 'draft');

-- KEY RESULTS POLICIES
CREATE POLICY "View KRs with objective access" ON public.key_results
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.objectives WHERE id = objective_id));

CREATE POLICY "Users manage own KRs" ON public.key_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.objectives WHERE id = objective_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admins manage all KRs" ON public.key_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- CHECK-INS POLICIES
CREATE POLICY "View accessible check-ins" ON public.kr_check_ins
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.key_results WHERE id = key_result_id));

CREATE POLICY "Create own check-ins" ON public.kr_check_ins
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.key_results kr
      JOIN public.objectives o ON o.id = kr.objective_id
      WHERE kr.id = key_result_id AND o.owner_id = auth.uid()
    )
  );

-- OKR COMMENTS POLICIES
CREATE POLICY "View comments on accessible OKRs" ON public.okr_comments
  FOR SELECT USING (
    (objective_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.objectives WHERE id = objective_id)) OR
    (key_result_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.key_results WHERE id = key_result_id))
  );

CREATE POLICY "Create comments" ON public.okr_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ANNOUNCEMENTS POLICIES
CREATE POLICY "View categories" ON public.announcement_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins manage categories" ON public.announcement_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "View published announcements" ON public.announcements
  FOR SELECT USING (
    is_published = true AND
    (scope = 'company' OR
     (scope = 'department' AND department = (SELECT department FROM public.profiles WHERE id = auth.uid())) OR
     (scope = 'team' AND author_id = (SELECT manager_id FROM public.profiles WHERE id = auth.uid())))
  );

CREATE POLICY "Managers create announcements" ON public.announcements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
  );

CREATE POLICY "Authors manage own announcements" ON public.announcements
  FOR ALL USING (author_id = auth.uid());

CREATE POLICY "Admins manage all announcements" ON public.announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "View category links" ON public.announcement_category_links
  FOR SELECT USING (true);

CREATE POLICY "Manage category links" ON public.announcement_category_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_id AND (a.author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Track own reads" ON public.announcement_reads
  FOR ALL USING (user_id = auth.uid());

-- EVENTS POLICIES
CREATE POLICY "View accessible events" ON public.events
  FOR SELECT USING (
    visibility = 'company' OR
    creator_id = auth.uid() OR
    (visibility = 'department' AND department = (SELECT department FROM public.profiles WHERE id = auth.uid())) OR
    (visibility = 'team' AND (
      creator_id = (SELECT manager_id FROM public.profiles WHERE id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND manager_id = creator_id)
    )) OR
    EXISTS (SELECT 1 FROM public.event_invitees WHERE event_id = events.id AND user_id = auth.uid())
  );

CREATE POLICY "Users create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators manage events" ON public.events
  FOR ALL USING (creator_id = auth.uid());

CREATE POLICY "Admins manage all events" ON public.events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "View invitees" ON public.event_invitees
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id)
  );

CREATE POLICY "Manage own RSVP" ON public.event_invitees
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Creators manage invitees" ON public.event_invitees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND creator_id = auth.uid())
  );

-- KB POLICIES
CREATE POLICY "View categories" ON public.kb_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins manage KB categories" ON public.kb_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "View published articles" ON public.kb_articles
  FOR SELECT USING (
    status = 'published' AND
    (department IS NULL OR
     department = (SELECT department FROM public.profiles WHERE id = auth.uid()) OR
     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  );

CREATE POLICY "Authors view own drafts" ON public.kb_articles
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Managers create articles" ON public.kb_articles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gestor'))
  );

CREATE POLICY "Authors update articles" ON public.kb_articles
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Admins manage all articles" ON public.kb_articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "View versions" ON public.kb_article_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.kb_articles WHERE id = article_id)
  );

CREATE POLICY "Create versions" ON public.kb_article_versions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.kb_articles WHERE id = article_id AND author_id = auth.uid())
  );

CREATE POLICY "View tags" ON public.kb_tags
  FOR SELECT USING (true);

CREATE POLICY "Admins manage tags" ON public.kb_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "View article tags" ON public.kb_article_tags
  FOR SELECT USING (true);

CREATE POLICY "Manage article tags" ON public.kb_article_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.kb_articles WHERE id = article_id AND author_id = auth.uid())
  );

CREATE POLICY "Manage own bookmarks" ON public.kb_bookmarks
  FOR ALL USING (user_id = auth.uid());

-- NOTIFICATIONS POLICIES
CREATE POLICY "View own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- PARTE 9: FUNCOES E TRIGGERS
-- =====================================================

-- Funcao para calcular score do KR
CREATE OR REPLACE FUNCTION public.calculate_kr_score(
  p_start_value DECIMAL,
  p_target_value DECIMAL,
  p_current_value DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  progress DECIMAL;
BEGIN
  IF p_target_value = p_start_value THEN
    RETURN CASE WHEN p_current_value >= p_target_value THEN 10 ELSE 0 END;
  END IF;

  progress := (p_current_value - p_start_value) / (p_target_value - p_start_value);
  progress := GREATEST(0, LEAST(1.2, progress));

  RETURN ROUND(progress * 10, 1);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar score do KR
CREATE OR REPLACE FUNCTION public.update_kr_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_score := public.calculate_kr_score(
    NEW.start_value,
    NEW.target_value,
    NEW.current_value
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kr_score_on_change
  BEFORE UPDATE OF current_value ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.update_kr_score();

-- Trigger para atualizar score do objective (media dos KRs)
CREATE OR REPLACE FUNCTION public.update_objective_score()
RETURNS TRIGGER AS $$
DECLARE
  avg_score DECIMAL;
BEGIN
  SELECT COALESCE(AVG(current_score), 0) INTO avg_score
  FROM public.key_results
  WHERE objective_id = COALESCE(NEW.objective_id, OLD.objective_id);

  UPDATE public.objectives
  SET current_score = ROUND(avg_score, 1), updated_at = NOW()
  WHERE id = COALESCE(NEW.objective_id, OLD.objective_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_objective_score_on_kr_change
  AFTER INSERT OR UPDATE OF current_score OR DELETE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.update_objective_score();

-- Funcao para validar max 3 KRs por OKR individual
CREATE OR REPLACE FUNCTION public.check_kr_limit()
RETURNS TRIGGER AS $$
DECLARE
  kr_count INTEGER;
  obj_level okr_level;
BEGIN
  SELECT level INTO obj_level FROM public.objectives WHERE id = NEW.objective_id;

  IF obj_level = 'individual' THEN
    SELECT COUNT(*) INTO kr_count
    FROM public.key_results
    WHERE objective_id = NEW.objective_id;

    IF kr_count >= 3 THEN
      RAISE EXCEPTION 'OKRs individuais podem ter no maximo 3 Key Results';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_kr_limit
  BEFORE INSERT ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.check_kr_limit();

-- Funcao para validar hierarquia de OKRs
CREATE OR REPLACE FUNCTION public.validate_okr_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.level = 'individual' THEN
    IF NEW.parent_objective_id IS NULL THEN
      RAISE EXCEPTION 'OKRs individuais devem estar vinculados a um OKR de area';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.objectives
      WHERE id = NEW.parent_objective_id AND level IN ('area', 'head')
    ) THEN
      RAISE EXCEPTION 'OKRs individuais devem vincular a OKRs de nivel area ou head';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_okr_hierarchy_on_insert
  BEFORE INSERT OR UPDATE ON public.objectives
  FOR EACH ROW EXECUTE FUNCTION public.validate_okr_hierarchy();

-- Funcao para gerar slug
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at nas novas tabelas
CREATE TRIGGER set_okr_cycles_updated_at
  BEFORE UPDATE ON public.okr_cycles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_objectives_updated_at
  BEFORE UPDATE ON public.objectives
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_key_results_updated_at
  BEFORE UPDATE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_kb_categories_updated_at
  BEFORE UPDATE ON public.kb_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_kb_articles_updated_at
  BEFORE UPDATE ON public.kb_articles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
