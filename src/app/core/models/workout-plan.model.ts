// ─────────────────────────────────────────────────────────────────
// workout-plan.model.ts — espelho exato da estrutura do Firestore
// ─────────────────────────────────────────────────────────────────
import { TreinoType, ColorTheme } from './base.model'
import { ExerciseTemplate }       from './exercise.model'

// ── Header ────────────────────────────────────────────────────────
export interface PlanKpi {
  value: string
  label: string
  sub:   string
}

export interface PlanTag {
  key:      string
  label:    string
  cssClass: string
}

export interface PlanRestriction {
  key:         string
  label:       string
  description: string
}

// ── Perfil da atleta ──────────────────────────────────────────────
export interface AthleteProfile {
  weightKg: number
  heightCm: number
  ageYears: number
}

// ── Grade semanal ─────────────────────────────────────────────────
export interface WeekDay {
  day:        string
  treinoType: TreinoType | null
  cardio:     string | null
  rest:       boolean
  restNote?:  string
}

// ── Periodização ─────────────────────────────────────────────────
export interface PeriodizationWeek {
  week:             number
  phase:            string
  protocol:         string
  loadTopSetPct:    number
  isoTopSetSec:     number
  myoRounds:        number
  sprintKmh:        string
  sprintTiros:      number
  sprintSec:        number
  walkSec:          number
  hiperhidration:   boolean
  creatine:         string
  malto:            string
  abdPhase:         string
}

// ── Nutrição ──────────────────────────────────────────────────────
export interface NutritionDistribution {
  preTreino:  { kcal: string; note: string }
  intraTreino:{ kcal: string; note: string }
  posTreino:  { kcal: number; note: string }
  restDay:    string
}

export interface Nutrition {
  tmb:          number
  tdee:         number
  hiitBonus:    number
  targetKcal:   number
  deficit:      number
  proteinG:     { min: number; max: number }
  carbsG:       number
  fatG:         number
  proteinPerKg: { min: number; max: number }
  distribution: NutritionDistribution
  scienceNotes: string[]
}

// ── Hidratação ────────────────────────────────────────────────────
export interface Hydration {
  protocol:        string
  durationWeeks:   number
  totalLitersDay:  number
  dosesMl:         number
  dosesCount:      number
  scheduleStart:   string
  scheduleEnd:     string
  intervalMin:     number
  gatoradeIntraMl: number
  saltPerDose:     string
  warning:         string
  mechanism:       string
}

// ── Suplementação ─────────────────────────────────────────────────
export interface SupplementPhase {
  label: string
  color: string
  body:  string
}

export interface SupplementDosage {
  value: string
  label: string
}

export interface Supplement {
  name:     string
  icon:     string
  color:    string
  evidence: string
  phases:   SupplementPhase[]
  dosages:  SupplementDosage[]
  note:     string
}

// ── Cardio ────────────────────────────────────────────────────────
export interface SprintPhase {
  weeks:      string
  phase:      string
  kmh:        string
  tiros:      number
  sprintSec:  number
  walkSec:    number
  ratio:      string
  totalMin:   number
  note:       string | null
}

export interface HiitStep {
  num:  string
  name: string
  note: string
  time: string
}

export interface HiitCircuit {
  name:  string
  steps: HiitStep[]
}

export interface Cardio {
  principle:    string
  sprintPhases: SprintPhase[]
  hiitCircuit:  HiitCircuit
  dayC:         string
  kneeNote:     string
}

// ── Abdomen ───────────────────────────────────────────────────────
export interface AbdomenExercise {
  num:  string
  name: string
  desc: string
  sets: string
}

export interface AbdomenPhase {
  weeks:     string
  phase:     string
  duration:  string
  exercises: AbdomenExercise[]
}

export interface Abdomen {
  warning:  string
  stopIf:   string
  phases:   AbdomenPhase[]
}

// ── Protocolos avançados ──────────────────────────────────────────
export interface DuplaPiramideStep {
  num:  number
  pct:  string
  reps: string
  note: string
}

export interface AdvancedProtocols {
  duplaPiramide: {
    name:      string
    exercises: string[]
    steps:     DuplaPiramideStep[]
    note:      string
  }
}

// ── TreinoBlock ───────────────────────────────────────────────────
export interface TreinoStat {
  label: string
  value: string
  sub:   string
  color?: string
}

export interface TreinoBlock {
  type:             TreinoType
  title:            string
  subtitle:         string
  color:            ColorTheme
  warmup:           string[]
  exercises:        ExerciseTemplate[]
  stats?:           TreinoStat[]
  infoNote?:        string | null
  progressionNote?: string | null
}

// ── WorkoutPlan — espelho exato do Firestore ──────────────────────
export interface WorkoutPlan {
  id:                 string
  name:               string
  subtitle:           string
  durationWeeks:      number
  createdBy:          string
  athlete:            AthleteProfile
  kpis:               PlanKpi[]
  tags:               PlanTag[]
  restrictions:       PlanRestriction[]
  weekSchedule:       WeekDay[]
  periodization:      PeriodizationWeek[]
  nutrition:          Nutrition
  hydration:          Hydration
  supplements:        Supplement[]
  cardio:             Cardio
  abdomen:            Abdomen
  advancedProtocols:  AdvancedProtocols
  treinos:            TreinoBlock[]
}
