// ─────────────────────────────────────────────────────────────────
// set.rules.ts
// Responsabilidade única: toda lógica pura de série.
//
// Cobre:
//   - Classificação visual (SetLabelType → SetVisualStyle)
//   - Parsing e validação de faixa de reps
//   - Cálculo de volume (kg × reps)
//   - Estimativa de 1RM (Epley, Brzycki, Lander)
//   - Derivação de carga (% 1RM, drop RPT)
//   - Conversão RIR ↔ RPE
//   - Reps efetivas para hipertrofia
//   - Lógica de Myo-reps (ativação + mini-séries)
//   - Isometria (PAUSE)
//   - Completude e formatação de exibição
//
// Referências: RP Strength, Hevy, Strong App, Alpha Progression,
//              Menno Henselmans, Brad Schoenfeld.
// ─────────────────────────────────────────────────────────────────
import {
  SetLabelType,
  SetVisualStyle,
  Protocol,
  SetTemplate,
} from '@core/models'
import { SetLog } from '@core/models'

// ── Tipos públicos ────────────────────────────────────────────────

export interface RepsRange {
  min:       number
  max:       number
  isFailure: boolean
}

export interface OneRmEstimate {
  epley:   number
  brzycki: number
  lander:  number
  average: number
}

export type RirLevel = 0 | 1 | 2 | 3 | 4 | 5

export interface SetDisplaySummary {
  load:    string
  reps:    string
  volume:  number
  compact: string
}

// ── Constantes ────────────────────────────────────────────────────

const RPT_DROP_PERCENT_DEFAULT      = 10
const RPT_DROP_PERCENT_HALF         = 5
const MYO_ACTIVATION_REPS_DEFAULT   = 12
const MYO_MINI_SET_COUNT_DEFAULT    = 4
const EFFECTIVE_REPS_PROXIMITY      = 5
const MIN_LOAD_INCREMENT_KG         = 2.5

// ── Mapa de estilo visual ─────────────────────────────────────────
// Valores devem bater exatamente com SetVisualStyle do model:
//   'top-set' | 'set2' | 'set3' | 'myo-act' | 'myo-mini' | 'warmup' | 'default'

const VISUAL_STYLE_MAP: Record<SetLabelType, SetVisualStyle> = {
  'TOP SET':  'top-set',
  'SÉRIE 1':  'top-set',
  'SÉRIE 2':  'set2',
  'SÉRIE 3':  'set3',
  'ATIVAÇÃO': 'myo-act',   // era 'activation' — não existe no tipo
  'MINI ×1':  'myo-mini',  // era 'mini' — não existe no tipo
  'MINI ×2':  'myo-mini',
  'MINI ×3':  'myo-mini',
  'MINI ×4':  'myo-mini',
  'RODADA 2': 'set2',
  'AQUEC. A': 'warmup',
  'AQUEC. B': 'warmup',
}

export class SetRules {

  // ── Classificação visual ──────────────────────────────────────────

  static getVisualStyle(label: SetLabelType): SetVisualStyle {
    return VISUAL_STYLE_MAP[label] ?? 'default'
  }

  static isTopSet(label: SetLabelType): boolean {
    return label === 'TOP SET'
  }

  static isWarmupSet(label: SetLabelType): boolean {
    return label === 'AQUEC. A' || label === 'AQUEC. B'
  }

  static isMiniSet(label: SetLabelType): boolean {
    return VISUAL_STYLE_MAP[label] === 'myo-mini'
  }

  static isActivationSet(label: SetLabelType): boolean {
    return label === 'ATIVAÇÃO'
  }

  static isStraightSet(label: SetLabelType): boolean {
    return VISUAL_STYLE_MAP[label] === 'default'
  }

  static countsForVolume(label: SetLabelType): boolean {
    return !SetRules.isWarmupSet(label)
  }

  // ── Faixa de repetições ────────────────────────────────────────────

