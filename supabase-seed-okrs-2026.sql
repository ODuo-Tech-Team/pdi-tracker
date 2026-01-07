-- PDI Tracker - ODuo
-- Seed: OKRs 2026 (Empresa + Areas)
-- Execute APOS o supabase-migration-intranet.sql

-- =====================================================
-- CICLO DE OKR 2026
-- =====================================================

INSERT INTO public.okr_cycles (id, name, start_date, end_date, is_active)
VALUES (
  'c0000000-0000-0000-0000-000000002026',
  '2026 Anual',
  '2026-01-01',
  '2026-12-31',
  true
);

-- =====================================================
-- OKRs NIVEL EMPRESA (4 OKRs)
-- =====================================================

-- OKR 1: Escalar com crescimento agressivo
INSERT INTO public.objectives (id, cycle_id, level, title, description, status)
VALUES (
  'o0000000-0001-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000002026',
  'company',
  'Escalar a ODuo com crescimento agressivo e previsivel',
  'Transformar a ODuo em uma maquina previsivel de aquisicao de clientes, capaz de escalar 5x sem perder controle operacional.',
  'tracking'
);

INSERT INTO public.key_results (objective_id, title, metric_type, start_value, target_value, unit, position) VALUES
('o0000000-0001-0000-0000-000000000001', 'Alcancar R$ 10.000.000 de faturamento anual', 'currency', 0, 10000000, 'R$', 1),
('o0000000-0001-0000-0000-000000000001', 'Atingir 380 clientes ativos na base', 'number', 0, 380, 'clientes', 2),
('o0000000-0001-0000-0000-000000000001', 'Nenhum canal represente mais de 40% da aquisicao', 'percentage', 100, 40, '%', 3);

-- OKR 2: Dobrar LTV
INSERT INTO public.objectives (id, cycle_id, level, title, description, status)
VALUES (
  'o0000000-0001-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000002026',
  'company',
  'Dobrar o LTV atraves de retencao, recorrencia e expansao de valor',
  'Construir uma base de clientes que fique mais tempo, gere mais valor e cresca junto com a ODuo.',
  'tracking'
);

INSERT INTO public.key_results (objective_id, title, metric_type, start_value, target_value, unit, position) VALUES
('o0000000-0001-0000-0000-000000000002', 'Reduzir o churn anual para <= 5%', 'percentage', 100, 5, '%', 1),
('o0000000-0001-0000-0000-000000000002', 'Aumentar o Lifetime medio do cliente de 6 para 12 meses', 'number', 6, 12, 'meses', 2),
('o0000000-0001-0000-0000-000000000002', '>= 30% da base ative ao menos 1 upsell ou expansao', 'percentage', 0, 30, '%', 3),
('o0000000-0001-0000-0000-000000000002', 'Atingir retencao de 90% nos primeiros 90 dias', 'percentage', 0, 90, '%', 4);

-- OKR 3: Elevar experiencia do cliente
INSERT INTO public.objectives (id, cycle_id, level, title, description, status)
VALUES (
  'o0000000-0001-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000002026',
  'company',
  'Elevar drasticamente a experiencia do cliente e a qualidade percebida',
  'Tornar a experiencia ODuo clara, previsivel e profissional em escala.',
  'tracking'
);

INSERT INTO public.key_results (objective_id, title, metric_type, start_value, target_value, unit, position) VALUES
('o0000000-0001-0000-0000-000000000003', 'Elevar o NPS medio de 28% para 60%', 'percentage', 28, 60, '%', 1),
('o0000000-0001-0000-0000-000000000003', '100% dos clientes tenham onboarding padronizado', 'percentage', 0, 100, '%', 2),
('o0000000-0001-0000-0000-000000000003', '>= 80% de cumprimento de SLA operacional', 'percentage', 0, 80, '%', 3);

-- OKR 4: Estruturar empresa para crescer
INSERT INTO public.objectives (id, cycle_id, level, title, description, status)
VALUES (
  'o0000000-0001-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000002026',
  'company',
  'Estruturar a empresa para crescer rapido sem colapsar',
  'Criar uma operacao simples, padronizada e replicavel, preparada para escalar.',
  'tracking'
);

