// ═══════════════════════════════════════════════════════════════════
//  FitTracker — Gerador de Componentes Compartilhados
//  Execute: node generate-components.mjs
//  Cria todos os arquivos em src/app/shared/components/
//
//  Componentes gerados (6):
//    loading-spinner   — spinner global de carregamento
//    protocol-badge    — badge de protocolo e flag corporal
//    warmup-list       — lista de instruções de aquecimento
//    set-row           — linha de série (template ou log)
//    exercise-card     — card expansível de exercício
//    rest-timer        — display do timer de descanso
//
//  Cada componente gera: .ts + .html + .scss
//  Todos standalone, Ionic + Angular, ion-icons.
//  Zero lógica nos componentes — pipes + @Input/@Output.
// ═══════════════════════════════════════════════════════════════════

import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const BASE_PATH = join('src', 'app', 'shared', 'components')

// ── Garante que a pasta raiz existe ────────────────────────────────
if (!existsSync(BASE_PATH)) {
  mkdirSync(BASE_PATH, { recursive: true })
  console.log(`📁 Pasta criada: ${BASE_PATH}`)
} else {
  console.log(`📁 Pasta já existe: ${BASE_PATH}`)
}

// ─────────────────────────────────────────────────────────────────
// Estrutura: { 'nome-pasta': { 'arquivo': 'conteudo' } }
// ─────────────────────────────────────────────────────────────────
const components = {

  // ════════════════════════════════════════════════════════════════
  // 1. LOADING-SPINNER
  //    Exibe um ion-spinner centralizado enquanto dados carregam.
  //    Controlado externamente via *ngIf no template pai.
  //    Sem @Input — sempre visível quando presente no DOM.
  // ════════════════════════════════════════════════════════════════
  'loading-spinner': {

    'loading-spinner.component.ts': `// ─────────────────────────────────────────────────────────────────
// loading-spinner.component.ts
// Spinner global de carregamento.
// Controlado via *ngIf no componente pai — sem lógica interna.
// ─────────────────────────────────────────────────────────────────
import { Component, Input } from '@angular/core'
import { IonSpinner }       from '@ionic/angular/standalone'

@Component({
  selector:    'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls:   ['./loading-spinner.component.scss'],
  standalone:  true,
  imports:     [IonSpinner],
})
export class LoadingSpinnerComponent {

  /**
   * Nome do spinner Ionic.
   * Padrão: 'crescent' — linha fina, moderno.
   * Opções: 'bubbles' | 'circles' | 'circular' | 'crescent' | 'dots' | 'lines'
   */
  @Input() name: 'bubbles' | 'circles' | 'circular' | 'crescent' | 'dots' | 'lines' = 'crescent'

  /**
   * Mensagem opcional exibida abaixo do spinner.
   */
  @Input() message: string | null = null
}
`,

    'loading-spinner.component.html': `<!-- loading-spinner.component.html -->
<div class="spinner-wrapper">
  <ion-spinner [name]="name" class="spinner" />

  @if (message) {
    <p class="spinner-message">{{ message }}</p>
  }
</div>
`,

    'loading-spinner.component.scss': `// ─────────────────────────────────────────────────────────────────
// loading-spinner.component.scss
// ─────────────────────────────────────────────────────────────────

.spinner-wrapper {
  display:         flex;
  flex-direction:  column;
  align-items:     center;
  justify-content: center;
  gap:             12px;
  padding:         32px;
  width:           100%;
}

.spinner {
  --color: var(--ion-color-primary);
  width:   40px;
  height:  40px;
}

.spinner-message {
  margin:      0;
  font-size:   0.85rem;
  color:       var(--ion-color-medium);
  text-align:  center;
  letter-spacing: 0.02em;
}
`,
  },

  // ════════════════════════════════════════════════════════════════
  // 2. PROTOCOL-BADGE
  //    Badge duplo: protocolo do exercício + flag de restrição.
  //    Cores resolvidas via pipes (protocolColor, flagColor, colorTokens).
  //    Zero if/switch no template.
  // ════════════════════════════════════════════════════════════════
  'protocol-badge': {

    'protocol-badge.component.ts': `// ─────────────────────────────────────────────────────────────────
// protocol-badge.component.ts
// Badge de protocolo de execução e flag de restrição corporal.
// Cores derivadas via pipes — zero lógica no componente.
// ─────────────────────────────────────────────────────────────────
import { Component, Input }  from '@angular/core'
import { NgStyle }           from '@angular/common'
import { IonIcon }           from '@ionic/angular/standalone'
import { addIcons }          from 'ionicons'
import { warningOutline }    from 'ionicons/icons'
import { Protocol, BodyFlag } from '@core/models'
import {
  ProtocolColorPipe,
  FlagColorPipe,
  ColorTokensPipe,
} from '@shared/pipes'

@Component({
  selector:    'app-protocol-badge',
  templateUrl: './protocol-badge.component.html',
  styleUrls:   ['./protocol-badge.component.scss'],
  standalone:  true,
  imports:     [NgStyle, IonIcon, ProtocolColorPipe, FlagColorPipe, ColorTokensPipe],
})
export class ProtocolBadgeComponent {

  /** Protocolo de execução do exercício */
  @Input({ required: true }) protocol!: Protocol

  /** Flag de restrição corporal — null se não houver */
  @Input() flag: BodyFlag | null = null

  constructor() {
    addIcons({ warningOutline })
  }
}
`,

    'protocol-badge.component.html': `<!-- protocol-badge.component.html -->
<div class="badges">

  <!-- Badge de protocolo -->
  <span
    class="badge badge--protocol"
    [ngStyle]="{
      'background': (protocol | protocolColor | colorTokens).hexAlpha15,
      'border-color': (protocol | protocolColor | colorTokens).hex,
      'color': (protocol | protocolColor | colorTokens).hex
    }"
  >
    {{ protocol }}
  </span>

  <!-- Badge de flag corporal — exibido apenas quando flag presente -->
  @if (flag) {
    <span
      class="badge badge--flag"
      [ngStyle]="{
        'background': (flag | flagColor | colorTokens).hexAlpha15,
        'border-color': (flag | flagColor | colorTokens).hex,
        'color': (flag | flagColor | colorTokens).hex
      }"
    >
      <ion-icon name="warning-outline" class="badge__icon" />
      {{ flag }}
    </span>
  }

</div>
`,

    'protocol-badge.component.scss': `// ─────────────────────────────────────────────────────────────────
// protocol-badge.component.scss
// ─────────────────────────────────────────────────────────────────

.badges {
  display:   flex;
  flex-wrap: wrap;
  gap:       6px;
}

.badge {
  display:       inline-flex;
  align-items:   center;
  gap:           4px;
  padding:       3px 8px;
  border-radius: 6px;
  border:        1.5px solid transparent;
  font-size:     0.7rem;
  font-weight:   700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space:   nowrap;
  line-height:   1;
}

.badge__icon {
  font-size: 0.75rem;
}
`,
  },

  // ════════════════════════════════════════════════════════════════
  // 3. WARMUP-LIST
  //    Lista de instruções de aquecimento do bloco de treino.
  //    Cada item é uma string descritiva do TreinoBlock.warmup[].
  // ════════════════════════════════════════════════════════════════
  'warmup-list': {

    'warmup-list.component.ts': `// ─────────────────────────────────────────────────────────────────
// warmup-list.component.ts
// Lista de instruções de aquecimento de um TreinoBlock.
// Recebe string[] e exibe cada item com ícone de check.
// ─────────────────────────────────────────────────────────────────
import { Component, Input } from '@angular/core'
import { NgFor }            from '@angular/common'
import { IonIcon }          from '@ionic/angular/standalone'
import { addIcons }         from 'ionicons'
import { flameOutline, checkmarkCircleOutline } from 'ionicons/icons'

@Component({
  selector:    'app-warmup-list',
  templateUrl: './warmup-list.component.html',
  styleUrls:   ['./warmup-list.component.scss'],
  standalone:  true,
  imports:     [NgFor, IonIcon],
})
export class WarmupListComponent {

  /** Lista de instruções de aquecimento vindas de TreinoBlock.warmup */
  @Input({ required: true }) items!: string[]

  constructor() {
    addIcons({ flameOutline, checkmarkCircleOutline })
  }
}
`,

    'warmup-list.component.html': `<!-- warmup-list.component.html -->
<div class="warmup">

  <header class="warmup__header">
    <ion-icon name="flame-outline" class="warmup__icon" />
    <span class="warmup__title">Aquecimento</span>
  </header>

  <ul class="warmup__list">
    @for (item of items; track item) {
      <li class="warmup__item">
        <ion-icon name="checkmark-circle-outline" class="warmup__check" />
        <span class="warmup__text">{{ item }}</span>
      </li>
    }
  </ul>

</div>
`,

    'warmup-list.component.scss': `// ─────────────────────────────────────────────────────────────────
// warmup-list.component.scss
// ─────────────────────────────────────────────────────────────────

.warmup {
  padding:       16px;
  border-radius: 12px;
  background:    rgba(var(--ion-color-warning-rgb), 0.06);
  border:        1px solid rgba(var(--ion-color-warning-rgb), 0.18);
}

.warmup__header {
  display:     flex;
  align-items: center;
  gap:         6px;
  margin-bottom: 12px;
}

.warmup__icon {
  color:     var(--ion-color-warning);
  font-size: 1.1rem;
}

.warmup__title {
  font-size:   0.78rem;
  font-weight: 700;
  color:       var(--ion-color-warning);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.warmup__list {
  list-style: none;
  margin:     0;
  padding:    0;
  display:    flex;
  flex-direction: column;
  gap:        10px;
}

.warmup__item {
  display:     flex;
  align-items: flex-start;
  gap:         8px;
}

.warmup__check {
  color:      var(--ion-color-warning);
  font-size:  1rem;
  flex-shrink: 0;
  margin-top:  1px;
}

.warmup__text {
  font-size:   0.875rem;
  color:       var(--ion-color-medium);
  line-height: 1.45;
}
`,
  },

  // ════════════════════════════════════════════════════════════════
  // 4. SET-ROW
  //    Linha de uma série prescrita (SetTemplate).
  //    Estilo visual via setVisualStyle pipe → [ngClass].
  //    Descanso via restLabel pipe. Timer via shouldShowTimer pipe.
  //    CSS custom property --set-color recebe cor do treino.
  // ════════════════════════════════════════════════════════════════
  'set-row': {

    'set-row.component.ts': `// ─────────────────────────────────────────────────────────────────
// set-row.component.ts
// Linha de série prescrita — exibe label, reps, carga e descanso.
// Estilo visual derivado via SetVisualStylePipe → [ngClass].
// CSS custom property --set-color recebe a cor do treino.
// ─────────────────────────────────────────────────────────────────
import { Component, Input } from '@angular/core'
import { NgClass, NgStyle } from '@angular/common'
import { IonIcon }          from '@ionic/angular/standalone'
import { addIcons }         from 'ionicons'
import { timerOutline, barbellOutline } from 'ionicons/icons'
import { SetTemplate, ColorTheme }      from '@core/models'
import {
  SetVisualStylePipe,
  RestLabelPipe,
  ShouldShowTimerPipe,
  ColorTokensPipe,
} from '@shared/pipes'

@Component({
  selector:    'app-set-row',
  templateUrl: './set-row.component.html',
  styleUrls:   ['./set-row.component.scss'],
  standalone:  true,
  imports:     [
    NgClass,
    NgStyle,
    IonIcon,
    SetVisualStylePipe,
    RestLabelPipe,
    ShouldShowTimerPipe,
    ColorTokensPipe,
  ],
})
export class SetRowComponent {

  /** Série prescrita no plano */
  @Input({ required: true }) set!: SetTemplate

  /** Cor do treino para customização visual via CSS custom property */
  @Input({ required: true }) color!: ColorTheme

  constructor() {
    addIcons({ timerOutline, barbellOutline })
  }
}
`,

    'set-row.component.html': `<!-- set-row.component.html -->
<div
  class="set-row"
  [ngClass]="set.label | setVisualStyle"
  [ngStyle]="{ '--set-color': (color | colorTokens).hex }"
>

  <!-- Label da série -->
  <span class="set-row__label">{{ set.label }}</span>

  <!-- Carga de referência -->
  <span class="set-row__load">
    @if (set.loadPct) {
      <ion-icon name="barbell-outline" class="set-row__icon" />
      {{ set.loadPct }}
    } @else {
      <span class="set-row__load--empty">—</span>
    }
  </span>

  <!-- Faixa de repetições -->
  <span class="set-row__reps">{{ set.reps }}</span>

  <!-- Timer de descanso — oculto em aquecimentos -->
  @if (set.label | shouldShowTimer) {
    <span class="set-row__rest">
      <ion-icon name="timer-outline" class="set-row__icon" />
      {{ set.restSec | restLabel: set.restNote }}
    </span>
  }

  <!-- Nota isométrica — apenas protocolo PAUSE -->
  @if (set.isoNote) {
    <span class="set-row__iso">{{ set.isoNote }}</span>
  }

</div>
`,

    'set-row.component.scss': `// ─────────────────────────────────────────────────────────────────
// set-row.component.scss
// --set-color é injetado via [ngStyle] pelo componente pai.
// ─────────────────────────────────────────────────────────────────

:host {
  --set-color: var(--ion-color-primary);
  display: block;
}

.set-row {
  display:       grid;
  grid-template-columns: 7rem 5rem 1fr auto;
  align-items:   center;
  gap:           8px;
  padding:       10px 12px;
  border-radius: 8px;
  border-left:   3px solid transparent;
  transition:    background 0.15s ease;
  background:    transparent;
}

// ── Variantes de estilo visual ────────────────────────────────────

.set-row.top-set {
  border-left-color: var(--set-color);
  background:        rgba(var(--set-color-rgb, 59, 130, 246), 0.06);
}

.set-row.activation {
  border-left-color: var(--ion-color-tertiary);
  background:        rgba(var(--ion-color-tertiary-rgb), 0.06);
}

.set-row.mini {
  margin-left:       20px;
  background:        rgba(var(--ion-color-light-rgb), 0.04);
  border-left-color: transparent;
}

.set-row.warmup {
  opacity: 0.55;
}

.set-row.default {
  border-left-color: rgba(var(--ion-color-medium-rgb), 0.3);
}

// ── Células ───────────────────────────────────────────────────────

.set-row__label {
  font-size:   0.72rem;
  font-weight: 700;
  color:       var(--set-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space:   nowrap;
}

.set-row__load {
  display:     flex;
  align-items: center;
  gap:         4px;
  font-size:   0.8rem;
  color:       var(--ion-color-medium);
  white-space: nowrap;
}

.set-row__load--empty {
  color: var(--ion-color-medium-shade);
}

.set-row__reps {
  font-size:   0.9rem;
  font-weight: 600;
  color:       var(--ion-color-light);
}

.set-row__rest {
  display:     flex;
  align-items: center;
  gap:         3px;
  font-size:   0.78rem;
  color:       var(--ion-color-medium);
  white-space: nowrap;
}

.set-row__iso {
  grid-column:   1 / -1;
  font-size:     0.75rem;
  font-style:    italic;
  color:         var(--ion-color-medium);
  padding-left:  4px;
  margin-top:    -4px;
}

.set-row__icon {
  font-size:  0.85rem;
  flex-shrink: 0;
}
`,
  },

  // ════════════════════════════════════════════════════════════════
  // 5. EXERCISE-CARD
  //    Card expansível de exercício com header sempre visível
  //    e body colapsável (SetRow list + science note).
  //    @Output expandedChange emitido ao tocar no header.
  //    Contém ProtocolBadgeComponent e SetRowComponent.
  // ════════════════════════════════════════════════════════════════
  'exercise-card': {

    'exercise-card.component.ts': `// ─────────────────────────────────────────────────────────────────
// exercise-card.component.ts
// Card expansível de exercício prescrito no plano.
// Header sempre visível — body expandido via @Input expanded.
// Emite expandedChange ao tocar: controle de accordion no pai.
// ─────────────────────────────────────────────────────────────────
import { Component, Input, Output, EventEmitter } from '@angular/core'
import { NgClass, NgStyle }                        from '@angular/common'
import { IonIcon, IonRippleEffect }                from '@ionic/angular/standalone'
import { addIcons }                                from 'ionicons'
import {
  chevronDownOutline,
  chevronUpOutline,
  informationCircleOutline,
  bodyOutline,
} from 'ionicons/icons'
import { ExerciseTemplate, ColorTheme }   from '@core/models'
import { ColorTokensPipe }                from '@shared/pipes'
import { ProtocolBadgeComponent }         from '../protocol-badge/protocol-badge.component'
import { SetRowComponent }                from '../set-row/set-row.component'

@Component({
  selector:    'app-exercise-card',
  templateUrl: './exercise-card.component.html',
  styleUrls:   ['./exercise-card.component.scss'],
  standalone:  true,
  imports:     [
    NgClass,
    NgStyle,
    IonIcon,
    IonRippleEffect,
    ColorTokensPipe,
    ProtocolBadgeComponent,
    SetRowComponent,
  ],
})
export class ExerciseCardComponent {

  /** Exercício prescrito no plano */
  @Input({ required: true }) exercise!: ExerciseTemplate

  /** Cor do bloco de treino para CSS custom properties */
  @Input({ required: true }) color!: ColorTheme

  /** Índice 0-based do card na lista — exibido como número ordinal */
  @Input({ required: true }) index!: number

  /** Controla se o body está visível — gerenciado pelo pai (TreinoTabComponent) */
  @Input() expanded = false

  /** Emitido ao tocar no header — pai alterna expanded */
  @Output() expandedChange = new EventEmitter<void>()

  constructor() {
    addIcons({ chevronDownOutline, chevronUpOutline, informationCircleOutline, bodyOutline })
  }

  onHeaderTap(): void {
    this.expandedChange.emit()
  }
}
`,

    'exercise-card.component.html': `<!-- exercise-card.component.html -->
<div
  class="exercise-card"
  [class.exercise-card--expanded]="expanded"
  [ngStyle]="{
    '--card-color':    (color | colorTokens).hex,
    '--card-gradient': (color | colorTokens).gradient
  }"
>

  <!-- ── Header — sempre visível ──────────────────────────────── -->
  <div class="exercise-card__header ion-activatable" (click)="onHeaderTap()">
    <ion-ripple-effect />

    <!-- Número ordinal -->
    <span class="exercise-card__index">{{ index + 1 }}</span>

    <!-- Nome e músculo -->
    <div class="exercise-card__info">
      <span class="exercise-card__name">{{ exercise.name }}</span>
      <span class="exercise-card__muscle">
        <ion-icon name="body-outline" class="exercise-card__muscle-icon" />
        {{ exercise.muscle }}
      </span>
    </div>

    <!-- Badge de protocolo + flag -->
    <app-protocol-badge
      [protocol]="exercise.protocol"
      [flag]="exercise.flag"
      class="exercise-card__badge"
    />

    <!-- Chevron de expansão -->
    <ion-icon
      [name]="expanded ? 'chevron-up-outline' : 'chevron-down-outline'"
      class="exercise-card__chevron"
    />
  </div>

  <!-- ── Body — expansível ────────────────────────────────────── -->
  @if (expanded) {
    <div class="exercise-card__body">

      <!-- Lista de séries -->
      <div class="exercise-card__sets">
        @for (set of exercise.sets; track set.index) {
          <app-set-row [set]="set" [color]="color" />
        }
      </div>

      <!-- Nota científica — exibida apenas quando presente -->
      @if (exercise.scienceNote) {
        <div class="exercise-card__science">
          <ion-icon name="information-circle-outline" class="exercise-card__science-icon" />
          <p class="exercise-card__science-text">{{ exercise.scienceNote }}</p>
        </div>
      }

    </div>
  }

</div>
`,

    'exercise-card.component.scss': `// ─────────────────────────────────────────────────────────────────
// exercise-card.component.scss
// --card-color e --card-gradient são injetados via [ngStyle].
// ─────────────────────────────────────────────────────────────────

:host {
  --card-color:    var(--ion-color-primary);
  --card-gradient: none;
  display: block;
}

.exercise-card {
  border-radius: 14px;
  border:        1px solid rgba(var(--ion-color-medium-rgb), 0.12);
  background:    var(--ion-color-step-50, #1a1a2e);
  overflow:      hidden;
  transition:    border-color 0.2s ease;
}

.exercise-card--expanded {
  border-color: rgba(var(--card-color), 0.35);
}

// ── Header ────────────────────────────────────────────────────────

.exercise-card__header {
  position:    relative;
  display:     grid;
  grid-template-columns: 2.2rem 1fr auto auto;
  align-items: center;
  gap:         10px;
  padding:     14px 14px 14px 12px;
  cursor:      pointer;
  background:  var(--card-gradient);
  user-select: none;
}

.exercise-card__index {
  display:         flex;
  align-items:     center;
  justify-content: center;
  width:           2rem;
  height:          2rem;
  border-radius:   50%;
  background:      rgba(var(--card-color), 0.15);
  color:           var(--card-color);
  font-size:       0.8rem;
  font-weight:     700;
  flex-shrink:     0;
}

.exercise-card__info {
  display:        flex;
  flex-direction: column;
  gap:            3px;
  min-width:      0;
}

.exercise-card__name {
  font-size:     0.95rem;
  font-weight:   600;
  color:         var(--ion-color-light);
  white-space:   nowrap;
  overflow:      hidden;
  text-overflow: ellipsis;
}

.exercise-card__muscle {
  display:     flex;
  align-items: center;
  gap:         3px;
  font-size:   0.75rem;
  color:       var(--ion-color-medium);
}

.exercise-card__muscle-icon {
  font-size: 0.75rem;
}

.exercise-card__badge {
  flex-shrink: 0;
}

.exercise-card__chevron {
  color:      var(--ion-color-medium);
  font-size:  1.1rem;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.exercise-card--expanded .exercise-card__chevron {
  color: var(--card-color);
}

// ── Body ──────────────────────────────────────────────────────────

.exercise-card__body {
  border-top: 1px solid rgba(var(--ion-color-medium-rgb), 0.1);
  padding:    8px 0 12px;
}

.exercise-card__sets {
  display:        flex;
  flex-direction: column;
  gap:            2px;
  padding:        0 8px;
}

.exercise-card__science {
  display:     flex;
  align-items: flex-start;
  gap:         8px;
  margin:      12px 14px 0;
  padding:     10px 12px;
  border-radius: 8px;
  background:  rgba(var(--ion-color-medium-rgb), 0.06);
  border:      1px solid rgba(var(--ion-color-medium-rgb), 0.1);
}

.exercise-card__science-icon {
  color:      var(--ion-color-medium);
  font-size:  1rem;
  flex-shrink: 0;
  margin-top:  1px;
}

.exercise-card__science-text {
  margin:      0;
  font-size:   0.8rem;
  font-style:  italic;
  color:       var(--ion-color-medium);
  line-height: 1.5;
}
`,
  },

  // ════════════════════════════════════════════════════════════════
  // 6. REST-TIMER
  //    Display do timer de descanso prescrito (Fase 1 — estático).
  //    Exibe tempo formatado + label via pipes.
  //    Ocultado automaticamente para séries de aquecimento.
  //    Fase 2: receberá @Input active e @Output finished para
  //    integração com SoundService e countdown reativo.
  // ════════════════════════════════════════════════════════════════
  'rest-timer': {

    'rest-timer.component.ts': `// ─────────────────────────────────────────────────────────────────
// rest-timer.component.ts
// Display do timer de descanso prescrito.
//
// Fase 1: exibe o tempo formatado de forma estática.
// Fase 2: receberá @Input active: boolean para ativar o countdown
//         e @Output finished para notificar o pai ao concluir.
//         Integração com SoundService será adicionada na Fase 2.
// ─────────────────────────────────────────────────────────────────
import { Component, Input }  from '@angular/core'
import { NgStyle }           from '@angular/common'
import { IonIcon }           from '@ionic/angular/standalone'
import { addIcons }          from 'ionicons'
import { timerOutline, moonOutline } from 'ionicons/icons'
import { SetTemplate, ColorTheme }   from '@core/models'
import {
  SecondsToMmssPipe,
  RestLabelPipe,
  ShouldShowTimerPipe,
  ColorTokensPipe,
} from '@shared/pipes'

@Component({
  selector:    'app-rest-timer',
  templateUrl: './rest-timer.component.html',
  styleUrls:   ['./rest-timer.component.scss'],
  standalone:  true,
  imports:     [
    NgStyle,
    IonIcon,
    SecondsToMmssPipe,
    RestLabelPipe,
    ShouldShowTimerPipe,
    ColorTokensPipe,
  ],
})
export class RestTimerComponent {

  /** Tempo de descanso em segundos (SetTemplate.restSec) */
  @Input({ required: true }) restSec!: number

  /** Nota descritiva do descanso (SetTemplate.restNote) — pode ser null */
  @Input() restNote: string | null = null

  /** Cor do bloco para customização do anel e ícone */
  @Input() color: ColorTheme = 'blue'

  /**
   * SetLabelType da série — usado pelo shouldShowTimer pipe
   * para ocultar o timer em séries de aquecimento.
   */
  @Input({ required: true }) label!: SetTemplate['label']

  // ── Fase 2 ────────────────────────────────────────────────────────
  // @Input()  active   = false           ← ativa countdown reativo
  // @Output() finished = new EventEmitter<void>()  ← emite ao zerar

  constructor() {
    addIcons({ timerOutline, moonOutline })
  }
}
`,

    'rest-timer.component.html': `<!-- rest-timer.component.html -->

<!-- Oculta completamente em séries de aquecimento -->
@if (label | shouldShowTimer) {

  <div
    class="rest-timer"
    [ngStyle]="{ '--timer-color': (color | colorTokens).hex }"
  >

    <!-- Ícone -->
    <ion-icon name="timer-outline" class="rest-timer__icon" />

    <!-- Tempo formatado M:SS -->
    <span class="rest-timer__time">{{ restSec | secondsToMmss }}</span>

    <!-- Label descritivo: restNote ou formato compacto -->
    <span class="rest-timer__label">
      {{ restSec | restLabel: restNote }}
    </span>

    <!-- Indicador visual de descanso passivo (restNote presente) -->
    @if (restNote) {
      <ion-icon name="moon-outline" class="rest-timer__passive-icon" />
    }

  </div>

}
`,

    'rest-timer.component.scss': `// ─────────────────────────────────────────────────────────────────
// rest-timer.component.scss
// --timer-color injetado via [ngStyle].
// ─────────────────────────────────────────────────────────────────

:host {
  --timer-color: var(--ion-color-primary);
  display: block;
}

.rest-timer {
  display:       inline-flex;
  align-items:   center;
  gap:           6px;
  padding:       5px 10px;
  border-radius: 20px;
  background:    rgba(var(--timer-color), 0.08);
  border:        1px solid rgba(var(--timer-color), 0.2);
}

.rest-timer__icon {
  color:     var(--timer-color);
  font-size: 0.9rem;
  flex-shrink: 0;
}

.rest-timer__time {
  font-size:   0.85rem;
  font-weight: 700;
  color:       var(--timer-color);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.rest-timer__label {
  font-size: 0.78rem;
  color:     var(--ion-color-medium);
}

.rest-timer__passive-icon {
  color:     var(--ion-color-medium);
  font-size: 0.8rem;
}
`,
  },
}

