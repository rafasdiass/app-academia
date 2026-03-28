// ─────────────────────────────────────────────────────────────────
// sound.rules.ts
// Responsabilidade única: toda lógica pura do sistema de som.
//
// O que faz:
//   - Define tokens sonoros (frequência, forma de onda, envelope)
//   - Define os dois contextos de descanso: set-rest e exercise-rest
//   - Mapeia SoundEvent → SoundToken por contexto e perfil
//   - Define regras de quando um som deve ou não tocar
//   - Define perfis de usuário (silent, subtle, standard, full)
//
// O que NÃO faz:
//   - Não toca nada — zero Web Audio API aqui
//   - SoundService consome estas regras e faz o playback
//
// Contexto de uso:
//   Descanso entre séries (set-rest):
//     → timer mais curto, mesmo exercício continua
//     → som discreto ao iniciar, warning nos últimos 10s, beep duplo ao completar
//
//   Descanso entre exercícios (exercise-rest):
//     → timer mais longo, atleta pode ter se afastado do aparelho
//     → som mais destacado ao completar para chamar atenção
//     → aviso sonoro antecipado (30s antes) para o atleta se preparar
//
//   Isometria (protocolo PAUSE):
//     → tick por segundo da contração para o atleta manter o foco
//     → som de alívio ao completar
//
//   PR de carga ou volume:
//     → fanfarra curta — único som "positivo" fora dos timers
//
// Referências: Strong App, Gymboss, Apple Watch Workout, JEFIT.
// ─────────────────────────────────────────────────────────────────

// ── Tipos públicos ────────────────────────────────────────────────

/**
 * Contexto de descanso — determina tokens e comportamentos distintos.
 *
 * set       — entre séries do mesmo exercício (mais curto, discreto)
 * exercise  — entre exercícios diferentes (mais longo, mais destacado)
 */
export type RestContext = 'set' | 'exercise'

/**
 * Forma de onda do oscilador Web Audio API.
 *
 * sine     → suave e musical (conclusão, PR, alívio)
 * square   → percussivo e imediato (confirmar série, iniciar timer)
 * triangle → discreto, fundo (ticks por segundo)
 * sawtooth → urgente, levemente áspero (overtime)
 */
export type OscillatorWave = 'sine' | 'square' | 'triangle' | 'sawtooth'

/**
 * Descritor completo de um tom gerado por Web Audio API.
 * Sem dependência de arquivos de áudio — tudo em runtime.
 */
export interface SoundToken {
  /** Frequência principal em Hz */
  frequency:  number
  /** Duração total em milissegundos */
  durationMs: number
  /** Volume de pico (0.0–1.0) */
  volume:     number
  /** Forma de onda */
  wave:       OscillatorWave
  /** true = fade exponencial suave | false = corte abrupto */
  fadeOut:    boolean
  /**
   * Sequência de notas para sons compostos.
   * Quando presente substitui frequency/durationMs.
   */
  sequence?:  SoundNote[]
}

/**
 * Uma nota dentro de uma sequência multi-tom.
 */
export interface SoundNote {
  frequency:  number
  durationMs: number
  /** Silêncio após a nota antes da próxima (ms) */
  gapMs:      number
}

/**
 * Todos os eventos sonoros possíveis no ciclo de treino.
 *
 * set-rest-start         — timer entre séries iniciou
 * set-rest-warning       — tick contagem regressiva (10s → 1s)
 * set-rest-complete      — descanso entre séries concluído: próxima série
 * set-rest-overtime      — passou do tempo entre séries
 *
 * exercise-rest-start    — timer entre exercícios iniciou
 * exercise-rest-upcoming — aviso 30s antes do fim (prepare-se)
 * exercise-rest-warning  — tick contagem regressiva (10s → 1s)
 * exercise-rest-complete — descanso entre exercícios concluído: próximo exercício
 * exercise-rest-overtime — passou do tempo entre exercícios
 *
 * iso-tick               — tick a cada segundo da isometria
 * iso-warning            — últimos 3s da isometria
 * iso-complete           — isometria concluída
 *
 * set-pr                 — PR de carga ou volume atingido
 */
