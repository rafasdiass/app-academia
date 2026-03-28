// ═══════════════════════════════════════════════════════════════════
//  FitTracker — Gerador de Rules (Regras de Negócio)
//  Execute: node generate-rules.mjs
//  Cria todos os arquivos em src/app/core/rules/
// ═══════════════════════════════════════════════════════════════════

import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const BASE_PATH = join('src', 'app', 'core', 'rules')

if (!existsSync(BASE_PATH)) {
  mkdirSync(BASE_PATH, { recursive: true })
  console.log(`📁 Pasta criada: ${BASE_PATH}`)
} else {
  console.log(`📁 Pasta já existe: ${BASE_PATH}`)
}

// ════════════════════════════════════════════════════════════════════
const files = {

// ────────────────────────────────────────────────────────────────────
// 1. WORKOUT-PLAN RULES
// ────────────────────────────────────────────────────────────────────
'workout-plan.rules.ts': `// ─────────────────────────────────────────────────────────────────
// workout-plan.rules.ts
// Regras puras de plano de treino e blocos.
// Sem DI, sem efeitos colaterais — facilmente testável.
// ─────────────────────────────────────────────────────────────────
import {
  WorkoutPlan,
  TreinoBlock,
} from '../models/workout-plan.model'
import {
  ExerciseTemplate,
} from '../models/exercise.model'
import {
  TreinoType,
} from '../models/base.model'
import {
  BodyFlag,
} from '../models/exercise.model'

export class WorkoutPlanRules {

  // ── Navegação de blocos ──────────────────────────────────────────

  /**
   * Retorna o bloco do tipo solicitado ou null se não existir.
   */
  static getTreinoBlock(
    plan: WorkoutPlan,
    type: TreinoType,
  ): TreinoBlock | null {
    return plan.treinos.find(t => t.type === type) ?? null
  }

  /**
   * Retorna o exercício pelo id dentro de um bloco, ou null.
   */
  static getExerciseById(
    block: TreinoBlock,
    id: string,
  ): ExerciseTemplate | null {
    return block.exercises.find(e => e.id === id) ?? null
  }

  /**
   * Retorna o exercício pelo índice (posição) dentro do bloco.
   */
  static getExerciseByIndex(
    block: TreinoBlock,
    index: number,
  ): ExerciseTemplate | null {
    return block.exercises[index] ?? null
  }

  /**
   * Retorna todos os exercícios de um músculo específico dentro do bloco.
   */
  static getExercisesByMuscle(
    block: TreinoBlock,
    muscle: string,
  ): ExerciseTemplate[] {
    return block.exercises.filter(e =>
      e.muscle.toLowerCase() === muscle.toLowerCase()
    )
  }

  // ── Flags corporais ─────────────────────────────────────────────

  /**
   * Extrai flags únicas de todos os exercises do bloco.
   * Usado no TreinoHeaderComponent para exibir alertas de restrição.
   * Ex: ['JOELHO', 'LOMBAR']
   */
  static collectBodyFlags(block: TreinoBlock): BodyFlag[] {
    const flags = block.exercises
      .map(e => e.flag)
      .filter((f): f is BodyFlag => f !== null)
    return [...new Set(flags)]
  }

  // ── Cálculos de semana/progresso ────────────────────────────────

  /**
   * Calcula em qual semana do plano o atleta está.
   * Retorna 1 na primeira semana, durationWeeks na última.
   * Retorna null se fora do período do plano.
   * @param startDate   'YYYY-MM-DD' — data de início do plano
   * @param currentDate 'YYYY-MM-DD' — data de hoje
   */
  static getWeekNumber(
    startDate: string,
    currentDate: string,
    durationWeeks: number,
  ): number | null {
    const start   = new Date(startDate)
    const current = new Date(currentDate)
    const diffMs  = current.getTime() - start.getTime()
    if (diffMs < 0) return null
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const week     = Math.floor(diffDays / 7) + 1
    return week > durationWeeks ? null : week
  }

  /**
   * Retorna o percentual de conclusão do plano (0–100).
   */
  static getPlanProgressPercent(
    startDate: string,
    currentDate: string,
    durationWeeks: number,
  ): number {
    const week = WorkoutPlanRules.getWeekNumber(startDate, currentDate, durationWeeks)
    if (week === null) return 100
    return Math.round(((week - 1) / durationWeeks) * 100)
  }

  /**
   * Indica se o plano está em semana de deload.
   * Convenção: última semana de cada bloco de 4 semanas é deload.
   */
  static isDeloadWeek(
    startDate: string,
    currentDate: string,
    durationWeeks: number,
    deloadEveryNWeeks: number = 4,
  ): boolean {
    const week = WorkoutPlanRules.getWeekNumber(startDate, currentDate, durationWeeks)
    if (week === null) return false
    return week % deloadEveryNWeeks === 0
  }

  // ── Validações ──────────────────────────────────────────────────

  /**
   * Verifica se o plano tem todos os tipos de treino necessários.
   */
  static hasAllTreinoTypes(
    plan: WorkoutPlan,
    required: TreinoType[],
  ): boolean {
    return required.every(type =>
      plan.treinos.some(t => t.type === type)
    )
  }

  /**
   * Conta o total de séries de trabalho (exclui aquecimento) no bloco.
   */
  static countWorkingSets(block: TreinoBlock): number {
    return block.exercises.reduce((total, exercise) => {
      const workingSets = exercise.sets.filter(s =>
        !s.label.startsWith('AQUEC.')
      )
      return total + workingSets.length
    }, 0)
  }

  /**
   * Estima a duração total do treino em minutos.
   * Considera tempo médio por série + descanso prescrito.
   */
  static estimateDurationMinutes(block: TreinoBlock): number {
    const AVG_SET_EXECUTION_SEC = 45
    let totalSec = 0
    for (const exercise of block.exercises) {
      for (const set of exercise.sets) {
        totalSec += AVG_SET_EXECUTION_SEC + set.restSec
      }
    }
    return Math.round(totalSec / 60)
  }
}
`,

// ────────────────────────────────────────────────────────────────────
// 2. SET RULES
// ────────────────────────────────────────────────────────────────────
'set.rules.ts': `// ─────────────────────────────────────────────────────────────────
// set.rules.ts
// Regras puras de classificação, estilo visual e progressão de séries.
// ─────────────────────────────────────────────────────────────────
import {
  SetLabelType,
  SetVisualStyle,
  SetTemplate,
} from '../models/exercise.model'
import { SetLog } from '../models/set.model'

export class SetRules {

  // ── Classificação visual ─────────────────────────────────────────

  /**
   * Retorna o estilo visual para o SetRowComponent via [ngClass].
   * Delegado pelo SetVisualStylePipe.
   */
  static getVisualStyle(label: SetLabelType): SetVisualStyle {
    if (label === 'TOP SET')                         return 'top-set'
    if (label === 'ATIVAÇÃO' || label === 'RODADA 2') return 'activation'
    if (label.startsWith('MINI'))                    return 'mini'
    if (label.startsWith('AQUEC.'))                  return 'warmup'
    return 'default'
  }

  // ── Predicados de tipo ───────────────────────────────────────────

  static isTopSet(label: SetLabelType): boolean {
    return label === 'TOP SET'
  }

  static isWarmupSet(label: SetLabelType): boolean {
    return label === 'AQUEC. A' || label === 'AQUEC. B'
  }

  static isActivationSet(label: SetLabelType): boolean {
    return label === 'ATIVAÇÃO' || label === 'RODADA 2'
  }

  static isMiniSet(label: SetLabelType): boolean {
    return label.startsWith('MINI')
  }

  static isWorkingSet(label: SetLabelType): boolean {
    return !SetRules.isWarmupSet(label)
  }

  // ── Progressão de carga (Fase 2) ─────────────────────────────────

  /**
   * Sugere a carga para a próxima sessão.
   * Se repsDone >= targetRepsMax → incrementa 2.5 kg (upper) ou 5 kg (lower).
   * Caso contrário → mantém a mesma carga.
   * @param isLowerBody true para pernas/glúteos (incremento maior)
   */
  static calculateNextLoad(
    currentLoadKg: number,
    repsDone: number,
    targetRepsMax: number,
    isLowerBody: boolean = false,
  ): number {
    if (repsDone >= targetRepsMax) {
      return currentLoadKg + (isLowerBody ? 5 : 2.5)
    }
    return currentLoadKg
  }

  /**
   * Conta apenas repetições de séries de trabalho completadas.
   * Exclui aquecimento do total (usado em relatório de sessão).
   */
  static calculateEffectiveReps(sets: SetLog[]): number {
    return sets
      .filter(s => s.completed && !SetRules.isWarmupSet(s.label))
      .reduce((total, s) => total + (s.repsDone ?? 0), 0)
  }

  /**
   * Calcula o volume total de trabalho de uma lista de séries.
   * Volume = Σ (loadKg × repsDone) — exclui aquecimento.
   */
  static calculateVolume(sets: SetLog[]): number {
    return sets
      .filter(s => s.completed && !SetRules.isWarmupSet(s.label))
      .reduce((total, s) => {
        const load = s.loadKg ?? 0
        const reps = s.repsDone ?? 0
        return total + load * reps
      }, 0)
  }

  /**
   * Verifica se todas as séries de trabalho foram completadas.
   */
  static allWorkingSetsCompleted(sets: SetLog[]): boolean {
    return sets
      .filter(s => SetRules.isWorkingSet(s.label))
      .every(s => s.completed)
  }

  // ── 1RM e intensidade ────────────────────────────────────────────

  /**
   * Estima o 1RM usando a fórmula de Epley.
   * 1RM = weight × (1 + reps / 30)
   * Referência: Epley (1985) — padrão da indústria (Strong, JEFIT, StrengthLog).
   * Precisão ideal para 1–10 repetições.
   */
  static estimateOneRepMax(weightKg: number, reps: number): number {
    if (reps === 1) return weightKg
    if (reps <= 0)  return 0
    return Math.round(weightKg * (1 + reps / 30) * 10) / 10
  }

  /**
   * Estima o 1RM usando a fórmula de Brzycki.
   * Mais precisa para séries de 2–10 reps.
   * 1RM = weight / (1.0278 − 0.0278 × reps)
   */
  static estimateOneRepMaxBrzycki(weightKg: number, reps: number): number {
    if (reps === 1)  return weightKg
    if (reps >= 37)  return 0 // denominador negativo
    return Math.round((weightKg / (1.0278 - 0.0278 * reps)) * 10) / 10
  }

  /**
   * Calcula a carga correspondente a um percentual do 1RM.
   * Arredonda para o múltiplo de 2.5 kg mais próximo.
   * Ex: calcLoadFromPercent(100, 0.75) → 75 kg
   */
  static calcLoadFromPercent(oneRepMaxKg: number, percent: number): number {
    const raw = oneRepMaxKg * percent
    return Math.round(raw / 2.5) * 2.5
  }

  /**
   * Retorna o percentual de 1RM para uma faixa de reps (tabela Epley).
   * Útil para converter "6-8 reps" em carga prescrita.
   */
  static getPercentFromReps(reps: number): number {
    const table: Record<number, number> = {
      1: 1.00, 2: 0.95, 3: 0.93, 4: 0.90, 5: 0.87,
      6: 0.85, 7: 0.83, 8: 0.80, 9: 0.77, 10: 0.75,
      12: 0.70, 15: 0.65, 20: 0.60,
    }
    return table[reps] ?? 0.70
  }

  // ── RPE / RIR ────────────────────────────────────────────────────

  /**
   * Converte RIR (Reps in Reserve) em RPE (Rate of Perceived Exertion).
   * RIR 0 = RPE 10, RIR 1 = RPE 9, etc.
   */
  static rirToRpe(rir: number): number {
    return Math.max(0, Math.min(10, 10 - rir))
  }

  /**
   * Verifica se a série está próxima da falha (RIR ≤ 1 = RPE ≥ 9).
   */
  static isNearFailure(rir: number): boolean {
    return rir <= 1
  }

  // ── Placa/anilha ────────────────────────────────────────────────

  /**
   * Calcula as anilhas necessárias para atingir a carga alvo na barra.
   * Retorna a lista de anilhas por lado (barra olímpica padrão = 20 kg).
   * @param targetKg  carga total desejada
   * @param barKg     peso da barra (default 20 kg)
   * @param available anilhas disponíveis em kg (por lado)
   */
  static calculatePlates(
    targetKg: number,
    barKg: number = 20,
    available: number[] = [20, 15, 10, 5, 2.5, 1.25],
  ): number[] {
    let remaining = (targetKg - barKg) / 2
    if (remaining < 0) return []
    const plates: number[] = []
    for (const plate of available) {
      while (remaining >= plate) {
        plates.push(plate)
        remaining = Math.round((remaining - plate) * 100) / 100
      }
    }
    return plates
  }

  // ── Validação de série ───────────────────────────────────────────

  /**
   * Verifica se um SetLog está válido para persistência.
   */
  static isSetLogValid(set: SetLog): boolean {
    if (!set.completed) return true // incompleto é válido
    if (set.loadKg !== null && set.loadKg < 0)    return false
    if (set.repsDone !== null && set.repsDone < 0) return false
    return true
  }

  /**
   * Verifica se uma série superou o PR anterior.
   */
  static isPersonalRecord(
    currentLoad: number,
    currentReps: number,
    previousBest1RM: number,
  ): boolean {
    const current1RM = SetRules.estimateOneRepMax(currentLoad, currentReps)
    return current1RM > previousBest1RM
  }

  // ── Deload ───────────────────────────────────────────────────────

  /**
   * Calcula a carga de deload: 60% da carga máxima recente.
   * Padrão RP Strength: redução de volume 40–60%, intensidade –10–15%.
   */
  static calculateDeloadLoad(peakLoadKg: number): number {
    return Math.round((peakLoadKg * 0.6) / 2.5) * 2.5
  }

  /**
   * Calcula o volume de deload: 40% do volume médio das últimas sessões.
   */
  static calculateDeloadSets(averageSets: number): number {
    return Math.max(1, Math.round(averageSets * 0.4))
  }
}
`,

// ────────────────────────────────────────────────────────────────────
// 3. REST TIMER RULES
// ────────────────────────────────────────────────────────────────────
'rest-timer.rules.ts': `// ─────────────────────────────────────────────────────────────────
// rest-timer.rules.ts
// Regras puras de formatação e lógica de descanso entre séries.
// ─────────────────────────────────────────────────────────────────

export class RestTimerRules {

  // ── Formatação ───────────────────────────────────────────────────

  /**
   * Formata segundos no padrão M:SS.
   * 90  → "1:30"
   * 120 → "2:00"
   * 20  → "0:20"
   * 0   → "—"
   */
  static formatRestTime(seconds: number): string {
    if (seconds <= 0) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return \`\${m}:\${s.toString().padStart(2, '0')}\`
  }

  /**
   * Retorna o label descritivo do descanso para exibição no template.
   * Se restNote existe → retorna a nota (ex: "5 respirações").
   * Senão             → retorna "Descanso: M:SS".
   */
  static getRestLabel(restSec: number, restNote: string | null): string {
    if (restNote && restNote.trim().length > 0) return restNote
    if (restSec <= 0) return '—'
    return \`Descanso: \${RestTimerRules.formatRestTime(restSec)}\`
  }

  /**
   * Indica se o timer deve ser exibido.
   * false para séries de aquecimento sem pausa definida (restSec === 0).
   */
  static shouldShowTimer(restSec: number): boolean {
    return restSec > 0
  }

  // ── Classificação de intensidade de descanso ─────────────────────

  /**
   * Classifica o tempo de descanso por categoria.
   * Baseado nas recomendações de RP Strength e literatura científica.
   */
  static getRestCategory(
    restSec: number,
  ): 'short' | 'moderate' | 'long' | 'extended' {
    if (restSec <= 60)  return 'short'     // mini-séries, myo-reps
    if (restSec <= 120) return 'moderate'  // hipertrofia geral
    if (restSec <= 180) return 'long'      // compostos pesados
    return 'extended'                      // RPT top sets, força máxima
  }

  /**
   * Retorna o tempo de descanso recomendado por protocolo.
   * Baseado nas diretrizes dos principais apps (RP, Hevy, JEFIT).
   */
  static getRecommendedRestSec(
    protocol: 'RPT' | 'MYO' | 'STRAIGHT' | 'PAUSE' | 'RPT_HALF',
    setType: 'top-set' | 'activation' | 'mini' | 'warmup' | 'default',
  ): number {
    if (setType === 'warmup') return 0
    if (setType === 'mini')   return 20   // myo-reps: respirações

    const table: Record<string, number> = {
      RPT:      180,  // top set pesado → 3 min
      MYO:      120,  // ativação → 2 min
      STRAIGHT: 90,   // séries retas → 1:30
      PAUSE:    120,  // pausa isométrica → 2 min
      RPT_HALF: 150,  // RPT reduzido → 2:30
    }
    return table[protocol] ?? 90
  }

  // ── Progressão do timer ──────────────────────────────────────────

  /**
   * Calcula quanto tempo resta no timer ativo.
   * @param totalSec    duração total prescrita
   * @param elapsedSec  tempo já decorrido
   */
  static getRemainingSeconds(totalSec: number, elapsedSec: number): number {
    return Math.max(0, totalSec - elapsedSec)
  }

  /**
   * Retorna o percentual de progresso do timer (0–100).
   * Útil para animar a barra de progresso circular.
   */
  static getTimerProgress(totalSec: number, elapsedSec: number): number {
    if (totalSec <= 0) return 100
    return Math.min(100, Math.round((elapsedSec / totalSec) * 100))
  }

  /**
   * Indica se está nos últimos N segundos (alerta sonoro/visual).
   */
  static isAlmostDone(remaining: number, warningAtSec: number = 5): boolean {
    return remaining > 0 && remaining <= warningAtSec
  }

  // ── Descanso efetivo vs prescrito ────────────────────────────────

  /**
   * Compara o descanso tomado com o prescrito.
   * Retorna: 'short' | 'ok' | 'long'
   * Tolerância de ±15 segundos = 'ok'.
   */
  static evaluateRestAdherence(
    prescribedSec: number,
    takenSec: number,
  ): 'short' | 'ok' | 'long' {
    const diff = takenSec - prescribedSec
    if (diff < -15) return 'short'
    if (diff > 15)  return 'long'
    return 'ok'
  }
}
`,

// ────────────────────────────────────────────────────────────────────
// 4. COLOR THEME RULES
// ────────────────────────────────────────────────────────────────────
'color-theme.rules.ts': `// ─────────────────────────────────────────────────────────────────
// color-theme.rules.ts
// Regras puras de mapeamento de cores por contexto.
// Nenhum if/switch no template — toda lógica de cor vive aqui.
// ─────────────────────────────────────────────────────────────────
import { ColorTheme, TreinoType } from '../models/base.model'
import { Protocol, BodyFlag }     from '../models/exercise.model'

export class ColorThemeRules {

  // ── CSS Variables ────────────────────────────────────────────────

  /**
   * Retorna a CSS variable correspondente ao tema de cor.
   * Mapa exaustivo — sem default implícito garante type-safety total.
   */
  static getCssVar(color: ColorTheme): string {
    const map: Record<ColorTheme, string> = {
      rose:   '--color-rose',
      teal:   '--color-teal',
      blue:   '--color-blue',
      orange: '--color-orange',
      purple: '--color-purple',
      amber:  '--color-amber',
      green:  '--color-green',
    }
    return map[color]
  }

  /**
   * Retorna o valor hex aproximado para uso em contextos sem CSS vars.
   * Ex: geração de imagens, PDFs, notificações nativas.
   */
  static getHexValue(color: ColorTheme): string {
    const map: Record<ColorTheme, string> = {
      rose:   '#f43f5e',
      teal:   '#14b8a6',
      blue:   '#3b82f6',
      orange: '#f97316',
      purple: '#a855f7',
      amber:  '#f59e0b',
      green:  '#22c55e',
    }
    return map[color]
  }

  // ── Mapeamentos por entidade ─────────────────────────────────────

  /**
   * Cor do protocolo de treino.
   * Delegado pelo ProtocolColorPipe.
   */
  static getProtocolColor(protocol: Protocol): ColorTheme {
    const map: Record<Protocol, ColorTheme> = {
      RPT:      'rose',
      MYO:      'purple',
      STRAIGHT: 'blue',
      PAUSE:    'teal',
      RPT_HALF: 'purple',
    }
    return map[protocol]
  }

  /**
   * Cor da flag de restrição corporal.
   * Delegado pelo FlagColorPipe.
   */
  static getFlagColor(flag: BodyFlag): ColorTheme {
    const map: Record<BodyFlag, ColorTheme> = {
      JOELHO:   'orange',
      LOMBAR:   'amber',
      '90° MÁX': 'orange',
    }
    return map[flag]
  }

  /**
   * Cor do segmento de treino (A, B, C, D).
   * Delegado pelo pipe de segmento no TreinoDetailPage.
   */
  static getSegmentColor(type: TreinoType): ColorTheme {
    const map: Record<TreinoType, ColorTheme> = {
      A: 'rose',
      B: 'teal',
      C: 'blue',
      D: 'orange',
    }
    return map[type]
  }

  /**
   * Cor de feedback de aderência ao descanso.
   * 'short' → amber (aviso), 'ok' → green (sucesso), 'long' → blue (info)
   */
  static getRestAdherenceColor(
    adherence: 'short' | 'ok' | 'long',
  ): ColorTheme {
    const map: Record<'short' | 'ok' | 'long', ColorTheme> = {
      short: 'amber',
      ok:    'green',
      long:  'blue',
    }
    return map[adherence]
  }

  /**
   * Cor de destaque para PRs (Personal Records).
   */
  static getPrColor(): ColorTheme {
    return 'amber'
  }
}
`,

// ────────────────────────────────────────────────────────────────────
// 5. PROGRESSION RULES
// ────────────────────────────────────────────────────────────────────
'progression.rules.ts': `// ─────────────────────────────────────────────────────────────────
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
        suggestedReps:   \`\${repsFloor}–\${repsCeiling}\`,
        rationale:       \`Teto atingido (\${repsDone} reps) → +\${incrementKg}kg\`,
      }
    }
    if (repsDone >= repsFloor) {
      return {
        suggestedLoadKg: currentLoadKg,
        suggestedReps:   \`\${repsDone + 1}–\${repsCeiling}\`,
        rationale:       \`Dentro da faixa → manter carga, aumentar reps\`,
      }
    }
    return {
      suggestedLoadKg: currentLoadKg,
      suggestedReps:   \`\${repsFloor}–\${repsCeiling}\`,
      rationale:       \`Abaixo do piso → manter carga e repetições\`,
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
`,

// ────────────────────────────────────────────────────────────────────
// 6. SESSION RULES
// ────────────────────────────────────────────────────────────────────
'session.rules.ts': `// ─────────────────────────────────────────────────────────────────
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
`,

// ────────────────────────────────────────────────────────────────────
// 7. HYDRATION RULES
// ────────────────────────────────────────────────────────────────────
'hydration.rules.ts': `// ─────────────────────────────────────────────────────────────────
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
`,

// ────────────────────────────────────────────────────────────────────
// 8. INDEX (barrel)
// ────────────────────────────────────────────────────────────────────
'index.ts': `// ─────────────────────────────────────────────────────────────────
// index.ts — Barrel export das rules
// Permite import limpo: import { SetRules } from '@core/rules'
// ─────────────────────────────────────────────────────────────────
export * from './workout-plan.rules'
export * from './set.rules'
export * from './rest-timer.rules'
export * from './color-theme.rules'
export * from './progression.rules'
export * from './session.rules'
export * from './hydration.rules'
`,
}

