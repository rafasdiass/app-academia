// ─────────────────────────────────────────────────────────────────
// treino-header.component.ts
// Responsabilidade única: cabeçalho visual do bloco de treino ativo.
//
// CORREÇÃO: @Input() durationMin adicionado (estava ausente no stub
// gerado pelo script, causando TS2322 no template pai).
// ─────────────────────────────────────────────────────────────────
import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { IonIcon }      from '@ionic/angular/standalone'
import { addIcons }     from 'ionicons'
import {
  timeOutline,
  barbellOutline,
  listOutline,
  warningOutline,
} from 'ionicons/icons'
import {
  TreinoBlock,
  BodyFlag,
  ExerciseTemplate,
} from '@core/models'
import { ColorThemeRules } from '@core/rules'

@Component({
  selector:        'app-treino-header',
  templateUrl:     './treino-header.component.html',
  styleUrls:       ['./treino-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports:         [CommonModule, IonIcon],
})
export class TreinoHeaderComponent {

  constructor() {
    addIcons({ timeOutline, barbellOutline, listOutline, warningOutline })
  }

  /** Bloco de treino ativo — obrigatório */
  @Input({ required: true }) block!: TreinoBlock

  /** Flags corporais já extraídas pela Page via WorkoutPlanService */
  @Input() flags: BodyFlag[] = []

  /**
   * Duração estimada em minutos — calculada pela Page via WorkoutPlanService.
   * ⚠️ Obrigatório declarar aqui para o template pai não gerar TS2322.
   */
  @Input() durationMin = 0

  // ── Helpers de cor ────────────────────────────────────────────────

  get themeHex(): string {
    return ColorThemeRules.getHex(this.block.color)
  }

  get themeAlpha15(): string {
    return ColorThemeRules.getHexAlpha15(this.block.color)
  }

  get themeGradient(): string {
    return ColorThemeRules.getGradient(this.block.color)
  }

  get totalSets(): number {
    if (!this.block?.exercises?.length) return 0
    return this.block.exercises.reduce(
      (acc: number, ex: ExerciseTemplate) => acc + ex.sets.length,
      0,
    )
  }

  getFlagBadgeStyle(flag: BodyFlag): { background: string; borderColor: string; color: string } {
    const theme  = ColorThemeRules.getThemeForBodyFlag(flag)
    const tokens = ColorThemeRules.getBadgeTokens(theme)
    return {
      background:  tokens.background,
      borderColor: tokens.border,
      color:       tokens.border,
    }
  }

  trackByFlag(_: number, flag: BodyFlag): BodyFlag {
    return flag
  }
}