export type SoundEvent =
  | 'set-rest-start'
  | 'set-rest-warning'
  | 'set-rest-complete'
  | 'set-rest-overtime'
  | 'exercise-rest-start'
  | 'exercise-rest-upcoming'
  | 'exercise-rest-warning'
  | 'exercise-rest-complete'
  | 'exercise-rest-overtime'
  | 'iso-tick'
  | 'iso-warning'
  | 'iso-complete'
  | 'set-pr'

/**
 * Perfil sonoro configurável pelo usuário.
 *
 * silent   → mudo total (vibração do dispositivo pode continuar)
 * subtle   → apenas conclusões de descanso e PR
 * standard → todos os eventos exceto ticks por segundo
 * full     → tudo sem exceção
 */
export type SoundProfile = 'silent' | 'subtle' | 'standard' | 'full'

/**
 * Contexto de reprodução para SoundRules.shouldPlay().
 */
export interface SoundContext {
  profile:       SoundProfile
  /** true quando app está em background (tela bloqueada) */
  isBackground:  boolean
  /** true quando fones de ouvido estão conectados */
  hasHeadphones: boolean
  /** Volume master do sistema 0–100 */
  systemVolume:  number
}

/**
 * Descrição de um perfil para exibição nas configurações.
 */
export interface SoundProfileDescription {
  profile:     SoundProfile
  label:       string
  description: string
}

// ── Constantes ────────────────────────────────────────────────────

/** Segundos antes do fim da isometria que ativam iso-warning */
const ISO_WARNING_THRESHOLD_SECONDS = 3

/**
 * Segundos antes do fim do descanso entre exercícios
 * que ativam o aviso antecipado exercise-rest-upcoming.
 */
const EXERCISE_REST_UPCOMING_THRESHOLD_SECONDS = 30

/** Segundos antes do fim que ativam o tick de contagem regressiva */
const REST_WARNING_THRESHOLD_SECONDS = 10

/** Multiplicador de volume quando fones de ouvido estão conectados */
const HEADPHONES_VOLUME_MULTIPLIER = 0.65

/** Volume de sistema mínimo para tocar qualquer som */
const MIN_SYSTEM_VOLUME_TO_PLAY = 8

// ── Biblioteca de tokens ──────────────────────────────────────────
//
// Linguagem sonora semântica:
//   Frequências baixas  (220–350 Hz) → alívio, início calmo
//   Frequências médias  (400–600 Hz) → neutro, informação
//   Frequências altas   (650–900 Hz) → atenção, conclusão
//   Frequências muito altas (900+)   → conquista, PR
//
//   sine     → agradável, musical (conclusões, PR)
//   square   → imediato, click (início de timer, confirmação)
//   triangle → discreto (ticks)
//   sawtooth → urgente (overtime)