  static parseRepsRange(reps: string): RepsRange | null {
    const normalized = reps.trim().toLowerCase().replace('–', '-')

    if (normalized === 'falha') {
      return { min: 1, max: 99, isFailure: true }
    }

    const rangeMatch = normalized.match(/^(\d+)-(\d+)$/)
    if (rangeMatch) {
      return {
        min:       parseInt(rangeMatch[1], 10),
        max:       parseInt(rangeMatch[2], 10),
        isFailure: false,
      }
    }

    const fixedMatch = normalized.match(/^(\d+)$/)
    if (fixedMatch) {
      const n = parseInt(fixedMatch[1], 10)
      return { min: n, max: n, isFailure: false }
    }

    return null
  }

  static isRepsInRange(repsDone: number, repsTarget: string): boolean {
    const range = SetRules.parseRepsRange(repsTarget)
    if (range === null)   return false
    if (range.isFailure)  return repsDone >= 1
    return repsDone >= range.min && repsDone <= range.max
  }

  static formatRepsRange(range: RepsRange): string {
    if (range.isFailure)         return 'falha'
    if (range.min === range.max) return `${range.min}`
    return `${range.min}–${range.max}`
  }

  static getRepsFloor(repsTarget: string): number | null {
    return SetRules.parseRepsRange(repsTarget)?.min ?? null
  }

  static getRepsCeiling(repsTarget: string): number | null {
    const range = SetRules.parseRepsRange(repsTarget)
    if (range === null || range.isFailure) return null
    return range.max
  }

  // ── Volume ─────────────────────────────────────────────────────────

  static calculateSetVolume(set: SetLog): number {
    if (!set.completed)        return 0
    if (set.loadKg === null)   return 0
    if (set.repsDone === null) return 0
    return set.loadKg * set.repsDone
  }

  static calculateTotalVolume(sets: SetLog[]): number {
    return sets
      .filter(s => SetRules.countsForVolume(s.label))
      .reduce((acc, s) => acc + SetRules.calculateSetVolume(s), 0)
  }

  static getTopVolumeSet(sets: SetLog[]): SetLog | null {
    const completed = sets.filter(s => SetRules.calculateSetVolume(s) > 0)
    if (completed.length === 0) return null
    return completed.reduce((top, s) =>
      SetRules.calculateSetVolume(s) > SetRules.calculateSetVolume(top) ? s : top,
    )
  }

  static countCompletedSets(sets: SetLog[]): number {
    return sets.filter(s => s.completed).length
  }

  static getCompletionRate(sets: SetLog[]): number {
    if (sets.length === 0) return 0
    return Math.round((SetRules.countCompletedSets(sets) / sets.length) * 100)
  }

  // ── 1RM e derivação de carga ───────────────────────────────────────

  static estimateOneRepMax(loadKg: number, repsDone: number): OneRmEstimate {
    const r     = Math.max(1, repsDone)
    const w     = loadKg
    const round = (v: number) => Math.round(v * 2) / 2

    const epley   = round(w * (1 + r / 30))
    const brzycki = round(w * (36 / (37 - r)))
    const lander  = round((100 * w) / (101.3 - 2.67123 * r))
    const average = round((epley + brzycki + lander) / 3)

    return { epley, brzycki, lander, average }
  }

  static getLoadFromOneRm(oneRmKg: number, percent: number): number {
    const raw = oneRmKg * (percent / 100)
    return Math.round(raw / MIN_LOAD_INCREMENT_KG) * MIN_LOAD_INCREMENT_KG
  }

  static getRptDropLoad(
    topSetKg:  number,
    setIndex:  number,
    protocol:  Protocol = 'RPT',
  ): number {
    if (setIndex === 0) return topSetKg

    const dropPercent = protocol === 'RPT_HALF'
      ? RPT_DROP_PERCENT_HALF
      : RPT_DROP_PERCENT_DEFAULT

    const multiplier = Math.pow(1 - dropPercent / 100, setIndex)
    const raw        = topSetKg * multiplier

    return Math.round(raw / MIN_LOAD_INCREMENT_KG) * MIN_LOAD_INCREMENT_KG
  }

  static getSuggestedNextLoad(
    currentLoadKg: number,
    repsDone:      number,
    repsTarget:    string,
  ): number {
    const range = SetRules.parseRepsRange(repsTarget)

    if (range === null || range.isFailure) return currentLoadKg

    if (repsDone >= range.max) {
      return currentLoadKg + MIN_LOAD_INCREMENT_KG
    }

    if (repsDone < range.min) {
      return Math.max(MIN_LOAD_INCREMENT_KG, currentLoadKg - MIN_LOAD_INCREMENT_KG)
    }

    return currentLoadKg
  }

