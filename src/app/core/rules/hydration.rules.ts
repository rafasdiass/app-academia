// ─────────────────────────────────────────────────────────────────
// hydration.rules.ts
// Regras puras de hidratação diária.
// ─────────────────────────────────────────────────────────────────
import { HydrationLog } from '../models/session.model'

export type HydrationStatus = 'critical' | 'low' | 'ok' | 'optimal'

export class HydrationRules {

  /** Volume padrão de um copo em ml */
  static readonly CUP_ML = 250

  /** Meta diária padrão em ml (baseado em 35ml/kg para 70kg) */
  static readonly DAILY_GOAL_ML = 2500

  // ── Cálculos básicos ────────────────────────────────────────────

  /**
   * Converte número de copos em mililitros.
   */
  static cupsToMl(cups: number, cupMl: number = HydrationRules.CUP_ML): number {
    return cups * cupMl
  }

  /**
   * Calcula o percentual de meta atingido (0–100+).
   */
  static getGoalPercent(totalMl: number, goalMl: number = HydrationRules.DAILY_GOAL_ML): number {
    return Math.round((totalMl / goalMl) * 100)
  }

  /**
   * Classifica o status de hidratação do dia.
   */
  static getStatus(totalMl: number, goalMl: number = HydrationRules.DAILY_GOAL_ML): HydrationStatus {
    const pct = HydrationRules.getGoalPercent(totalMl, goalMl)
    if (pct < 30)  return 'critical'
    if (pct < 60)  return 'low'
    if (pct < 100) return 'ok'
    return 'optimal'
  }

  /**
   * Quantidade de ml restante para atingir a meta.
   */
  static getRemainingMl(totalMl: number, goalMl: number = HydrationRules.DAILY_GOAL_ML): number {
    return Math.max(0, goalMl - totalMl)
  }

  /**
   * Calcula a meta personalizada por peso corporal.
   * Recomendação: 35ml por kg de peso.
   */
  static calculateGoalByWeight(weightKg: number): number {
    return Math.round(weightKg * 35)
  }

  /**
   * Verifica se o log do dia está completo (meta atingida).
   */
  static isDailyGoalReached(log: HydrationLog, goalMl?: number): boolean {
    return log.totalMl >= (goalMl ?? HydrationRules.DAILY_GOAL_ML)
  }
}
