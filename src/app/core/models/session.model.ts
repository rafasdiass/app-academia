// ─────────────────────────────────────────────────────────────────
// session.model.ts
// Entidades de sessão de treino executada.
// ─────────────────────────────────────────────────────────────────
import { TreinoType } from './base.model'
import { SetLog }     from './set.model'

export interface Session {
  id:          string | null
  userId:      string
  planId:      string
  date:        string
  treinoType:  TreinoType
  completed:   boolean
  durationMin: number | null
  startedAt:   string | null
  finishedAt:  string | null
  notes:       string
  exercises:   ExerciseLog[]
  warmup:      WarmupLog[]
}

/**
 * Log de um exercício dentro de uma sessão.
 *
 * ADIÇÃO:
 *   roundsDone → quantas rodadas/séries foram completadas nesta sessão.
 *                Ex: RPT com 3 séries onde o atleta só fez 2 → roundsDone: 2
 *                    MYO de 2 rodadas onde fez as 2 → roundsDone: 2
 *                Permite exibir "2/3 séries" ou "1/2 rodadas" no card.
 *
 *   totalRounds → total prescrito (espelho de ExerciseTemplate.totalRounds,
 *                 copiado no momento do registro para não depender do plano).
 *
 *   executionCount → número total de vezes que este exercício foi executado
 *                    ao longo de TODAS as sessões do atleta.
 *                    Calculado e atualizado pelo WorkoutPlanService ao salvar
 *                    a sessão. Persiste no Firestore em:
 *                    users/{uid}/exerciseStats/{exerciseId}
 */
export interface ExerciseLog {
  exerciseId:     string
  exerciseName:   string
  completed:      boolean
  /** Rodadas concluídas nesta sessão (0 se não iniciado) */
  roundsDone:     number
  /** Total de rodadas prescritas no plano */
  totalRounds:    number
  sets:           SetLog[]
}

export interface WarmupLog {
  index:     number
  label:     string
  completed: boolean
}

/**
 * Resumo de execuções de um exercício ao longo do tempo.
 * Persistido em: users/{uid}/exerciseStats/{exerciseId}
 *
 * Permite responder: "quantas vezes fiz este exercício?"
 * e exibir no card: "Executado 12 vezes · Última: 3 dias atrás"
 */
export interface ExerciseStat {
  exerciseId:   string
  exerciseName: string
  userId:       string
  /**
   * Número total de sessões em que este exercício foi executado.
   * Incrementado a cada sessão salva com completed: true neste exercício.
   */
  totalSessions: number
  /**
   * Data da última execução — formato 'YYYY-MM-DD'.
   * Atualizado a cada sessão salva.
   */
  lastDoneAt:   string | null
  /**
   * Carga máxima registrada no top set — em kg.
   * Atualizado quando uma nova carga supera o PR anterior.
   */
  maxLoadKg:    number | null
  /**
   * Histórico das últimas 10 execuções para exibir evolução.
   * Cada entrada: { date, loadKg, repsDone }
   */
  history:      ExerciseStatEntry[]
}

export interface ExerciseStatEntry {
  date:     string       // 'YYYY-MM-DD'
  loadKg:   number | null
  repsDone: number | null
}

export interface HydrationLog {
  userId:     string
  date:       string
  cupsFilled: number
  totalMl:    number
}

export interface NutritionLog {
  userId: string
  date:   string
  items:  NutritionItem[]
}

export interface NutritionItem {
  key:       string
  label:     string
  sub:       string
  completed: boolean
}