  // ── RIR / RPE ──────────────────────────────────────────────────────

  static rirToRpe(rir: RirLevel): number {
    return 10 - rir
  }

  static rpeToRir(rpe: number): RirLevel {
    const rir = Math.round(10 - rpe)
    return Math.min(5, Math.max(0, rir)) as RirLevel
  }

  static getEffectiveReps(repsDone: number, rir: RirLevel): number {
    const totalProximity = repsDone + rir
    if (totalProximity <= EFFECTIVE_REPS_PROXIMITY) return repsDone
    return Math.max(0, EFFECTIVE_REPS_PROXIMITY - rir)
  }

  static getTotalEffectiveReps(
    sets:       SetLog[],
    defaultRir: RirLevel = 2,
  ): number {
    return sets
      .filter(s => s.completed && s.repsDone !== null)
      .filter(s => SetRules.countsForVolume(s.label))
      .reduce((acc, s) => acc + SetRules.getEffectiveReps(s.repsDone!, defaultRir), 0)
  }

  // ── Myo-reps ───────────────────────────────────────────────────────

  static getMiniSetTargetReps(
    activationReps: number = MYO_ACTIVATION_REPS_DEFAULT,
  ): number {
    return Math.max(3, Math.round(activationReps / 3))
  }

  static getMiniSetCount(protocol: Protocol): number {
    return protocol === 'MYO' ? MYO_MINI_SET_COUNT_DEFAULT : 0
  }

  static shouldContinueMyo(
    repsDone:     number,
    targetReps:   number,
    miniSetsDone: number,
    maxMiniSets:  number,
  ): boolean {
    if (miniSetsDone >= maxMiniSets) return false
    return repsDone >= targetReps
  }

  // ── Isometria ─────────────────────────────────────────────────────

  static hasIsoComponent(template: SetTemplate): boolean {
    return template.isoNote !== null && template.isoNote.trim().length > 0
  }

  static isIsoAdequate(
    isoSeconds:     number | null,
    minimumSeconds: number = 2,
  ): boolean {
    if (isoSeconds === null) return false
    return isoSeconds >= minimumSeconds
  }

  static formatIsoSeconds(isoSeconds: number | null): string {
    if (isoSeconds === null) return '—'
    return `${isoSeconds}s`
  }

  // ── Completude ─────────────────────────────────────────────────────

  static isSetComplete(set: SetLog): boolean {
    if (!set.completed)        return false
    if (set.loadKg === null)   return false
    if (set.repsDone === null) return false
    return true
  }

  static allTemplatesLogged(
    templates: SetTemplate[],
    logs:      SetLog[],
  ): boolean {
    return templates.every(t =>
      logs.some(l => l.index === t.index && SetRules.isSetComplete(l)),
    )
  }

  // ── Formatação ─────────────────────────────────────────────────────

  static formatLoad(loadKg: number | null): string {
    if (loadKg === null) return '—'
    const display = loadKg % 1 === 0
      ? loadKg.toString()
      : loadKg.toFixed(1)
    return `${display} kg`
  }

  static formatReps(repsDone: number | null): string {
    if (repsDone === null) return '—'
    return repsDone === 1 ? '1 rep' : `${repsDone} reps`
  }

  static getDisplaySummary(set: SetLog): SetDisplaySummary {
    return {
      load:    SetRules.formatLoad(set.loadKg),
      reps:    SetRules.formatReps(set.repsDone),
      volume:  SetRules.calculateSetVolume(set),
      compact: `${SetRules.formatLoad(set.loadKg)} × ${set.repsDone ?? '—'}`,
    }
  }

  static formatLoadDelta(previousKg: number, currentKg: number): string {
    const delta = currentKg - previousKg
    if (delta === 0) return '='
    const sign  = delta > 0 ? '+' : '−'
    const abs   = Math.abs(delta).toFixed(1).replace(/\.0$/, '')
    const arrow = delta > 0 ? '↑' : '↓'
    return `${sign}${abs} kg ${arrow}`
  }
}
