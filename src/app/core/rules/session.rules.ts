// ─────────────────────────────────────────────────────────────────
// session.rules.ts
// Regras puras de sessão de treino executada.
// Cálculo de duração, completude, streaks e estatísticas.
// ─────────────────────────────────────────────────────────────────
import { Session, ExerciseLog } from '../models/session.model'
import { TreinoType }          from '../models/base.model'

export class SessionRules {

  // ── Completude ───────────────────────────────────────────────────

  /**
   * Indica se a sessão está 100% completa.
   * Todos os exercícios e todos os itens de aquecimento.
   */
  static isSessionComplete(session: Session): boolean {
    const allExercises = session.exercises.every(e => e.completed)
    const allWarmup    = session.warmup.every(w => w.completed)
    return allExercises && allWarmup
  }

  /**
   * Calcula o percentual de completude da sessão (0–100).
   */
  static getCompletionPercent(session: Session): number {
    const total     = session.exercises.length + session.warmup.length
    if (total === 0) return 0
    const completed = session.exercises.filter(e => e.completed).length
                    + session.warmup.filter(w => w.completed).length
    return Math.round((completed / total) * 100)
  }

  // ── Duração ──────────────────────────────────────────────────────

  /**
   * Calcula a duração da sessão em minutos a partir dos timestamps.
   * Retorna null se a sessão não foi finalizada.
   */
  static calculateDurationMinutes(session: Session): number | null {
    if (!session.startedAt || !session.finishedAt) return null
    const start  = new Date(session.startedAt).getTime()
    const finish = new Date(session.finishedAt).getTime()
    return Math.round((finish - start) / 60000)
  }

  // ── Streak ───────────────────────────────────────────────────────

  /**
   * Calcula a streak atual de dias consecutivos com treino.
   * @param sessions lista de sessões ordenada por data desc
   * @param today    'YYYY-MM-DD'
   */
  static calculateStreak(sessions: Session[], today: string): number {
    if (sessions.length === 0) return 0

    const toDate = (d: string) => new Date(d).getTime()
    const todayMs = toDate(today)
    const DAY_MS  = 86400000

    const uniqueDates = [...new Set(sessions.map(s => s.date))].sort().reverse()

    // Verifica se treinou hoje ou ontem para iniciar a streak
    const mostRecentMs = toDate(uniqueDates[0])
    const diff = Math.round((todayMs - mostRecentMs) / DAY_MS)
    if (diff > 1) return 0

    let streak   = 1
    let expected = mostRecentMs - DAY_MS

    for (let i = 1; i < uniqueDates.length; i++) {
      const dateMs = toDate(uniqueDates[i])
      if (dateMs === expected) {
        streak++
        expected -= DAY_MS
      } else {
        break
      }
    }
    return streak
  }

  // ── Frequência semanal ───────────────────────────────────────────

  /**
   * Conta quantas sessões foram realizadas na semana atual.
   * @param sessions todas as sessões do usuário
   * @param weekStart 'YYYY-MM-DD' — segunda-feira da semana
   */
  static getSessionsThisWeek(sessions: Session[], weekStart: string): number {
    const start = new Date(weekStart).getTime()
    const end   = start + 7 * 86400000
    return sessions.filter(s => {
      const d = new Date(s.date).getTime()
      return d >= start && d < end
    }).length
  }

  // ── Histórico por tipo de treino ─────────────────────────────────

  /**
   * Retorna as últimas N sessões de um tipo específico.
   * Útil para mostrar histórico do Treino A, por exemplo.
   */
  static getLastSessionsByType(
    sessions: Session[],
    type: TreinoType,
    limit: number = 5,
  ): Session[] {
    return sessions
      .filter(s => s.treinoType === type)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit)
  }

  // ── Volume e carga ───────────────────────────────────────────────

  /**
   * Calcula o volume total da sessão (kg × reps).
   */
  static getTotalVolume(session: Session): number {
    return session.exercises.reduce((total, exercise) => {
      const exVolume = exercise.sets
        .filter(s => s.completed)
        .reduce((sum, s) => sum + (s.loadKg ?? 0) * (s.repsDone ?? 0), 0)
      return total + exVolume
    }, 0)
  }

  /**
   * Retorna o exercício com maior volume na sessão.
   */
  static getTopExerciseByVolume(session: Session): ExerciseLog | null {
    if (session.exercises.length === 0) return null
    return session.exercises.reduce((top, ex) => {
      const vol = ex.sets.reduce((s, set) =>
        s + (set.loadKg ?? 0) * (set.repsDone ?? 0), 0)
      const topVol = top.sets.reduce((s, set) =>
        s + (set.loadKg ?? 0) * (set.repsDone ?? 0), 0)
      return vol > topVol ? ex : top
    })
  }
}