const SOUND_TOKEN_LIBRARY: Record<SoundEvent, SoundToken> = {

  // ── Descanso entre séries ────────────────────────────────────────

  /**
   * Beep grave e curto: "relaxa, o timer começou".
   * Discreto — o atleta está ali parado, sem precisar de alerta forte.
   */
  'set-rest-start': {
    frequency:  300,
    durationMs: 100,
    volume:     0.30,
    wave:       'square',
    fadeOut:    true,
  },

  /**
   * Tick de contagem regressiva nos últimos 10s entre séries.
   * Triangle ultracurto — perceptível sem irritar.
   */
  'set-rest-warning': {
    frequency:  500,
    durationMs: 45,
    volume:     0.22,
    wave:       'triangle',
    fadeOut:    false,
  },

  /**
   * Dois beeps ascendentes: "próxima série — vai!".
   * O atleta associa este som à ação de voltar ao exercício.
   */
  'set-rest-complete': {
    frequency:  660,
    durationMs: 110,
    volume:     0.50,
    wave:       'sine',
    fadeOut:    true,
    sequence: [
      { frequency: 660, durationMs: 110, gapMs: 35 },
      { frequency: 830, durationMs: 180, gapMs:  0 },
    ],
  },

  /**
   * Dois beeps idênticos urgentes: "você passou do tempo entre séries".
   */
  'set-rest-overtime': {
    frequency:  580,
    durationMs: 130,
    volume:     0.45,
    wave:       'sawtooth',
    fadeOut:    true,
    sequence: [
      { frequency: 580, durationMs: 130, gapMs: 70 },
      { frequency: 580, durationMs: 130, gapMs:  0 },
    ],
  },

  // ── Descanso entre exercícios ────────────────────────────────────

  /**
   * Som levemente mais marcante que set-rest-start.
   * O atleta pode ter se afastado do aparelho — precisa saber
   * que o timer maior começou.
   */
  'exercise-rest-start': {
    frequency:  370,
    durationMs: 200,
    volume:     0.40,
    wave:       'square',
    fadeOut:    true,
    sequence: [
      { frequency: 300, durationMs: 100, gapMs: 40 },
      { frequency: 370, durationMs: 180, gapMs:  0 },
    ],
  },

  /**
   * Aviso antecipado: 30s antes do fim do descanso entre exercícios.
   * "Começa a se preparar — o próximo exercício está chegando."
   * Tom suave — apenas um lembrete, não alarme.
   */
  'exercise-rest-upcoming': {
    frequency:  528,
    durationMs: 160,
    volume:     0.38,
    wave:       'sine',
    fadeOut:    true,
  },

  /**
   * Tick de contagem regressiva nos últimos 10s entre exercícios.
   * Igual ao set-rest-warning mas levemente mais alto —
   * o atleta pode estar mais longe.
   */
  'exercise-rest-warning': {
    frequency:  520,
    durationMs: 50,
    volume:     0.28,
    wave:       'triangle',
    fadeOut:    false,
  },

  /**
   * Sequência de três notas ascendentes: "próximo exercício — vai!".
   * Mais elaborado que set-rest-complete — marca uma transição maior.
   * Volume mais alto pois o atleta pode ter se afastado.
   */
  'exercise-rest-complete': {
    frequency:  523,
    durationMs: 120,
    volume:     0.62,
    wave:       'sine',
    fadeOut:    false,
    sequence: [
      { frequency: 523, durationMs: 120, gapMs: 40 },
      { frequency: 659, durationMs: 120, gapMs: 40 },
      { frequency: 784, durationMs: 220, gapMs:  0 },
    ],
  },

  /**
   * Padrão de alarme mais urgente: o atleta está há muito tempo parado.
   * Três pulsos curtos — padrão universal de "atenção".
   */
  'exercise-rest-overtime': {
    frequency:  620,
    durationMs: 120,
    volume:     0.55,
    wave:       'sawtooth',
    fadeOut:    true,
    sequence: [
      { frequency: 620, durationMs: 120, gapMs: 60 },
      { frequency: 620, durationMs: 120, gapMs: 60 },
      { frequency: 620, durationMs: 120, gapMs:  0 },
    ],
  },

  // ── Isometria ────────────────────────────────────────────────────

  /**
   * Tick subliminar por segundo da contração isométrica.
   * O atleta está concentrado no músculo — o som deve existir
   * em segundo plano sem quebrar o foco.
   */
  'iso-tick': {
    frequency:  780,
    durationMs: 30,
    volume:     0.14,
    wave:       'triangle',
    fadeOut:    false,
  },

  /**
   * Últimos 3s da isometria — levemente mais alto que iso-tick.
   * Mesma frequência para continuidade; volume sobe para urgência.
   */
  'iso-warning': {
    frequency:  780,
    durationMs: 55,
    volume:     0.28,
    wave:       'triangle',
    fadeOut:    true,
  },

  /**
   * Tom grave e longo: "pode soltar — isometria concluída".
   * Grave = alívio fisiológico. Sine = suave, não assusta.
   * 260 Hz ≈ Dó3 — inconfundível, diferente de todos os outros.
   */
  'iso-complete': {
    frequency:  260,
    durationMs: 350,
    volume:     0.42,
    wave:       'sine',
    fadeOut:    true,
  },

  // ── PR ───────────────────────────────────────────────────────────

  /**
   * Fanfarra de quatro notas ascendentes: conquista de novo recorde.
   * O único som "comemorativo" do app — deve se destacar de tudo.
   * Volume mais alto + notas acima de 1kHz = impacto emocional.
   */
  'set-pr': {
    frequency:  659,
    durationMs: 100,
    volume:     0.68,
    wave:       'sine',
    fadeOut:    false,
    sequence: [
      { frequency:  659, durationMs: 100, gapMs: 30 },
      { frequency:  784, durationMs: 100, gapMs: 30 },
      { frequency:  988, durationMs: 100, gapMs: 30 },
      { frequency: 1319, durationMs: 280, gapMs:  0 },
    ],
  },
}

