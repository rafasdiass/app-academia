#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  generate-treino-feature.sh — FORCE OVERWRITE
#  Gera a feature treino/ COMPLETAMENTE IMPLEMENTADA — standalone.
#
#  Arquivos gerados:
#    features/treino/
#      treino-detail.page.ts          ← Page (injeta service)
#      treino-detail.page.html
#      treino-detail.page.scss
#      components/
#        treino-header/
#          treino-header.component.ts  ← Header do bloco
#          treino-header.component.html
#          treino-header.component.scss
#        treino-tab/
#          treino-tab.component.ts     ← Lista de exercícios + accordion
#          treino-tab.component.html
#          treino-tab.component.scss
#
#  REGRAS (CLEAN_ARCHITECTURE.md):
#    ✓ Page     → injeta WorkoutPlanService, ActivatedRoute
#    ✓ Page     → NÃO injeta rules diretamente
#    ✓ Filhos   → @Input/@Output, sem lógica de negócio, sem service
#    ✓ Standalone em tudo — zero NgModule
#    ✓ ChangeDetectionStrategy.OnPush em todos
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'
log_ok() { echo -e "${GREEN}  ✅ $1${NC}"; }
CREATED=0

write() {
  mkdir -p "$(dirname "$1")"
  cat > "$1"
  log_ok "Escrito: $1"
  CREATED=$((CREATED + 1))
}

mkdir -p \
  src/app/features/treino/components/treino-header \
  src/app/features/treino/components/treino-tab

# ══════════════════════════════════════════════════════════════════
#  1. TreinoDetailPage
# ══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}${CYAN}━━━ PAGE: TreinoDetailPage ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

write "src/app/features/treino/treino-detail.page.ts" << 'EOF'
// ─────────────────────────────────────────────────────────────────
// treino-detail.page.ts
// Responsabilidade única: orquestrar o estado da página de treino.
//
// O QUE FAZ:
//   - Carrega o WorkoutPlan via WorkoutPlanService (seed ou Firestore)
//   - Mantém activeType$ (BehaviorSubject<TreinoType>) para o segmento
//   - Deriva activeTreino$ via combineLatest + getTreinoBlock()
//   - Passa flags (BodyFlag[]) já computadas para TreinoHeaderComponent
//   - Passa activeTreino para TreinoTabComponent
//
// O QUE NÃO FAZ:
//   - Não importa Rules diretamente — delega para WorkoutPlanService
//   - Não tem lógica de exibição — apenas orquestra streams
//   - Não gerencia sessão — auth.service.ts
//
// FLUXO:
//   ngOnInit → service.getPlanFromSeed() → plan$
//   plan$ + activeType$ → combineLatest → activeTreino$
//   activeTreino$ → service.collectBodyFlags() → flags$
// ─────────────────────────────────────────────────────────────────
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core'
import { AsyncPipe, NgIf }     from '@angular/common'
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/angular/standalone'
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
} from 'rxjs'
import {
  map,
  switchMap,
  distinctUntilChanged,
  shareReplay,
  takeUntil,
} from 'rxjs/operators'

import { WorkoutPlanService }   from '@core/services/workout-plan.service'
import {
  WorkoutPlan,
  TreinoBlock,
  TreinoType,
  BodyFlag,
} from '@core/models'
import { TreinoHeaderComponent } from './components/treino-header/treino-header.component'
import { TreinoTabComponent }    from './components/treino-tab/treino-tab.component'

// ─────────────────────────────────────────────────────────────────

@Component({
  selector:        'app-treino-detail',
  templateUrl:     './treino-detail.page.html',
  styleUrls:       ['./treino-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports: [
    // Angular
    AsyncPipe, NgIf,
    // Ionic standalone
    IonContent, IonHeader, IonToolbar,
    IonButtons, IonBackButton,
    IonSegment, IonSegmentButton, IonLabel,
    // Feature components (filhos standalone)
    TreinoHeaderComponent,
    TreinoTabComponent,
  ],
})
export class TreinoDetailPage implements OnInit, OnDestroy {

  private readonly workoutPlanService = inject(WorkoutPlanService)
  private readonly destroy$           = new Subject<void>()

  // ── Tipos de treino disponíveis (para renderizar o segmento) ────
  readonly treinoTypes: TreinoType[] = ['A', 'B', 'C', 'D']

  // ── Estado reativo ───────────────────────────────────────────────

