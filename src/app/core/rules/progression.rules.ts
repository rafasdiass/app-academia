// ─────────────────────────────────────────────────────────────────
// progression.rules.ts
// Regras puras de periodização, progressão e deload.
// Baseadas em: RP Strength, Alpha Progression, JEFIT, Strong.
// ─────────────────────────────────────────────────────────────────

export type ProgressionStrategy = 'linear' | 'double-progression' | 'rpe-based'
export type MesocyclePhase      = 'accumulation' | 'intensification' | 'peak' | 'deload'
export type FatigueLevel        = 'low' | 'moderate' | 'high' | 'overreached'

export interface ProgressionRecommendation {
  suggestedLoadKg: number
  suggestedReps:   string
  rationale:       string
}

export interface MesocycleWeek {
  weekNumber:    number
  phase:         MesocyclePhase
  volumePercent: number  // % do volume máximo (MRV)
  intensityRir:  number  // RIR alvo para a semana
}

export class ProgressionRules {

  // ── Double Progression ───────────────────────────────────────────

  /**
   * Double Progression: primeiro aumenta reps até o teto,
   * depois aumenta carga e reinicia as reps no piso.
   *
   * Ex: alvo 8–12 reps
   *   - Se repsDone < 8  → manter carga
   *   - Se 8 ≤ repsDone < 12 → manter carga, tentar mais reps
   *   - Se repsDone >= 12 → aumentar carga em incremento mínimo
   */
  static getDoubleProgressionRecommendation(
    currentLoadKg: number,
    repsDone: number,
    repsFloor: number,
    repsCeiling: number,
    incrementKg: number = 2.5,
  ): ProgressionRecommendation {
    if (repsDone >= repsCeiling) {
      return {
        suggestedLoadKg: currentLoadKg + incrementKg,
        suggestedReps:   `${repsFloor}–${repsCeiling}`,
        rationale:       `Teto atingido (${repsDone} reps) → +${incrementKg}kg`,
      }
    }
    if (repsDone >= repsFloor) {
      return {
        suggestedLoadKg: currentLoadKg,
        suggestedReps:   `${repsDone + 1}–${repsCeiling}`,
        rationale:       `Dentro da faixa → manter carga, aumentar reps`,
      }
    }
    return {
      suggestedLoadKg: currentLoadKg,
      suggestedReps:   `${repsFloor}–${repsCeiling}`,
      rationale:       `Abaixo do piso → manter carga e repetições`,
    }
  }

  // ── Linear Progression ──────────────────────────────────────────

  /**
   * Progressão linear: adiciona carga fixa a cada sessão bem-sucedida.
   * Padrão para iniciantes (Strong, StrongLifts 5x5).
   * @param consecutiveSuccesses sessões seguidas completando todas as reps
   */
  static getLinearProgressionLoad(
    currentLoadKg: number,
    consecutiveSuccesses: number,
    incrementKg: number = 2.5,
    successThreshold: number = 1,
  ): number {
    if (consecutiveSuccesses >= successThreshold) {
      return currentLoadKg + incrementKg
    }
    return currentLoadKg
  }

  // ── Planejamento de mesociclo ────────────────────────────────────

  /**
   * Gera o plano semana a semana de um mesociclo de hipertrofia.
   * Baseado no modelo RP Strength: MEV → MRV → Deload.
   *
   * @param totalWeeks     duração total (geralmente 4–6)
   * @param deloadLastWeek se true, última semana é deload
   */
  static buildMesocycle(
    totalWeeks: number,
    deloadLastWeek: boolean = true,
  ): MesocycleWeek[] {
    const workWeeks = deloadLastWeek ? totalWeeks - 1 : totalWeeks
    const weeks: MesocycleWeek[] = []

    for (let i = 1; i <= totalWeeks; i++) {
      if (deloadLastWeek && i === totalWeeks) {
        weeks.push({
          weekNumber:    i,
          phase:         'deload',
          volumePercent: 40,
          intensityRir:  4,
        })
        continue
      }

      // Progressão de volume: MEV (60%) → MRV (100%)
      const volumePercent = Math.round(60 + ((i - 1) / (workWeeks - 1)) * 40)

      // Progressão de intensidade: RIR 4 → RIR 1
      const intensityRir = Math.max(1, 4 - Math.floor((i - 1) * 3 / (workWeeks - 1)))

      // Fase da semana
      let phase: MesocyclePhase = 'accumulation'
      if (i > workWeeks * 0.66) phase = 'intensification'
      if (i === workWeeks)       phase = 'peak'

      weeks.push({ weekNumber: i, phase, volumePercent, intensityRir })
    }

    return weeks
  }

  // ── Fadiga e recuperação ─────────────────────────────────────────

  /**
   * Classifica o nível de fadiga com base em indicadores subjetivos.
   * Baseado no modelo de auto-regulação do RP Hypertrophy App.
   *
   * @param soreness    0–10 (dor muscular residual)
   * @param sleep       0–10 (qualidade do sono)
   * @param motivation  0–10 (disposição para treinar)
   */
  static classifyFatigue(
    soreness: number,
    sleep: number,
    motivation: number,
  ): FatigueLevel {
    const score = (10 - soreness) + sleep + motivation
    if (score >= 22) return 'low'
    if (score >= 16) return 'moderate'
    if (score >= 10) return 'high'
    return 'overreached'
  }

  /**
   * Recomenda ajuste de carga baseado no nível de fadiga.
   * 'overreached' → deload imediato (–40%).
   * 'high'        → reduzir carga em 10%.
   * 'moderate'    → manter.
   * 'low'         → pode progredir normalmente.
   */
  static getFatigueLoadMultiplier(fatigue: FatigueLevel): number {
    const map: Record<FatigueLevel, number> = {
      low:         1.0,
      moderate:    1.0,
      high:        0.90,
      overreached: 0.60,
    }
    return map[fatigue]
  }

  // ── Volume por grupo muscular ────────────────────────────────────

  /**
   * Verifica se o volume semanal está dentro da faixa recomendada.
   * Referência: RP Strength MEV/MRV (sets por semana por grupo).
   *
   * Valores baseados em literatura de hipertrofia (Schoenfeld, Israetel):
   * MEV = Minimum Effective Volume
   * MRV = Maximum Recoverable Volume
   */
  static getMuscleVolumeRange(muscle: string): { mev: number; mrv: number } {
    const ranges: Record<string, { mev: number; mrv: number }> = {
      chest:      { mev: 8,  mrv: 22 },
      back:       { mev: 10, mrv: 25 },
      shoulders:  { mev: 8,  mrv: 20 },
      biceps:     { mev: 6,  mrv: 20 },
      triceps:    { mev: 6,  mrv: 20 },
      quads:      { mev: 8,  mrv: 20 },
      hamstrings: { mev: 6,  mrv: 20 },
      glutes:     { mev: 4,  mrv: 16 },
      calves:     { mev: 8,  mrv: 16 },
      core:       { mev: 4,  mrv: 16 },
    }
    return ranges[muscle.toLowerCase()] ?? { mev: 6, mrv: 18 }
  }

  /**
   * Indica se o volume está abaixo do MEV, na faixa ideal ou acima do MRV.
   */
  static evaluateWeeklyVolume(
    muscle: string,
    weeklySetCount: number,
  ): 'below-mev' | 'optimal' | 'above-mrv' {
    const { mev, mrv } = ProgressionRules.getMuscleVolumeRange(muscle)
    if (weeklySetCount < mev)  return 'below-mev'
    if (weeklySetCount > mrv)  return 'above-mrv'
    return 'optimal'
  }
}