// ── Eventos permitidos por perfil ─────────────────────────────────

const PROFILE_ALLOWED_EVENTS: Record<SoundProfile, ReadonlyArray<SoundEvent>> = {
  silent: [],

  subtle: [
    'set-rest-complete',
    'exercise-rest-complete',
    'iso-complete',
    'set-pr',
  ],

  standard: [
    'set-rest-start',
    'set-rest-complete',
    'set-rest-overtime',
    'exercise-rest-start',
    'exercise-rest-upcoming',
    'exercise-rest-complete',
    'exercise-rest-overtime',
    'iso-warning',
    'iso-complete',
    'set-pr',
  ],

  full: [
    'set-rest-start',
    'set-rest-warning',
    'set-rest-complete',
    'set-rest-overtime',
    'exercise-rest-start',
    'exercise-rest-upcoming',
    'exercise-rest-warning',
    'exercise-rest-complete',
    'exercise-rest-overtime',
    'iso-tick',
    'iso-warning',
    'iso-complete',
    'set-pr',
  ],
}

// ── Eventos críticos (tocam mesmo em background) ──────────────────

const CRITICAL_EVENTS: ReadonlyArray<SoundEvent> = [
  'set-rest-complete',
  'exercise-rest-complete',
  'exercise-rest-upcoming',
  'iso-complete',
  'set-pr',
  'set-rest-overtime',
  'exercise-rest-overtime',
]

export class SoundRules {

  // ── Tokens ────────────────────────────────────────────────────────

  /**
   * Retorna o SoundToken para um evento.
   * O SoundService usa este token para configurar o oscilador.
   */
  static getToken(event: SoundEvent): SoundToken {
    return SOUND_TOKEN_LIBRARY[event]
  }

  /**
   * Indica se o token usa sequência de notas em vez de tom único.
   * Quando true, o SoundService deve iterar token.sequence[].
   */
  static hasSequence(event: SoundEvent): boolean {
    const token = SOUND_TOKEN_LIBRARY[event]
    return Array.isArray(token.sequence) && token.sequence.length > 0
  }

  /**
   * Duração total em ms — incluindo todas as notas e gaps da sequência.
   * Usado pelo SoundService para agendar o próximo evento sem overlap.
   */
  static getTotalDurationMs(event: SoundEvent): number {
    const token = SOUND_TOKEN_LIBRARY[event]

    if (!Array.isArray(token.sequence) || token.sequence.length === 0) {
      return token.durationMs
    }

    return token.sequence.reduce(
      (acc, note) => acc + note.durationMs + note.gapMs,
      0,
    )
  }

  // ── Regras de reprodução ─────────────────────────────────────────

  /**
   * Indica se um evento deve ser tocado dado o contexto atual.
   *
   * Ordem de prioridade:
   *   1. Perfil silent → nunca
   *   2. Volume do sistema abaixo do mínimo → nunca
   *   3. App em background → apenas eventos críticos
   *   4. Evento fora da lista do perfil → não
   */
  static shouldPlay(event: SoundEvent, context: SoundContext): boolean {
    if (context.profile === 'silent')                    return false
    if (context.systemVolume < MIN_SYSTEM_VOLUME_TO_PLAY) return false
    if (context.isBackground)                            return SoundRules.isCriticalEvent(event)

    return (PROFILE_ALLOWED_EVENTS[context.profile] as SoundEvent[]).includes(event)
  }

  /**
   * Indica se o evento é crítico — deve tocar mesmo em background.
   */
  static isCriticalEvent(event: SoundEvent): boolean {
    return (CRITICAL_EVENTS as SoundEvent[]).includes(event)
  }

  /**
   * Indica se o evento produz ticks repetidos por segundo.
   * O SoundService usa um interval separado para estes eventos
   * em vez de chamadas únicas de play().
   */
  static isRepeatingTickEvent(event: SoundEvent): boolean {
    return event === 'set-rest-warning'
      || event === 'exercise-rest-warning'
      || event === 'iso-tick'
      || event === 'iso-warning'
  }

