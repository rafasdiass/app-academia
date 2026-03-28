// ─────────────────────────────────────────────────────────────────
// sound.service.ts
// Responsabilidade única: playback de sons via Web Audio API.
//
// Funciona em:
//   - Web browser (Chrome, Safari, Firefox)
//   - Ionic + Capacitor (iOS via WKWebView, Android via WebView)
//
// Estratégia por plataforma:
//   Web/Android → Web Audio API direta
//   iOS         → Web Audio API + unlock obrigatório via gesto do usuário
//                 (WKWebView exige AudioContext.resume() após user gesture)
//   Background  → @capacitor/local-notifications agenda aviso de conclusão
//                 no momento de iniciar o timer (não requer app aberto)
//
// Consumo:
//   - SoundRules para toda lógica de negócio (quando, qual, volume)
//   - Nenhuma lógica de timer aqui — recebe eventos externos
//
// Uso direto nas pages/componentes:
//   soundService.playRestStart('set')
//   soundService.playRestComplete('exercise')
//   soundService.playIsoTick(remainingSeconds)
//   soundService.playPr()
// ─────────────────────────────────────────────────────────────────
import { Injectable, inject }            from '@angular/core'
import { Platform }                      from '@ionic/angular'
import {
  SoundRules,
  SoundEvent,
  SoundContext,
  SoundToken,
  SoundNote,
  RestContext,
  SoundProfile,
}                                        from '@core/rules'

// ── Tipos internos ─────────────────────────────────────────────────

/**
 * Nó de gain + oscilador agrupados para cleanup correto.
 * Armazenados para poder parar manualmente se necessário.
 */
interface ActiveOscillator {
  oscillator: OscillatorNode
  gain:       GainNode
}

// ── Constantes ────────────────────────────────────────────────────

/**
 * Tag para identificar notificações locais do timer de descanso.
 * Capacitor Local Notifications usa id numérico — usamos
 * um range reservado para evitar colisão.
 */
const NOTIFICATION_ID_REST_COMPLETE  = 9001
const NOTIFICATION_ID_REST_UPCOMING  = 9002

export class SoundServiceError extends Error {
  constructor(message: string) {
    super(`[SoundService] ${message}`)
  }
}

// ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SoundService {

  private readonly platform = inject(Platform)

  // ── Estado interno ───────────────────────────────────────────────

  /** AudioContext único — criado uma vez e reutilizado */
  private audioContext: AudioContext | null = null

  /** true após o primeiro gesto do usuário (unlock iOS) */
  private isUnlocked = false

  /** Contexto atual — atualizado por SettingsService/SensorService */
  private soundContext: SoundContext = {
    profile:       'standard',
    isBackground:  false,
    hasHeadphones: false,
    systemVolume:  80,
  }

  /** Osciladores ativos — para parada emergencial */
  private activeOscillators: ActiveOscillator[] = []

  // ── Inicialização e unlock ────────────────────────────────────────

  /**
   * Inicializa o AudioContext.
   * Deve ser chamado em resposta a um gesto do usuário
   * (tap no botão "Iniciar Treino" ou equivalente).
   *
   * iOS exige que o AudioContext seja criado ou resumido após
   * um user gesture — do contrário os sons são silenciados pelo sistema.
   *
   * Idempotente: chamadas subsequentes são no-op.
   */
  initialize(): void {
    if (this.audioContext) {
      this.resumeIfSuspended()
      return
    }

    try {
      this.audioContext = new AudioContext()
      this.resumeIfSuspended()
      this.isUnlocked = true
    } catch {
      // AudioContext não disponível no ambiente (SSR, testes unitários)
      // O serviço degrada graciosamente — shouldPlay() retornará false
      // quando audioContext for null.
    }
  }

  /**
   * Retoma o AudioContext se suspenso pelo sistema operacional.
   * iOS suspende o contexto quando o app vai para background.
   * Deve ser chamado ao retornar ao foreground (App.appStateChange).
   */
  resumeIfSuspended(): void {
    if (!this.audioContext) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {
        // Resume falhou — iOS ainda não liberou o contexto.
        // O próximo gesto do usuário tentará novamente.
      })
    }
  }

  /**
   * Suspende o AudioContext para liberar recursos.
   * Deve ser chamado quando o app vai para background
   * (App.appStateChange → isActive = false).
   */
  suspend(): void {
    if (!this.audioContext) return
    if (this.audioContext.state === 'running') {
      this.audioContext.suspend().catch(() => {})
    }
  }

  // ── Atualização de contexto ───────────────────────────────────────

  /**
   * Atualiza o perfil sonoro do usuário.
   * Chamado pelo SettingsService quando o usuário muda a preferência.
   */
  setProfile(profile: SoundProfile): void {
    this.soundContext = { ...this.soundContext, profile }
  }

  /**
   * Atualiza o estado de background do app.
   * Chamado por AppComponent ao ouvir App.appStateChange do Capacitor.
   */
  setBackground(isBackground: boolean): void {
    this.soundContext = { ...this.soundContext, isBackground }
    if (!isBackground) this.resumeIfSuspended()
  }

  /**
   * Atualiza o estado de fones de ouvido.
   * Chamado por AudioSessionService (plugin Capacitor de áudio).
   */
  setHeadphones(hasHeadphones: boolean): void {
    this.soundContext = { ...this.soundContext, hasHeadphones }
  }

  /**
   * Atualiza o volume master do sistema (0–100).
   * Chamado por AudioSessionService ao detectar mudança de volume.
   */
  setSystemVolume(systemVolume: number): void {
    this.soundContext = { ...this.soundContext, systemVolume }
  }

  // ── API pública — eventos de descanso ────────────────────────────

  /**
   * Toca o som de início do timer de descanso.
   * Deve ser chamado imediatamente após o atleta confirmar a série.
   *
   * Além do som imediato, agenda notificação local para o momento
   * de conclusão — garante que o atleta ouça o aviso mesmo com
   * o app em background ou tela bloqueada.
   *
   * @param restContext  'set' (entre séries) | 'exercise' (entre exercícios)
   * @param targetSeconds Duração do descanso em segundos
   */
  playRestStart(restContext: RestContext, targetSeconds: number): void {
    const event = SoundRules.getRestStartEvent(restContext)
    this.playEvent(event)
    this.scheduleRestNotifications(restContext, targetSeconds)
  }

  /**
   * Toca o tick de contagem regressiva do descanso.
   * Deve ser chamado a cada segundo quando remainingSeconds ≤ 10.
   * O SoundRules.shouldPlayRestWarningTick() filtra os momentos corretos.
   *
   * @param restContext      Contexto do descanso
   * @param remainingSeconds Segundos restantes no timer
   */
  playRestWarningTick(restContext: RestContext, remainingSeconds: number): void {
    if (!SoundRules.shouldPlayRestWarningTick(remainingSeconds)) return

    const event = SoundRules.getRestWarningEvent(restContext)
    this.playEvent(event)
  }

  /**
   * Toca o aviso antecipado "upcoming" — 30s antes do fim.
   * Apenas para descanso entre exercícios.
   * O SoundRules.shouldPlayUpcomingWarning() filtra os momentos corretos.
   *
   * @param restContext      Contexto do descanso
   * @param remainingSeconds Segundos restantes no timer
   */
  playRestUpcomingIfNeeded(restContext: RestContext, remainingSeconds: number): void {
    if (!SoundRules.shouldPlayUpcomingWarning(restContext, remainingSeconds)) return

    this.playEvent('exercise-rest-upcoming')
  }

  /**
   * Toca o som de conclusão do descanso.
   * Deve ser chamado quando o timer chegar a zero.
   * Cancela a notificação local agendada (já não é necessária).
   *
   * @param restContext  'set' | 'exercise'
   */
  playRestComplete(restContext: RestContext): void {
    const event = SoundRules.getRestCompleteEvent(restContext)
    this.playEvent(event)
    this.cancelRestNotifications()
  }

  /**
   * Toca o som de overtime do descanso.
   * Deve ser chamado quando o atleta passa do tempo configurado.
   * Chamadas repetidas são espaçadas pelo chamador (ex: a cada 30s).
   *
   * @param restContext  'set' | 'exercise'
   */
  playRestOvertime(restContext: RestContext): void {
    const event = SoundRules.getRestOvertimeEvent(restContext)
    this.playEvent(event)
  }

  // ── API pública — isometria ───────────────────────────────────────

  /**
   * Toca o som correto para um segundo da isometria.
   * Internamente decide entre iso-tick e iso-warning
   * com base nos segundos restantes.
   *
   * Deve ser chamado a cada segundo do timer isométrico.
   *
   * @param remainingSeconds Segundos restantes da contração
   */
  playIsoTick(remainingSeconds: number): void {
    const event = SoundRules.getIsoEventForSecond(remainingSeconds)
    this.playEvent(event)
  }

  /**
   * Toca o som de conclusão da isometria.
   * Deve ser chamado quando o timer isométrico chegar a zero.
   */
  playIsoComplete(): void {
    this.playEvent('iso-complete')
  }

  // ── API pública — PR ──────────────────────────────────────────────

  /**
   * Toca a fanfarra de PR.
   * Deve ser chamado quando ProgressionRules detectar novo recorde
   * de carga ou volume em uma série.
   */
  playPr(): void {
    this.playEvent('set-pr')
  }

  // ── Controle ──────────────────────────────────────────────────────

  /**
   * Para todos os osciladores ativos imediatamente.
   * Útil ao cancelar o treino ou navegar para fora da sessão.
   */
  stopAll(): void {
    for (const { oscillator, gain } of this.activeOscillators) {
      try {
        gain.gain.cancelScheduledValues(this.audioContext?.currentTime ?? 0)
        oscillator.stop()
      } catch {
        // Oscilador já parado — ignorar
      }
    }
    this.activeOscillators = []
  }

  /**
   * Libera todos os recursos de áudio.
   * Deve ser chamado no ngOnDestroy de AppComponent ou ao fazer logout.
   */
  async dispose(): Promise<void> {
    this.stopAll()
    this.cancelRestNotifications()

    if (this.audioContext) {
      await this.audioContext.close().catch(() => {})
      this.audioContext = null
      this.isUnlocked   = false
    }
  }

  // ── Playback interno ──────────────────────────────────────────────

  /**
   * Ponto de entrada interno para todos os eventos.
   * Aplica shouldPlay() antes de qualquer operação de áudio.
   */
  private playEvent(event: SoundEvent): void {
    if (!this.audioContext)                             return
    if (!this.isUnlocked)                               return
    if (!SoundRules.shouldPlay(event, this.soundContext)) return

    const token = SoundRules.getToken(event)

    if (SoundRules.hasSequence(event)) {
      this.playSequence(event, token)
    } else {
      this.playSingleTone(event, token)
    }
  }

  /**
   * Reproduz um tom único (sem sequência).
   */
  private playSingleTone(event: SoundEvent, token: SoundToken): void {
    if (!this.audioContext) return

    const ctx        = this.audioContext
    const now        = ctx.currentTime
    const durationSec = token.durationMs / 1000
    const volume     = SoundRules.getComfortVolume(event, this.soundContext)

    const oscillator = ctx.createOscillator()
    const gain       = ctx.createGain()

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.type = token.wave
    oscillator.frequency.setValueAtTime(token.frequency, now)
    gain.gain.setValueAtTime(volume, now)

    if (token.fadeOut) {
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec)
    }

    const entry: ActiveOscillator = { oscillator, gain }
    this.activeOscillators.push(entry)

    oscillator.onended = () => {
      this.activeOscillators = this.activeOscillators.filter(a => a !== entry)
    }

    oscillator.start(now)
    oscillator.stop(now + durationSec)
  }

  /**
   * Reproduz uma sequência de notas com timing preciso.
   * Agenda todas as notas de uma vez (sem setInterval) —
   * Web Audio API agenda internamente no thread de áudio.
   */
  private playSequence(event: SoundEvent, token: SoundToken): void {
    if (!this.audioContext || !token.sequence) return

    const ctx    = this.audioContext
    const volume = SoundRules.getComfortVolume(event, this.soundContext)
    let   offset = 0

    token.sequence.forEach((note: SoundNote) => {
      const startAt     = ctx.currentTime + offset / 1000
      const durationSec = note.durationMs / 1000

      const oscillator = ctx.createOscillator()
      const gain       = ctx.createGain()

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.type = token.wave
      oscillator.frequency.setValueAtTime(note.frequency, startAt)
      gain.gain.setValueAtTime(volume, startAt)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec)

      const entry: ActiveOscillator = { oscillator, gain }
      this.activeOscillators.push(entry)

      oscillator.onended = () => {
        this.activeOscillators = this.activeOscillators.filter(a => a !== entry)
      }

      oscillator.start(startAt)
      oscillator.stop(startAt + durationSec)

      offset += note.durationMs + note.gapMs
    })
  }

  // ── Notificações locais (Capacitor) ───────────────────────────────

  /**
   * Agenda notificações locais para o momento de conclusão do descanso.
   * Funciona mesmo com app em background ou tela bloqueada.
   *
   * Estratégia:
   *   - Se Capacitor não disponível (web puro) → silently no-op
   *   - exercise-rest: agenda também o upcoming (30s antes)
   *   - Cancela qualquer notificação anterior antes de agendar nova
   *
   * @param restContext   Contexto do descanso
   * @param targetSeconds Duração total do descanso em segundos
   */
  private scheduleRestNotifications(
    restContext:   RestContext,
    targetSeconds: number,
  ): void {
    if (!this.isCapacitorAvailable()) return

    // Importação dinâmica — evita erro em ambiente web sem Capacitor
    import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
      this.cancelRestNotifications()

      const now            = Date.now()
      const completeAt     = new Date(now + targetSeconds * 1000)
      const notifications  = []

      const completeLabel = restContext === 'set'
        ? 'Próxima série'
        : 'Próximo exercício'

      const completeBody = restContext === 'set'
        ? 'Descanso concluído — hora da próxima série!'
        : 'Descanso concluído — próximo exercício aguarda!'

      notifications.push({
        id:       NOTIFICATION_ID_REST_COMPLETE,
        title:    completeLabel,
        body:     completeBody,
        schedule: { at: completeAt },
        sound:    undefined,   // sem som nativo — Web Audio gerencia o som
        smallIcon: 'ic_stat_fittracker',
      })

      // Aviso antecipado apenas para exercise-rest com tempo suficiente
      if (restContext === 'exercise' && targetSeconds > 30) {
        const upcomingAt = new Date(now + (targetSeconds - 30) * 1000)
        notifications.push({
          id:       NOTIFICATION_ID_REST_UPCOMING,
          title:    'Prepare-se',
          body:     'Próximo exercício em 30 segundos.',
          schedule: { at: upcomingAt },
          sound:    undefined,
          smallIcon: 'ic_stat_fittracker',
        })
      }

      LocalNotifications.schedule({ notifications }).catch(() => {
        // Permissão negada ou Capacitor não inicializado — no-op
      })
    }).catch(() => {
      // Plugin não instalado — web puro, sem notificações locais
    })
  }

  /**
   * Cancela as notificações de descanso agendadas.
   * Chamado em: playRestComplete(), dispose(), stopAll().
   */
  private cancelRestNotifications(): void {
    if (!this.isCapacitorAvailable()) return

    import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
      LocalNotifications.cancel({
        notifications: [
          { id: NOTIFICATION_ID_REST_COMPLETE },
          { id: NOTIFICATION_ID_REST_UPCOMING },
        ],
      }).catch(() => {})
    }).catch(() => {})
  }

  /**
   * Verifica se o Capacitor está disponível no ambiente atual.
   * Retorna false em web puro ou SSR.
   */
  private isCapacitorAvailable(): boolean {
    return this.platform.is('capacitor')
  }
}
