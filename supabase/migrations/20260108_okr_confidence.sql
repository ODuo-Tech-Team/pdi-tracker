-- Migration: OKR Confidence Levels
-- Adiciona campo de nivel de confianca aos check-ins de Key Results

-- =====================================================
-- CAMPO: confidence em kr_check_ins
-- =====================================================
ALTER TABLE kr_check_ins
ADD COLUMN IF NOT EXISTS confidence TEXT
CHECK (confidence IN ('green', 'yellow', 'red')) DEFAULT 'green';

-- Comentario explicativo
COMMENT ON COLUMN kr_check_ins.confidence IS 'Nivel de confianca: green (on-track), yellow (at-risk), red (off-track)';

-- =====================================================
-- TRIGGER: Atualizar score do KR e propagar para Objective
-- =====================================================
CREATE OR REPLACE FUNCTION update_kr_and_objective_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar current_value e current_score do Key Result
  UPDATE key_results
  SET current_value = NEW.new_value,
      current_score = NEW.score,
      updated_at = NOW()
  WHERE id = NEW.key_result_id;

  -- Atualizar score do Objective (media dos KRs)
  UPDATE objectives o
  SET current_score = (
    SELECT COALESCE(AVG(current_score), 0)
    FROM key_results
    WHERE objective_id = o.id
  ),
  updated_at = NOW()
  WHERE id = (SELECT objective_id FROM key_results WHERE id = NEW.key_result_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger se existir e recriar
DROP TRIGGER IF EXISTS trigger_update_kr_score ON kr_check_ins;
CREATE TRIGGER trigger_update_kr_score
AFTER INSERT ON kr_check_ins
FOR EACH ROW
EXECUTE FUNCTION update_kr_and_objective_score();

-- =====================================================
-- TRIGGER: Propagar score para Objective pai
-- =====================================================
CREATE OR REPLACE FUNCTION propagate_score_to_parent()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o objective tem um pai, atualizar o score do pai
  IF NEW.parent_objective_id IS NOT NULL THEN
    UPDATE objectives
    SET current_score = (
      SELECT COALESCE(AVG(current_score), 0)
      FROM objectives
      WHERE parent_objective_id = NEW.parent_objective_id
    ),
    updated_at = NOW()
    WHERE id = NEW.parent_objective_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger se existir e recriar
DROP TRIGGER IF EXISTS trigger_propagate_score ON objectives;
CREATE TRIGGER trigger_propagate_score
AFTER UPDATE OF current_score ON objectives
FOR EACH ROW
EXECUTE FUNCTION propagate_score_to_parent();
