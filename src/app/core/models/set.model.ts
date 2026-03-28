// ─────────────────────────────────────────────────────────────────
// set.model.ts
// Log de execução de série (Fase 2).
// ─────────────────────────────────────────────────────────────────
import { SetLabelType } from './exercise.model'

/**
 * Log de execução de uma série durante uma sessão de treino.
 * Representa o que o atleta realmente fez (vs SetTemplate = prescrição).
 */
export interface SetLog {
  index:        number
  label:        SetLabelType
  loadKg:       number | null
  repsDone:     number | null
  isoSeconds:   number | null
  restTakenSec: number | null
  completed:    boolean
  notes:        string
}