// ── Escreve os arquivos ─────────────────────────────────────────────
let created = 0
let skipped = 0

for (const [componentName, fileMap] of Object.entries(components)) {
  const componentPath = join(BASE_PATH, componentName)

  // Garante subpasta do componente
  if (!existsSync(componentPath)) {
    mkdirSync(componentPath, { recursive: true })
    console.log(`  📁 Subpasta criada: ${componentPath}`)
  }

  for (const [filename, content] of Object.entries(fileMap)) {
    const filePath = join(componentPath, filename)

    if (existsSync(filePath)) {
      console.log(`  ⚠️  Já existe (pulado): ${filePath}`)
      skipped++
      continue
    }

    writeFileSync(filePath, content, 'utf8')
    console.log(`  ✅ Criado: ${filePath}`)
    created++
  }
}

// ── Resumo ──────────────────────────────────────────────────────────
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Criados : ${created}
  ⚠️  Pulados : ${skipped}
  📁 Local   : ${BASE_PATH}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Estrutura gerada:
  shared/components/
  ├── loading-spinner/
  │   ├── loading-spinner.component.ts
  │   ├── loading-spinner.component.html
  │   └── loading-spinner.component.scss
  ├── protocol-badge/
  │   ├── protocol-badge.component.ts
  │   ├── protocol-badge.component.html
  │   └── protocol-badge.component.scss
  ├── warmup-list/
  │   ├── warmup-list.component.ts
  │   ├── warmup-list.component.html
  │   └── warmup-list.component.scss
  ├── set-row/
  │   ├── set-row.component.ts
  │   ├── set-row.component.html
  │   └── set-row.component.scss
  ├── exercise-card/
  │   ├── exercise-card.component.ts
  │   ├── exercise-card.component.html
  │   └── exercise-card.component.scss
  └── rest-timer/
      ├── rest-timer.component.ts
      ├── rest-timer.component.html
      └── rest-timer.component.scss

Próximos passos:
  1. Adicionar path alias no tsconfig.json:
     "@shared/components": ["src/app/shared/components/index.ts"]

  2. Criar o barrel src/app/shared/components/index.ts:
     export * from './loading-spinner/loading-spinner.component'
     export * from './protocol-badge/protocol-badge.component'
     export * from './warmup-list/warmup-list.component'
     export * from './set-row/set-row.component'
     export * from './exercise-card/exercise-card.component'
     export * from './rest-timer/rest-timer.component'

  3. Rodar: npx tsc --noEmit
     (verifica tipos sem gerar build)

  4. Próxima camada: features/treino/ (pages + tabs)
`)
