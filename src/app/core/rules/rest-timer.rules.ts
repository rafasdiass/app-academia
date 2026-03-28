// ─────────────────────────────────────────────────────────────────
// rest-timer.rules.ts
// Responsabilidade única: toda lógica pura do temporizador de descanso.
//
// Cobre:
//   - Recomendação de tempo por Protocol e SetLabelType
//   - Snapshot completo do estado do timer num instante
//   - Formatação de countdown e overtime
//   - Progresso percentual (para anel animado)
//   - Pontos de disparo haptic (halfway, warning, complete, overtime)
//   - Lógica de auto-start por tipo de série
//   - Tiers de descanso para seleção manual
//   - Ajuste de target com clamp de limites
//   - Análise de desvio entre descanso prescrito e efetivo
//
// Referências: Strong App, Hevy, RP Strength App, JEFIT, Alpha Progression.
// Tempos baseados em: Brad Schoenfeld (2014) "Effects of Different
// Volume-Equated Resistance Training Loading Strategies..."
// ─────────────────────────────────────────────────────────────────
import { Protocol, SetLabelType } from '@core/models'

// ── Tipos públicos ────────────────────────────────────────────────

/**
 * Tier de descanso descritivo com faixa de tempo.
 * Exibido no seletor de ajuste manual de descanso.
 */
export interface RestTier {
  /** Rótulo exibido na UI */
  name:       string
  /** Mínimo da faixa em segundos */
  minSeconds: number
  /** Máximo da faixa em segundos */
  maxSeconds: number
  /** HEX da cor associada ao tier (para anel de progresso) */
  color:      string
  /** Descrição resumida da finalidade do tier */
  description: string
}

/**
 * Momento de disparo de feedback haptic durante o timer.
 *
 * halfway  — metade do tempo decorrido (lembrete suave)
 * warning  — últimos WARNING_THRESHOLD_SECONDS (alerta de proximidade)
 * complete — target atingido exatamente (vibração forte)
 * overtime — MAX_OVERTIME_SECONDS após o target (forçar retomada)
 */
export type HapticMoment = 'halfway' | 'warning' | 'complete' | 'overtime'

/**
 * Estado calculado completo do timer num dado instante.
 * Calculado uma vez por tick (1s) e passado ao componente via input.
 */
export interface TimerSnapshot {
  /** Segundos decorridos desde o início do descanso */
  elapsed:          number
  /** Segundos restantes (0 se overtime) */
  remaining:        number
  /** Target configurado para esta série */
  targetSeconds:    number
  /** 0–100 para o anel de progresso */
  progressPercent:  number
  /** true quando nos últimos WARNING_THRESHOLD_SECONDS */
  isWarning:        boolean
  /** true quando elapsed >= targetSeconds */
  isComplete:       boolean
  /** true quando elapsed > targetSeconds */
  isOvertime:       boolean
  /** Segundos além do target (0 se não overtime) */
  overtimeSeconds:  number
  /** String formatada para o display principal ("1:30" | "+0:15") */
  formattedDisplay: string
}

/**
 * Conjunto de triggers haptic calculados para um target.
 * Chaves = segundos decorridos em que o haptic deve disparar.
 */
export type HapticTriggerMap = Record<HapticMoment, number>

/**
 * Análise de aderência ao tempo de descanso prescrito.
 */
export interface RestAdherenceReport {
  prescribedSec:    number
  takenSec:         number
  deviationSec:     number     // positivo = mais descanso, negativo = menos
  deviationPercent: number
  isExcessive:      boolean
  isInsufficient:   boolean
  rating:           RestAdherenceRating
}

export type RestAdherenceRating = 'insufficient' | 'adequate' | 'excessive'

// ── Constantes ────────────────────────────────────────────────────

/** Segundos antes do fim que ativam o modo warning */
const WARNING_THRESHOLD_SECONDS = 10

/** Segundos máximos de overtime antes de forçar retomada */
const MAX_OVERTIME_SECONDS = 60

/** Menor target permitido no ajuste manual (10s) */
const MIN_TARGET_SECONDS = 10

/** Maior target permitido no ajuste manual (8 min) */
const MAX_TARGET_SECONDS = 480

/** Tolerância de desvio aceitável sem sinalizar (±20%) */
const ADHERENCE_TOLERANCE_PERCENT = 20