  /**
   * Calcula o volume ajustado para o contexto de reprodução.
   * Reduz automaticamente se fones de ouvido estiverem conectados.
   */
  static getComfortVolume(event: SoundEvent, context: SoundContext): number {
    const base       = SOUND_TOKEN_LIBRARY[event].volume
    const headphones = context.hasHeadphones ? HEADPHONES_VOLUME_MULTIPLIER : 1.0
    const system     = Math.min(1, context.systemVolume / 100)
    return Math.min(1, base * headphones * system)
  }

  // ── Mapeamento de contexto de descanso ───────────────────────────

  /**
   * Retorna o SoundEvent de início correto para o contexto.
   */
  static getRestStartEvent(restContext: RestContext): SoundEvent {
    return restContext === 'set' ? 'set-rest-start' : 'exercise-rest-start'
  }

  /**
   * Retorna o SoundEvent de conclusão correto para o contexto.
   */
  static getRestCompleteEvent(restContext: RestContext): SoundEvent {
    return restContext === 'set' ? 'set-rest-complete' : 'exercise-rest-complete'
  }

  /**
   * Retorna o SoundEvent de overtime correto para o contexto.
   */
  static getRestOvertimeEvent(restContext: RestContext): SoundEvent {
    return restContext === 'set' ? 'set-rest-overtime' : 'exercise-rest-overtime'
  }

  /**
   * Retorna o SoundEvent de warning (tick) correto para o contexto.
   */
  static getRestWarningEvent(restContext: RestContext): SoundEvent {
    return restContext === 'set' ? 'set-rest-warning' : 'exercise-rest-warning'
  }

  /**
   * Indica se deve tocar o aviso antecipado "upcoming" (30s antes).
   * Apenas aplicável ao descanso entre exercícios.
   *
   * @param restContext      Contexto do descanso
   * @param remainingSeconds Segundos restantes no timer
   */
  static shouldPlayUpcomingWarning(
    restContext:      RestContext,
    remainingSeconds: number,
  ): boolean {
    return restContext === 'exercise'
      && remainingSeconds === EXERCISE_REST_UPCOMING_THRESHOLD_SECONDS
  }

  /**
   * Indica se deve tocar o tick de warning (últimos 10s).
   *
   * @param remainingSeconds Segundos restantes no timer
   */
  static shouldPlayRestWarningTick(remainingSeconds: number): boolean {
    return remainingSeconds > 0 && remainingSeconds <= REST_WARNING_THRESHOLD_SECONDS
  }

  // ── Isometria ────────────────────────────────────────────────────

  /**
   * Retorna o SoundEvent correto para um dado segundo da isometria.
   * Últimos ISO_WARNING_THRESHOLD_SECONDS → iso-warning.
   * Demais → iso-tick.
   *
   * @param remainingSeconds Segundos restantes da contração
   */
  static getIsoEventForSecond(remainingSeconds: number): SoundEvent {
    return remainingSeconds <= ISO_WARNING_THRESHOLD_SECONDS
      ? 'iso-warning'
      : 'iso-tick'
  }

  // ── Perfis ────────────────────────────────────────────────────────

  /**
   * Retorna os perfis disponíveis com rótulo e descrição.
   * Usado para popular o seletor nas configurações.
   */
  static getProfileDescriptions(): SoundProfileDescription[] {
    return [
      {
        profile:     'silent',
        label:       'Silencioso',
        description: 'Sem sons — apenas vibração do dispositivo',
      },
      {
        profile:     'subtle',
        label:       'Sutil',
        description: 'Apenas conclusão dos timers e PR',
      },
      {
        profile:     'standard',
        label:       'Padrão',
        description: 'Todos os eventos, sem ticks por segundo',
      },
      {
        profile:     'full',
        label:       'Completo',
        description: 'Todos os sons incluindo ticks de contagem',
      },
    ]
  }

  /**
   * Retorna os eventos ativos para um perfil.
   * Usado na tela de configurações para preview.
   */
  static getAllowedEventsForProfile(profile: SoundProfile): SoundEvent[] {
    return [...PROFILE_ALLOWED_EVENTS[profile]]
  }
}