// ════════════════════════════════════════════════════════════════════
// Escreve os arquivos
// ════════════════════════════════════════════════════════════════════
let created = 0
let skipped = 0

for (const [filename, content] of Object.entries(files)) {
  const filePath = join(BASE_PATH, filename)

  if (existsSync(filePath)) {
    console.log(`⚠️  Já existe (pulado): ${filePath}`)
    skipped++
    continue
  }

  writeFileSync(filePath, content, 'utf8')
  console.log(`✅ Criado: ${filePath}`)
  created++
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Criados : ${created}
  ⚠️  Pulados : ${skipped}
  📁 Local   : ${BASE_PATH}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Rules geradas:
  ├── workout-plan.rules.ts  → navegação, flags, semana, duração
  ├── set.rules.ts           → visual, 1RM (Epley+Brzycki), anilhas, RPE/RIR
  ├── rest-timer.rules.ts    → formatação, progresso, aderência
  ├── color-theme.rules.ts   → CSS vars, hex, mapeamentos
  ├── progression.rules.ts   → double progression, mesociclo, fadiga, MEV/MRV
  ├── session.rules.ts       → completude, duração, streak, volume
  ├── hydration.rules.ts     → status, meta, ml por peso
  └── index.ts               → barrel export

  Próximos passos:
  1. npx tsc --noEmit   (verifica tipos)
  2. Próxima camada: core/api/api.service.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