// ── Descanso recomendado por Protocol ────────────────────────────
//
// Fundamentos:
//   RPT: séries pesadas perto da falha → recuperação completa (3–4 min)
//   MYO activation: top set alto volume → 3 min
//   STRAIGHT: séries moderadas → 60–90s (Schoenfeld 2014)
//   PAUSE: tensão isométrica → 90–120s para remoção de lactato
//   RPT_HALF: menor volume por sessão → 2–3 min

const PROTOCOL_REST_SECONDS: Record<Protocol, number> = {
  RPT:      210,   // 3m30s
  MYO:      180,   // 3m00s  (ativação)
  STRAIGHT:  90,   // 1m30s
  PAUSE:    120,   // 2m00s
  RPT_HALF: 150,   // 2m30s
}

// ── Override de descanso por SetLabelType ─────────────────────────
//
// Mini-sets MYO: curto para manter estímulo metabólico acumulado.
// Aquecimentos: tempo mínimo — não há fadiga real para recuperar.

const LABEL_REST_OVERRIDE: Partial<Record<SetLabelType, number>> = {
  'ATIVAÇÃO': 180,
  'MINI ×1':   25,
  'MINI ×2':   25,
  'MINI ×3':   25,
  'MINI ×4':   25,
  'AQUEC. A':  30,
  'AQUEC. B':  30,
}

// ── Tiers descritivos ─────────────────────────────────────────────

const REST_TIERS: RestTier[] = [
  {
    name:        'Curto',
    minSeconds:  15,
    maxSeconds:  45,
    color:       '#22c55e',
    description: 'Mini-sets e exercícios leves',
  },
  {
    name:        'Moderado',
    minSeconds:  60,
    maxSeconds:  90,
    color:       '#f59e0b',
    description: 'Séries retas (STRAIGHT)',
  },
  {
    name:        'Padrão',
    minSeconds:  120,
    maxSeconds:  180,
    color:       '#3b82f6',
    description: 'Protocolo PAUSE e MYO ativação',
  },
  {
    name:        'Longo',
    minSeconds:  210,
    maxSeconds:  300,
    color:       '#a855f7',
    description: 'RPT e séries de alta intensidade',
  },
  {
    name:        'Máximo',
    minSeconds:  300,
    maxSeconds:  480,
    color:       '#f43f5e',
    description: 'Exercícios compostos pesados',
  },
]

export class RestTimerRules {

  // ── Recomendação de tempo ─────────────────────────────────────────

  /**
   * Retorna o tempo de descanso recomendado em segundos.
   *
   * Ordem de prioridade:
   *   1. Override explícito por SetLabelType (mini-sets, aquecimento)
   *   2. restSec do SetTemplate (prescrito pelo coach no plano)
   *   3. Fallback padrão por Protocol
   *
   * @param protocol     Protocol do exercício
   * @param label        SetLabelType da série que acabou de ser completada
   * @param templateSec  SetTemplate.restSec (0 = não definido)
   */
  static getRecommendedRestSeconds(
    protocol:    Protocol,
    label:       SetLabelType,
    templateSec: number = 0,
  ): number {
    const labelOverride = LABEL_REST_OVERRIDE[label]
    if (labelOverride !== undefined) return labelOverride
    if (templateSec > 0)             return templateSec
    return PROTOCOL_REST_SECONDS[protocol]
  }

  /**
   * Retorna o descanso padrão para um Protocol independente do label.
   * Útil para pré-carregar o timer antes de confirmar a série.
   */
  static getDefaultRestForProtocol(protocol: Protocol): number {
    return PROTOCOL_REST_SECONDS[protocol]
  }

  // ── Snapshot do estado ────────────────────────────────────────────

  /**
   * Calcula o estado completo do timer para um dado momento.
   * Projetado para ser chamado a cada tick do interval (1s).
   * É um cálculo puro — não armazena estado interno.
   *
   * @param elapsed  Segundos decorridos desde o início do descanso
   * @param target   Target em segundos (resultado de getRecommendedRestSeconds)
   */
  static getSnapshot(elapsed: number, target: number): TimerSnapshot {
    const remaining       = Math.max(0, target - elapsed)
    const progressPercent = Math.min(100, Math.round((elapsed / target) * 100))
    const isComplete      = elapsed >= target
    const isOvertime      = elapsed > target
    const overtimeSeconds = isOvertime ? elapsed - target : 0
    const isWarning       = !isComplete && remaining <= WARNING_THRESHOLD_SECONDS

    const formattedDisplay = isOvertime
      ? RestTimerRules.formatOvertime(overtimeSeconds)
      : RestTimerRules.formatCountdown(remaining)

    return {
      elapsed,
      remaining,
      targetSeconds:    target,
      progressPercent,
      isWarning,
      isComplete,
      isOvertime,
      overtimeSeconds,
      formattedDisplay,
    }
  }