INSERT INTO public.key_results (objective_id, title, metric_type, start_value, target_value, unit, position) VALUES
('o0000000-0001-0000-0000-000000000004', 'Documentar 100% dos processos criticos no ClickUp', 'percentage', 0, 100, '%', 1),
('o0000000-0001-0000-0000-000000000004', '100% das areas operem com KPIs claros e rituais mensais', 'percentage', 0, 100, '%', 2),
('o0000000-0001-0000-0000-000000000004', 'Manter margem minima saudavel > 10%', 'percentage', 0, 10, '%', 3),
('o0000000-0001-0000-0000-000000000004', 'Automatizar 60% dos processos do CORE', 'percentage', 0, 60, '%', 4);

-- =====================================================
-- OKRs NIVEL AREA (6 Areas)
-- =====================================================

-- VENDAS
INSERT INTO public.objectives (id, cycle_id, level, area, title, description, status, parent_objective_id)
VALUES (
  'o0000000-0002-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000002026',
  'area',
  'vendas',
  'Escalar vendas com previsibilidade e qualidade',
  'Sustentar o crescimento da ODuo com vendas previsiveis.',
  'tracking',
  'o0000000-0001-0000-0000-000000000001'
);

INSERT INTO public.key_results (objective_id, title, metric_type, start_value, target_value, unit, position) VALUES
('o0000000-0002-0000-0000-000000000001', 'Fechar 334 novos clientes no ano', 'number', 0, 334, 'clientes', 1),
('o0000000-0002-0000-0000-000000000001', 'Gerar R$ 3.005.461,72 em recebimentos (NF)', 'currency', 0, 3005461.72, 'R$', 2),
('o0000000-0002-0000-0000-000000000001', 'Manter Lifetime medio dos clientes em 12 meses', 'number', 0, 12, 'meses', 3),
('o0000000-0002-0000-0000-000000000001', 'Realizar 2.783 reunioes agendadas no ano', 'number', 0, 2783, 'reunioes', 4);

-- MARKETING
INSERT INTO public.objectives (id, cycle_id, level, area, title, description, status, parent_objective_id)
VALUES (
  'o0000000-0002-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000002026',
  'area',
  'marketing',
  'Construir uma maquina previsivel de geracao de demanda qualificada',
  'Gerar leads qualificados de forma consistente.',
  'tracking',
  'o0000000-0001-0000-0000-000000000001'
);

INSERT INTO public.key_results (objective_id, title, metric_type, start_value, target_value, unit, position) VALUES
('o0000000-0002-0000-0000-000000000002', 'Gerar 21.406 leads qualificados ao longo do ano', 'number', 0, 21406, 'leads', 1),
('o0000000-0002-0000-0000-000000000002', 'Manter taxa de qualificacao media de 40%', 'percentage', 0, 40, '%', 2),
('o0000000-0002-0000-0000-000000000002', 'Sustentar CPL medio de ate R$ 50,00', 'currency', 100, 50, 'R$', 3),
('o0000000-0002-0000-0000-000000000002', 'Atingir ROAS medio de 2,8', 'number', 0, 2.8, 'x', 4);

-- TECH
INSERT INTO public.objectives (id, cycle_id, level, area, title, description, status, parent_objective_id)
VALUES (
  'o0000000-0002-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000002026',
  'area',
  'tech',
  'Garantir estabilidade, confiabilidade e retencao da base tecnologica',
  'Manter a base tecnologica estavel e confiavel.',
  'tracking',
  'o0000000-0001-0000-0000-000000000002'
);

INSERT INTO public.key_results (objective_id, title, metric_type, start_value, target_value, unit, position) VALUES
('o0000000-0002-0000-0000-000000000003', 'Atingir satisfacao dos usuarios (Tech) >= 8', 'number', 0, 8, 'pontos', 1),
('o0000000-0002-0000-0000-000000000003', 'Manter Lifetime medio (Tech) em 12 meses', 'number', 0, 12, 'meses', 2),
('o0000000-0002-0000-0000-000000000003', 'Sustentar churn tecnico <= 5%', 'percentage', 100, 5, '%', 3);