  /** Plano carregado uma vez; compartilhado entre subscribers */
  plan$!: Observable<WorkoutPlan>

  /** Tipo ativo selecionado pelo segmento — inicia no Treino A */
  readonly activeType$ = new BehaviorSubject<TreinoType>('A')

  /** Bloco do treino ativo derivado de plan$ + activeType$ */
  activeTreino$!: Observable<TreinoBlock | null>

  /** Flags corporais do bloco ativo — computadas pelo service */
  flags$!: Observable<BodyFlag[]>

  // ── Ciclo de vida ────────────────────────────────────────────────

  ngOnInit(): void {
    // Fase 1: carrega do seed local
    // Fase 2: substituir por service.getPlanById(planId) via ActivatedRoute
    this.plan$ = this.workoutPlanService.getPlanFromSeed().pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
    )

    // Deriva o bloco ativo combinando plan$ com activeType$
    // distinctUntilChanged evita re-renders quando o bloco não muda
    this.activeTreino$ = combineLatest([
      this.plan$,
      this.activeType$.pipe(distinctUntilChanged()),
    ]).pipe(
      map(([plan, type]) => this.workoutPlanService.getTreinoBlock(plan, type)),
      shareReplay({ bufferSize: 1, refCount: true }),
    )

    // Flags corporais do bloco ativo — computadas via service
    // null-safe: bloco pode ser null se o tipo não existir no plano
    this.flags$ = this.activeTreino$.pipe(
      map(block => block ? this.workoutPlanService.collectBodyFlags(block) : []),
      distinctUntilChanged(
        (a, b) => JSON.stringify(a) === JSON.stringify(b),
      ),
    )
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  // ── Handlers ────────────────────────────────────────────────────

  /**
   * Atualiza o tipo ativo ao mudar o segmento.
   * Ionic IonSegment emite ionChange com detail.value.
   */
  onSegmentChange(event: CustomEvent): void {
    const type = event.detail.value as TreinoType
    this.activeType$.next(type)
  }

  /**
   * Snapshot síncrono do tipo ativo.
   * Usado no [value] do IonSegment para binding inicial.
   */
  get activeType(): TreinoType {
    return this.activeType$.getValue()
  }
}
EOF

write "src/app/features/treino/treino-detail.page.html" << 'EOF'
<!-- TreinoDetailPage
     Estrutura: IonHeader (toolbar + segmento) → IonContent (header + tab)
     Toda lógica de estado fica no .ts — template apenas exibe e repassa.
-->
<ion-header class="treino-header-bar">
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/home" text=""></ion-back-button>
    </ion-buttons>
  </ion-toolbar>

  <!-- Segmento de seleção A / B / C / D -->
  <ion-toolbar class="segment-toolbar">
    <ion-segment
      [value]="activeType"
      (ionChange)="onSegmentChange($event)"
      class="treino-segment"
      scrollable
    >
      <ion-segment-button
        *ngFor="let type of treinoTypes"
        [value]="type"
        class="treino-segment-btn"
        [class]="'treino-segment-btn--' + type.toLowerCase()"
      >
        <ion-label>{{ type }}</ion-label>
      </ion-segment-button>
    </ion-segment>
  </ion-toolbar>
</ion-header>

<ion-content class="treino-content">

  <!-- Estado de carregamento -->
  <div class="treino-loading" *ngIf="!(activeTreino$ | async) && (plan$ | async) === null">
    <span>Carregando plano...</span>
  </div>

  <!-- Bloco ativo renderizado -->
  <ng-container *ngIf="activeTreino$ | async as block">

    <!-- Header do bloco: título, subtítulo, KPIs, flags -->
    <app-treino-header
      [block]="block"
      [flags]="(flags$ | async) ?? []"
    />

    <!-- Lista de exercícios com accordion -->
    <app-treino-tab [block]="block" />

  </ng-container>

</ion-content>
EOF

write "src/app/features/treino/treino-detail.page.scss" << 'EOF'
// TreinoDetailPage — layout geral da página de treino

