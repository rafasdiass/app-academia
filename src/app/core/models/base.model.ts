// ─────────────────────────────────────────────────────────────────
// base.model.ts
// Tipos primitivos reutilizados por 2 ou mais models.
// Nenhum import externo — zero dependências circulares.
// ─────────────────────────────────────────────────────────────────

/**
 * Tipo de treino (bloco do plano).
 * Usado em WorkoutPlan e Session.
 */
export type TreinoType = 'A' | 'B' | 'C' | 'D'

/**
 * Paleta de cores disponível para temas de treino e protocolos.
 * Usado em TreinoBlock, ExerciseTemplate e pipes de cor.
 */
export type ColorTheme =
  | 'rose'
  | 'teal'
  | 'blue'
  | 'orange'
  | 'purple'
  | 'amber'
  | 'green'
