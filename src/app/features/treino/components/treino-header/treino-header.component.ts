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