-- OPERACOES
INSERT INTO public.objectives (id, cycle_id, level, area, title, description, status, parent_objective_id)
VALUES (
  'o0000000-0002-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000002026',
  'area',
  'operacoes',
  'Operar a ODuo com excelencia, garantindo retencao e experiencia',
  'Operar com excelencia e garantir a experiencia do cliente em escala.',
  'tracking',
  'o0000000-0001-0000-0000-000000000003'
);

INSERT INTO public.key_results (objective_id, title, metric_type, start_value, target_value, unit, position) VALUES
('o0000000-0002-0000-0000-000000000004', 'Manter churn operacional <= 5%', 'percentage', 100, 5, '%', 1),
('o0000000-0002-0000-0000-000000000004', 'Sustentar Lifetime medio dos clientes em 12 meses', 'number', 0, 12, 'meses', 2),
('o0000000-0002-0000-0000-000000000004', 'Atingir NPS medio de 60%', 'percentage', 0, 60, '%', 3);

-- PESSOAS
INSERT INTO public.objectives (id, cycle_id, level, area, title, description, status, parent_objective_id)
VALUES (
  'o0000000-0002-0000-0000-000000000005',
  'c0000000-0000-0000-0000-000000002026',
  'area',
  'pessoas',
  'Escalar o time mantendo alto engajamento, velocidade e cultura forte',
  'Crescer a equipe mantendo a cultura e engajamento.',
  'tracking',
  'o0000000-0001-0000-0000-000000000004'
);

INSERT INTO public.key_results (objective_id, title, metric_type, start_value, target_value, unit, position) VALUES
('o0000000-0002-0000-0000-000000000005', 'Atingir eNPS de 90', 'number', 0, 90, 'pontos', 1),
('o0000000-0002-0000-0000-000000000005', 'Preencher vagas em ate 15 dias em media', 'number', 30, 15, 'dias', 2),
('o0000000-0002-0000-0000-000000000005', 'Viabilizar crescimento de equipe para 60 pessoas', 'number', 0, 60, 'pessoas', 3);

-- FINANCEIRO
INSERT INTO public.objectives (id, cycle_id, level, area, title, description, status, parent_objective_id)
VALUES (
  'o0000000-0002-0000-0000-000000000006',
  'c0000000-0000-0000-0000-000000002026',
  'area',
  'financeiro',
  'Garantir seguranca financeira durante o crescimento acelerado',
  'Manter a seguranca financeira enquanto a empresa cresce.',
  'tracking',
  'o0000000-0001-0000-0000-000000000004'
);

INSERT INTO public.key_results (objective_id, title, metric_type, start_value, target_value, unit, position) VALUES
('o0000000-0002-0000-0000-000000000006', 'Manter reserva de caixa minima de R$ 400.000', 'currency', 0, 400000, 'R$', 1),
('o0000000-0002-0000-0000-000000000006', 'Executar controle de gastos com reducao de 10%', 'percentage', 0, 10, '%', 2);

-- =====================================================
-- CATEGORIAS INICIAIS PARA COMUNICADOS
-- =====================================================

INSERT INTO public.announcement_categories (name, color) VALUES
('Geral', '#6B7280'),
('RH', '#10B981'),
('Financeiro', '#F59E0B'),
('Tecnologia', '#3B82F6'),
('Comercial', '#8B5CF6'),
('Eventos', '#EC4899');

-- =====================================================
-- CATEGORIAS INICIAIS PARA BASE DE CONHECIMENTO
-- =====================================================

INSERT INTO public.kb_categories (name, slug, description, icon, sort_order) VALUES
('Onboarding', 'onboarding', 'Materiais para novos colaboradores', 'user-plus', 1),
('Processos', 'processos', 'Documentacao de processos internos', 'workflow', 2),
('Politicas', 'politicas', 'Politicas e regras da empresa', 'shield', 3),
('Ferramentas', 'ferramentas', 'Guias de uso das ferramentas', 'wrench', 4),
('Vendas', 'vendas', 'Materiais do time comercial', 'trending-up', 5),
('Marketing', 'marketing', 'Materiais do time de marketing', 'megaphone', 6),
('Tech', 'tech', 'Documentacao tecnica', 'code', 7),
('RH', 'rh', 'Recursos Humanos', 'users', 8);

-- =====================================================
-- FIM DO SEED
-- =====================================================