  // ── Formatação ────────────────────────────────────────────────────

  /**
   * Formata segundos no padrão "M:SS" para o display principal.
   * Ex: 90 → "1:30" | 65 → "1:05" | 9 → "0:09"
   */
  static formatCountdown(totalSeconds: number): string {
    const abs = Math.abs(Math.floor(totalSeconds))
    const m   = Math.floor(abs / 60)
    const s   = abs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  /**
   * Formata segundos de overtime com prefixo "+".
   * Ex: 15 → "+0:15" | 75 → "+1:15"
   */
  static formatOvertime(overtimeSeconds: number): string {
    return `+${RestTimerRules.formatCountdown(overtimeSeconds)}`
  }

  /**
   * Formata segundos para exibição resumida em listas (histórico).
   * Ex: 90 → "1m30s" | 60 → "1m" | 45 → "45s"
   */
  static formatCompact(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    if (m === 0) return `${s}s`
    if (s === 0) return `${m}m`
    return `${m}m${s}s`
  }

  // ── Triggers haptic ───────────────────────────────────────────────

  /**
   * Calcula os segundos decorridos em que cada tipo de haptic
   * deve ser disparado para o target fornecido.
   *
   * @param target  Segundos alvo do timer
   */
  static getHapticTriggers(target: number): HapticTriggerMap {
    return {
      halfway:  Math.floor(target / 2),
      warning:  Math.max(0, target - WARNING_THRESHOLD_SECONDS),
      complete: target,
      overtime: target + MAX_OVERTIME_SECONDS,
    }
  }

  /**
   * Verifica qual HapticMoment deve disparar neste tick exato.
   * Retorna null se não há haptic a disparar no segundo informado.
   *
   * Uso no timer interval:
   *   const moment = RestTimerRules.getHapticMomentAt(elapsed, target)
   *   if (moment) hapticService.trigger(moment)
   *
   * @param elapsed  Segundos decorridos
   * @param target   Target em segundos
   */
  static getHapticMomentAt(
    elapsed: number,
    target:  number,
  ): HapticMoment | null {
    const triggers = RestTimerRules.getHapticTriggers(target)
    for (const [moment, triggerAt] of Object.entries(triggers)) {
      if (elapsed === triggerAt) return moment as HapticMoment
    }
    return null
  }

  // ── Auto-start ────────────────────────────────────────────────────

  /**
   * Indica se o timer deve iniciar automaticamente após completar a série.
   * Mini-sets MYO iniciam automático — o intervalo é muito curto para
   * exigir interação manual do atleta.
   */
  static shouldAutoStart(label: SetLabelType): boolean {
    const autoStartLabels: SetLabelType[] = [
      'MINI ×1',
      'MINI ×2',
      'MINI ×3',
      'MINI ×4',
    ]
    return autoStartLabels.includes(label)
  }

  /**
   * Indica se o timer deve ser exibido para uma série.
   * Séries de aquecimento não exibem timer padrão.
   */
  static shouldShowTimer(label: SetLabelType): boolean {
    return label !== 'AQUEC. A' && label !== 'AQUEC. B'
  }

  /**
   * Indica se o timer deve notificar ao completar mesmo com o app em background.
   * Apenas séries longas (> 60s) justificam notificação push.
   *
   * @param targetSeconds  Target do timer
   */
  static shouldScheduleNotification(targetSeconds: number): boolean {
    return targetSeconds > 60
  }

  // ── Tiers e ajuste manual ─────────────────────────────────────────

  /**
   * Retorna os tiers de descanso para o seletor manual da UI.
   */
  static getRestTiers(): RestTier[] {
    return REST_TIERS
  }

  /**
   * Retorna o tier que melhor corresponde ao tempo informado.
   * Retorna null se o valor estiver fora de todos os tiers.
   */
  static getTierForSeconds(seconds: number): RestTier | null {
    return REST_TIERS.find(
      t => seconds >= t.minSeconds && seconds <= t.maxSeconds,
    ) ?? null
  }

  /**
   * Adiciona ou remove segundos do target respeitando os limites globais.
   * Limite inferior: MIN_TARGET_SECONDS | Superior: MAX_TARGET_SECONDS.
   *
   * @param currentTarget  Target atual em segundos
   * @param delta          Segundos a acrescentar (negativo para reduzir)
   */
  static adjustTarget(currentTarget: number, delta: number): number {
    return Math.min(
      MAX_TARGET_SECONDS,
      Math.max(MIN_TARGET_SECONDS, currentTarget + delta),
    )
  }

  /**
   * Converte um valor de um tier para o próximo tier acima.
   * Usado nos botões de incremento rápido (+30s, +60s).
   *
   * @param currentTarget  Target atual
   * @param stepSeconds    Step de incremento (ex: 30)
   */
  static stepUp(currentTarget: number, stepSeconds: number = 30): number {
    return RestTimerRules.adjustTarget(currentTarget, stepSeconds)
  }

  /**
   * Converte um valor de um tier para o próximo tier abaixo.
   * Usado nos botões de decremento rápido (−30s).
   *
   * @param currentTarget  Target atual
   * @param stepSeconds    Step de decremento (ex: 30)
   */
  static stepDown(currentTarget: number, stepSeconds: number = 30): number {
    return RestTimerRules.adjustTarget(currentTarget, -stepSeconds)
  }

  // ── Análise de aderência ──────────────────────────────────────────

  /**
   * Gera o relatório completo de aderência ao descanso prescrito.
   * Usado na página de histórico e relatórios de aderência ao plano.
   *
   * @param prescribedSec  SetTemplate.restSec (prescrito pelo coach)
   * @param takenSec       SetLog.restTakenSec (registrado pelo atleta)
   */
  static getAdherenceReport(
    prescribedSec: number,
    takenSec:      number,
  ): RestAdherenceReport {
    const deviationSec     = takenSec - prescribedSec
    const deviationPercent = Math.round((deviationSec / prescribedSec) * 100)

    const excessThreshold      = prescribedSec * (1 + ADHERENCE_TOLERANCE_PERCENT / 100)
    const insufficientThreshold = prescribedSec * (1 - ADHERENCE_TOLERANCE_PERCENT / 100)

    const isExcessive     = takenSec > excessThreshold
    const isInsufficient  = takenSec < insufficientThreshold

    let rating: RestAdherenceRating = 'adequate'
    if (isExcessive)    rating = 'excessive'
    if (isInsufficient) rating = 'insufficient'

    return {
      prescribedSec,
      takenSec,
      deviationSec,
      deviationPercent,
      isExcessive,
      isInsufficient,
      rating,
    }
  }

  /**
   * Calcula o desvio médio de uma lista de pares prescrito/efetivo.
   * Retorna 0 se a lista estiver vazia.
   *
   * @param pairs  Array de { prescribed, taken }
   */
  static getAverageRestDeviation(
    pairs: Array<{ prescribed: number; taken: number }>,
  ): number {
    if (pairs.length === 0) return 0
    const total = pairs.reduce((sum, p) => sum + (p.taken - p.prescribed), 0)
    return Math.round(total / pairs.length)
  }

  /**
   * Verifica se o descanso foi excessivo individualmente.
   * Desvio positivo > tolerancePercent do prescrito.
   */
  static isRestExcessive(
    prescribedSec:    number,
    takenSec:         number,
    tolerancePercent: number = ADHERENCE_TOLERANCE_PERCENT,
  ): boolean {
    return takenSec > prescribedSec * (1 + tolerancePercent / 100)
  }

  /**
   * Verifica se o descanso foi insuficiente individualmente.
   * Desvio negativo > tolerancePercent do prescrito.
   * Descanso insuficiente pode impactar performance da próxima série.
   */
  static isRestInsufficient(
    prescribedSec:    number,
    takenSec:         number,
    tolerancePercent: number = ADHERENCE_TOLERANCE_PERCENT,
  ): boolean {
    return takenSec < prescribedSec * (1 - tolerancePercent / 100)
  }
}