// ── Header bar ────────────────────────────────────────────────────
.treino-header-bar {
  ion-toolbar {
    --background:       var(--bg2, #111114);
    --border-color:     var(--border, rgba(255,255,255,0.065));
    --color:            var(--text, #eae8e2);
    --padding-start:    4px;
    --padding-end:      4px;
  }
}

// ── Segmento ──────────────────────────────────────────────────────
.segment-toolbar {
  --background:    var(--bg2, #111114);
  --border-color:  transparent;
  --padding-start: 0;
  --padding-end:   0;
}

.treino-segment {
  --background: var(--bg2, #111114);
  padding: 0 4px 8px;
}

.treino-segment-btn {
  --color:            var(--text3, #44433f);
  --color-checked:    var(--text, #eae8e2);
  --indicator-color:  transparent;
  --background-checked: transparent;
  font-size:          11px;
  font-weight:        600;
  letter-spacing:     0.04em;
  min-width:          52px;
  position:           relative;

  // Linha colorida abaixo do botão ativo — cor por tipo
  &::after {
    content:       '';
    position:      absolute;
    bottom:        0;
    left:          50%;
    transform:     translateX(-50%);
    width:         0;
    height:        2px;
    border-radius: 1px;
    transition:    width 0.2s;
  }

  &.segment-button-checked::after {
    width: 60%;
  }

  // Cores por tipo de treino (fiel ao design system)
  &--a.segment-button-checked { --color-checked: #f43f5e; &::after { background: #f43f5e; } }
  &--b.segment-button-checked { --color-checked: #14b8a6; &::after { background: #14b8a6; } }
  &--c.segment-button-checked { --color-checked: #f97316; &::after { background: #f97316; } }
  &--d.segment-button-checked { --color-checked: #3b82f6; &::after { background: #3b82f6; } }
}

// ── Content ───────────────────────────────────────────────────────
.treino-content {
  --background:   var(--bg, #0a0a0c);
  --padding-top:  0;

  // Padding interno do scroll
  &::part(scroll) {
    padding: 0 16px 80px;
  }
}

// ── Loading state ─────────────────────────────────────────────────
.treino-loading {
  display:         flex;
  justify-content: center;
  align-items:     center;
  padding:         48px 16px;
  font-size:       12px;
  color:           var(--text3, #44433f);
}
EOF

# ══════════════════════════════════════════════════════════════════
#  2. TreinoHeaderComponent
# ══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}${CYAN}━━━ COMPONENT: TreinoHeaderComponent ━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

write "src/app/features/treino/components/treino-header/treino-header.component.ts" << 'EOF'
// ─────────────────────────────────────────────────────────────────
// treino-header.component.ts
// Responsabilidade única: exibir o cabeçalho visual de um TreinoBlock.
//
// RECEBE (via @Input):
//   block  — TreinoBlock com title, subtitle, color, type, exercises
//   flags  — BodyFlag[] já computadas pela Page via service
//
// EXIBE:
//   - Título e subtítulo do bloco
//   - KPIs: duração estimada, nº de exercícios, nº de séries
//   - Badges de flag corporal (JOELHO, LOMBAR, 90° MÁX)
//   - Faixa colorida lateral usando block.color
//
// NÃO FAZ:
//   - Não injeta service
//   - Não injeta rules
//   - Não calcula nada — recebe dados prontos da Page
// ─────────────────────────────────────────────────────────────────
import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core'
import { NgFor, NgIf }        from '@angular/common'
import { TreinoBlock, BodyFlag } from '@core/models'
import { ColorThemeRules }    from '@core/rules'
import { FlagColorPipe }      from '@shared/pipes'

@Component({
  selector:        'app-treino-header',
  templateUrl:     './treino-header.component.html',
  styleUrls:       ['./treino-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports:         [NgFor, NgIf, FlagColorPipe],
})
export class TreinoHeaderComponent {
  /** Bloco de treino ativo */
  @Input({ required: true }) block!: TreinoBlock

  /** Flags corporais já extraídas pela Page via WorkoutPlanService */
  @Input() flags: BodyFlag[] = []

  // ── Helpers de estilo — apenas resolvem tokens ────────────────

  /** HEX da cor primária do tema */
  get themeHex(): string {
    return ColorThemeRules.getHex(this.block.color)
  }

  /** Cor com 15% opacidade — fundo do badge tipo */
  get themeAlpha15(): string {
    return ColorThemeRules.getHexAlpha15(this.block.color)
  }

  /** Gradiente radial para o fundo do header */
  get themeGradient(): string {
    return ColorThemeRules.getGradient(this.block.color)
  }

  /** Tokens de badge de flag corporal */
  getFlagBadgeStyle(flag: BodyFlag): Record<string, string> {
    const theme  = ColorThemeRules.getThemeForBodyFlag(flag)
    const tokens = ColorThemeRules.getBadgeTokens(theme)
    return { background: tokens.background, borderColor: tokens.border, color: tokens.border }
  }
}
EOF

write "src/app/features/treino/components/treino-header/treino-header.component.html" << 'EOF'
<!-- TreinoHeaderComponent
     Cabeçalho visual do bloco de treino ativo.
     Cores injetadas via CSS custom properties.
-->
<div
  class="treino-hdr"
  [style.--hdr-color]="themeHex"
  [style.--hdr-alpha15]="themeAlpha15"
  [style.background-image]="themeGradient"
>

  <!-- Faixa lateral colorida -->
  <div class="treino-hdr__accent" [style.background]="themeHex"></div>

  <!-- Corpo do header -->
  <div class="treino-hdr__body">

    <!-- Eyebrow: tipo do treino (A / B / C / D) -->
    <div class="treino-hdr__eyebrow" [style.color]="themeHex">
      <span class="treino-hdr__eyebrow-line" [style.background]="themeHex"></span>
      Treino {{ block.type }}
    </div>

    <!-- Título e subtítulo -->
    <h1 class="treino-hdr__title">{{ block.title }}</h1>
    <p  class="treino-hdr__subtitle">{{ block.subtitle }}</p>

    <!-- Badges de flags corporais -->
    <div class="treino-hdr__flags" *ngIf="flags.length > 0">
      <span
        *ngFor="let flag of flags"
        class="treino-hdr__flag-badge"
        [ngStyle]="getFlagBadgeStyle(flag)"
        [attr.aria-label]="'Atenção: ' + flag"
      >
        {{ flag }}
      </span>
    </div>

    <!-- KPIs: exercícios · séries prescritas -->
    <div class="treino-hdr__kpis">
      <div class="treino-hdr__kpi">
        <strong>{{ block.exercises.length }}</strong>
        <span>exercícios</span>
      </div>
      <div class="treino-hdr__kpi-divider"></div>
      <div class="treino-hdr__kpi">
        <strong>{{ block.exercises | sumSets }}</strong>
        <span>séries</span>
      </div>
    </div>

  </div>
</div>
EOF

write "src/app/features/treino/components/treino-header/treino-header.component.scss" << 'EOF'
// TreinoHeaderComponent — fiel ao .sh + .sr do protótipo HTML
// Gradiente radial de fundo + faixa lateral colorida

.treino-hdr {
  position:      relative;
  display:       flex;
  gap:           0;
  padding:       20px 0 16px 16px;
  margin-bottom: 1rem;
  border-radius: 0 0 12px 12px;
  overflow:      hidden;
  background:    var(--bg2, #111114);
  border-bottom: 1px solid var(--border, rgba(255,255,255,0.065));

  // O gradiente radial é injetado via [style.background-image]
  &::before {
    content:        '';
    position:       absolute;
    inset:          0;
    pointer-events: none;
  }
}

// Faixa vertical colorida à esquerda
.treino-hdr__accent {
  width:         3px;
  border-radius: 0 2px 2px 0;
  flex-shrink:   0;
  margin-right:  14px;
  align-self:    stretch;
  min-height:    100%;
  position:      absolute;
  left:          0;
  top:           0;
  bottom:        0;
}

.treino-hdr__body {
  flex:       1;
  min-width:  0;
  padding-left: 14px;
}

// Eyebrow — "Treino A" com linha decorativa
.treino-hdr__eyebrow {
  display:        flex;
  align-items:    center;
  gap:            7px;
  font-family:    var(--head, 'Syne', sans-serif);
  font-size:      9px;
  font-weight:    700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom:  6px;
}

.treino-hdr__eyebrow-line {
  display:       inline-block;
  width:         18px;
  height:        2px;
  border-radius: 1px;
}

.treino-hdr__title {
  font-family:    var(--head, 'Syne', sans-serif);
  font-size:      20px;
  font-weight:    800;
  letter-spacing: -0.03em;
  line-height:    1.2;
  color:          var(--text, #eae8e2);
  margin:         0 0 4px;
}

.treino-hdr__subtitle {
  font-size:   11px;
  color:       var(--text2, #807e78);
  line-height: 1.6;
  margin:      0 0 10px;
}

// Badges de flags corporais
.treino-hdr__flags {
  display:     flex;
  flex-wrap:   wrap;
  gap:         5px;
  margin-bottom: 12px;
}

.treino-hdr__flag-badge {
  font-family:    var(--mono, monospace);
  font-size:      8px;
  font-weight:    700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  padding:        3px 8px;
  border-radius:  4px;
  border:         1px solid;
}

// KPIs inline
.treino-hdr__kpis {
  display:     flex;
  align-items: center;
  gap:         12px;
}

.treino-hdr__kpi {
  display:        flex;
  flex-direction: column;
  gap:            1px;

  strong {
    font-family: var(--head, 'Syne', sans-serif);
    font-size:   18px;
    font-weight: 800;
    color:       var(--text, #eae8e2);
    line-height: 1;
  }

  span {
    font-size:      8px;
    color:          var(--text3, #44433f);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
}

.treino-hdr__kpi-divider {
  width:         1px;
  height:        28px;
  background:    var(--border2, rgba(255,255,255,0.11));
  flex-shrink:   0;
}
EOF

# ══════════════════════════════════════════════════════════════════
#  3. TreinoTabComponent
# ══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}${CYAN}━━━ COMPONENT: TreinoTabComponent ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

write "src/app/features/treino/components/treino-tab/treino-tab.component.ts" << 'EOF'
// ─────────────────────────────────────────────────────────────────
// treino-tab.component.ts
// Responsabilidade única: renderizar a lista de exercícios do bloco.
//
// RECEBE:
//   block — TreinoBlock com exercises[] e warmup[]
//
// ESTADO INTERNO:
//   expandedIndex: number | null — qual card está expandido (accordion)
//   Lógica puramente de UI — não é regra de negócio.
//
// REPASSA para ExerciseCardComponent:
//   [exercise] [color] [index] [expanded] (expandedChange)
//
// NÃO FAZ:
//   - Não injeta service
//   - Não injeta rules
//   - Não conhece SetTemplate — só repassa o exercise completo
// ─────────────────────────────────────────────────────────────────
import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core'
import { NgFor, NgIf }   from '@angular/common'
import { TreinoBlock }   from '@core/models'
import { WarmupListComponent }  from '@shared/components/warmup-list/warmup-list.component'
import { ExerciseCardComponent } from '@shared/components/exercise-card/exercise-card.component'

@Component({
  selector:        'app-treino-tab',
  templateUrl:     './treino-tab.component.html',
  styleUrls:       ['./treino-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports: [
    NgFor, NgIf,
    WarmupListComponent,
    ExerciseCardComponent,
  ],
})
export class TreinoTabComponent {
  private readonly cdr = inject(ChangeDetectorRef)

  @Input({ required: true }) block!: TreinoBlock

  // ── Estado de UI: accordion ──────────────────────────────────────
  // null = todos fechados | number = índice do card aberto
  expandedIndex: number | null = null

  /**
   * Alterna o card expandido.
   * Se o mesmo índice for clicado, fecha. Se outro, abre o novo.
   * OnPush requer markForCheck() pois o estado é mutado internamente.
   */
  onCardExpanded(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index
    this.cdr.markForCheck()
  }

  trackByExerciseId(_: number, exercise: { id: string }): string {
    return exercise.id
  }
}
EOF

write "src/app/features/treino/components/treino-tab/treino-tab.component.html" << 'EOF'
<!-- TreinoTabComponent
     Lista de aquecimento + lista de exercícios em accordion.
     expandedIndex controla qual ExerciseCard está aberto.
-->
<div class="treino-tab">

  <!-- Aquecimento do bloco -->
  <app-warmup-list
    *ngIf="block.warmup?.length"
    [items]="block.warmup"
    [title]="'Aquecimento'"
  />

  <!-- Lista de exercícios -->
  <div
    class="treino-tab__exercises"
    role="list"
    aria-label="Exercícios do treino"
  >
    <app-exercise-card
      *ngFor="let exercise of block.exercises; index as i; trackBy: trackByExerciseId"
      [exercise]="exercise"
      [color]="block.color"
      [index]="i + 1"
      [expanded]="expandedIndex === i"
      (expandedChange)="onCardExpanded(i)"
    />
  </div>

  <!-- Estado vazio (bloco sem exercícios) -->
  <div
    class="treino-tab__empty"
    *ngIf="block.exercises.length === 0"
    role="status"
  >
    <span>Nenhum exercício neste bloco.</span>
  </div>

</div>
EOF

write "src/app/features/treino/components/treino-tab/treino-tab.component.scss" << 'EOF'
// TreinoTabComponent — container da lista de exercícios

.treino-tab {
  display:        flex;
  flex-direction: column;
  gap:            0;
  padding-top:    8px;
}

.treino-tab__exercises {
  display:        flex;
  flex-direction: column;
  gap:            0; // gap gerenciado pelo margin-bottom do ExerciseCard
}

.treino-tab__empty {
  display:         flex;
  justify-content: center;
  align-items:     center;
  padding:         48px 16px;
  font-size:       12px;
  color:           var(--text3, #44433f);
  border:          1px dashed var(--border, rgba(255,255,255,0.065));
  border-radius:   12px;
  margin-top:      8px;
}
EOF

# ══════════════════════════════════════════════════════════════════
#  4. PIPE AUXILIAR: SumSetsPipe
#     Usado no TreinoHeaderComponent para contar séries totais.
#     Evita lógica no template — delega para WorkoutPlanRules.
# ══════════════════════════════════════════════════════════════════
echo -e "\n${BOLD}${CYAN}━━━ PIPE AUXILIAR: SumSetsPipe ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

write "src/app/shared/pipes/sum-sets.pipe.ts" << 'EOF'
// ─────────────────────────────────────────────────────────────────
// sum-sets.pipe.ts
// Conta o total de séries prescritas de uma lista de ExerciseTemplate.
// Usado no TreinoHeaderComponent para o KPI de séries.
// Delega para WorkoutPlanRules.getTotalSetCount() via bloco virtual.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { ExerciseTemplate }    from '@core/models'

@Pipe({ name: 'sumSets', pure: true, standalone: true })
export class SumSetsPipe implements PipeTransform {
  /**
   * @param exercises  Array de ExerciseTemplate do bloco
   * @returns          Total de séries prescritas
   */
  transform(exercises: ExerciseTemplate[]): number {
    if (!exercises?.length) return 0
    return exercises.reduce((total, ex) => total + ex.sets.length, 0)
  }
}
EOF

# Adiciona ao barrel de pipes
PIPES_INDEX="src/app/shared/pipes/index.ts"
if ! grep -q "sum-sets" "$PIPES_INDEX" 2>/dev/null; then
  echo "export * from './sum-sets.pipe'" >> "$PIPES_INDEX"
  log_ok "Adicionado ao barrel: $PIPES_INDEX"
fi

# ── Atualiza o import no treino-header para incluir SumSetsPipe ───
# O componente usa {{ block.exercises | sumSets }} no template,
# portanto precisa importar o pipe no componente standalone.
HEADER_TS="src/app/features/treino/components/treino-header/treino-header.component.ts"
# Adiciona SumSetsPipe ao import do componente
sed -i "s/import { FlagColorPipe }      from '@shared\/pipes'/import { FlagColorPipe }      from '@shared\/pipes'\nimport { SumSetsPipe }        from '@shared\/pipes'/" "$HEADER_TS"
sed -i "s/imports:         \[NgFor, NgIf, FlagColorPipe\]/imports:         [NgFor, NgIf, FlagColorPipe, SumSetsPipe]/" "$HEADER_TS"
log_ok "SumSetsPipe adicionado ao TreinoHeaderComponent"

# ══════════════════════════════════════════════════════════════════
#  5. RELATÓRIO FINAL
# ══════════════════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ✅ Escritos (force overwrite) : ${GREEN}${BOLD}${CREATED}${NC} arquivos"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BOLD}  Estrutura gerada:${NC}"
echo "  features/treino/"
echo "  ├── treino-detail.page.ts         ← injeta WorkoutPlanService"
echo "  ├── treino-detail.page.html"
echo "  ├── treino-detail.page.scss"
echo "  └── components/"
echo "      ├── treino-header/            ← título, KPIs, flags"
echo "      └── treino-tab/               ← accordion de exercícios"
echo ""
echo -e "${BOLD}  Próximos passos:${NC}"
echo "  1. Adicione a rota no app.routes.ts:"
echo "     { path: 'treino/:id', loadComponent: () =>"
echo "       import('./features/treino/treino-detail.page')"
echo "         .then(m => m.TreinoDetailPage) }"
echo ""
echo "  2. Verifique tipos: npx tsc --noEmit"
echo ""
