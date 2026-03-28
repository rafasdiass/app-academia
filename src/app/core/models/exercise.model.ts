// ─────────────────────────────────────────────────────────────────
// exercise.model.ts
// ─────────────────────────────────────────────────────────────────

// CORREÇÃO TS2307: './base.model' → '@core/models/base.model'
// base.model e exercise.model estão em subpastas diferentes —
// o path relativo não resolve. Usa alias absoluto do tsconfig.
import { ColorTheme } from '@core/models/base.model'

export type Protocol = 'RPT' | 'MYO' | 'STRAIGHT' | 'PAUSE' | 'RPT_HALF'
export type BodyFlag  = 'JOELHO' | 'LOMBAR' | '90° MÁX'

/**
 * Template de exercício como definido no plano (prescrição).
 */
export interface ExerciseTemplate {
  id:           string
  name:         string
  muscle:       string
  color:        ColorTheme
  protocol:     Protocol
  flag:         BodyFlag | null
  sets:         SetTemplate[]
  scienceNote:  string | null
  /** Texto right-aligned no header do card (.pyr-sub) */
  subtitle:     string | null
  /**
   * Número total de rodadas / blocos deste exercício.
   * RPT: 3 | MYO: nº de rodadas completas | STRAIGHT: nº de séries
   */
  totalRounds:  number
}

/**
 * Template de série como prescrito no plano.
 */
export interface SetTemplate {
  index:      number
  label:      SetLabelType
  loadPct:    string | null
  reps:       string
  repsNote:   string | null
  isoNote:    string | null
  restSec:    number
  restNote:   string | null
  techBadges: string[]
}

export type SetLabelType =
  | 'TOP SET'
  | 'SÉRIE 1'
  | 'SÉRIE 2'
  | 'SÉRIE 3'
  | 'ATIVAÇÃO'
  | 'MINI ×1'
  | 'MINI ×2'
  | 'MINI ×3'
  | 'MINI ×4'
  | 'RODADA 2'
  | 'AQUEC. A'
  | 'AQUEC. B'

export type SetVisualStyle =
  | 'top-set'
  | 'set2'
  | 'set3'
  | 'myo-act'
  | 'myo-mini'
  | 'warmup'
  | 'default'
