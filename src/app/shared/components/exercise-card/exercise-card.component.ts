// ─────────────────────────────────────────────────────────────────
// exercise-card.component.ts
// Responsabilidade única: renderizar um exercício com accordion.
//
// Inputs recebidos do TreinoTabComponent:
//   exercise       — ExerciseTemplate completo vindo do Firestore
//   color          — ColorTheme do bloco (rose, teal, blue, orange…)
//   index          — posição 1-based na lista (01, 02…)
//   expanded       — estado do accordion (controlado pelo pai)
//   executionCount — quantas vezes o atleta executou este exercício
//   lastDoneAt     — ISO date da última execução (null = nunca)
//   expandedChange — evento emitido ao clicar no header
// ─────────────────────────────────────────────────────────────────
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  Pipe,
  PipeTransform,
} from '@angular/core'
import { CommonModule }                  from '@angular/common'
import { IonIcon }                       from '@ionic/angular/standalone'
import { addIcons }                      from 'ionicons'
import {
  chevronForwardOutline,
  chevronDownOutline,
  flaskOutline,
  layersOutline,
  repeatOutline,
  starOutline,
} from 'ionicons/icons'
import { ExerciseTemplate, ColorTheme }  from '@core/models'
import { ColorThemeRules }               from '@core/rules'
import { ProtocolBadgeComponent }        from '@shared/components/protocol-badge/protocol-badge.component'
import { SetRowComponent }               from '@shared/components/set-row/set-row.component'
import { RestTimerComponent }            from '@shared/components/rest-timer/rest-timer.component'
import { DaysAgoPipe }                   from '@shared/pipes/days-ago.pipe'

// ── Pipe: flag → classe CSS ──────────────────────────────────────
// Mapeia BodyFlag (vindo do Firestore) para a classe kf-* do SCSS.
// Normaliza comparação via startsWith para evitar problemas de encoding.
@Pipe({ name: 'flagClass', standalone: true })
export class FlagClassPipe implements PipeTransform {
  transform(flag: string | null | undefined): string {
    if (!flag) return ''
    const f = flag.trim().toUpperCase()
    if (f === 'JOELHO')            return 'knee'
    if (f.startsWith('90'))        return 'max90'
    if (f.startsWith('LOMBAR'))    return 'lombar'
    return 'knee'
  }
}

// ─────────────────────────────────────────────────────────────────

@Component({
  selector:        'app-exercise-card',
  templateUrl:     './exercise-card.component.html',
  styleUrls:       ['./exercise-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports: [
    CommonModule,
    IonIcon,
    FlagClassPipe,
    DaysAgoPipe,
    ProtocolBadgeComponent,
    SetRowComponent,
    RestTimerComponent,
  ],
})
export class ExerciseCardComponent {

  constructor() {
    addIcons({
      chevronForwardOutline,
      chevronDownOutline,
      flaskOutline,
      layersOutline,
      repeatOutline,
      starOutline,
    })
  }

  // ── Inputs obrigatórios ──────────────────────────────────────────

  /** ExerciseTemplate completo vindo do Firestore via TreinoBlock */
  @Input({ required: true }) exercise!: ExerciseTemplate

  /** ColorTheme do bloco pai — define --c e --a */
  @Input({ required: true }) color!: ColorTheme

  /** Posição 1-based do exercício na lista (exibido como "01 ·") */
  @Input({ required: true }) index!: number

  // ── Inputs opcionais ─────────────────────────────────────────────

  /** Estado do accordion — controlado pelo TreinoTabComponent */
  @Input() expanded = false

  /**
   * Quantas vezes o atleta já executou este exercício.
   * Vem de ExerciseStat.totalSessions via TreinoTabComponent.
   * 0 = nunca executado → exibe "Primeira vez".
   */
  @Input() executionCount = 0

  /**
   * ISO date string da última execução do exercício.
   * null = nunca executado.
   * Exibido pelo pipe | daysAgo → "3 dias atrás".
   */
  @Input() lastDoneAt: string | null = null

  // ── Output ───────────────────────────────────────────────────────

  /** Emitido ao clicar no header — pai faz o toggle do accordion */
  @Output() expandedChange = new EventEmitter<void>()

  // ── Handlers ─────────────────────────────────────────────────────

  onHeaderClick(): void {
    this.expandedChange.emit()
  }

  // ── Helpers de cor — delegam para ColorThemeRules ────────────────

  /** Hex da cor do tema do bloco (ex: '#e8607a' para rose) */
  getThemeHex(): string {
    return ColorThemeRules.getHex(this.color)
  }

  /** Hex com 15% de opacidade — usado em --a e backgrounds suaves */
  getThemeAlpha15(): string {
    return ColorThemeRules.getHexAlpha15(this.color)
  }

  /** Cor de fundo do badge de músculo (~15% opacidade) */
  getMuscleAlpha(): string {
    return ColorThemeRules.getHexAlpha15(this.color)
  }

  // ── Getters derivados de exercise ────────────────────────────────

  /**
   * Label legível das rodadas prescritas.
   * Derivado de exercise.totalRounds + exercise.protocol (campos do Firestore).
   * Ex: "3 séries RPT" | "2 rodadas Myo" | "3 séries"
   */
  get roundsLabel(): string {
    const n     = this.exercise?.totalRounds ?? this.exercise?.sets?.length ?? 0
    const proto = this.exercise?.protocol
    if (proto === 'MYO')    return `${n} rodada${n !== 1 ? 's' : ''} Myo`
    if (proto === 'RPT')    return `${n} série${n !== 1 ? 's' : ''} RPT`
    return `${n} série${n !== 1 ? 's' : ''}`
  }

  /**
   * restSec da última série — usado pelo RestTimerComponent.
   * 0 = sem descanso configurado → componente não é renderizado.
   */
  get lastSetRestSec(): number {
    const sets = this.exercise?.sets
    if (!sets?.length) return 0
    return sets[sets.length - 1].restSec ?? 0
  }

  /**
   * Nota de descanso da última série (ex: "recuperação parcial").
   * null = sem nota → RestTimerComponent exibe apenas o tempo.
   */
  get lastSetRestNote(): string | null {
    const sets = this.exercise?.sets
    if (!sets?.length) return null
    return sets[sets.length - 1].restNote ?? null
  }
}
