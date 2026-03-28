// ─────────────────────────────────────────────────────────────────
// protocol-badge.component.ts
// ─────────────────────────────────────────────────────────────────
import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core'
import { CommonModule }                   from '@angular/common'
import { Protocol, BodyFlag, ColorTheme } from '@core/models'
import { ColorThemeRules }                from '@core/rules'
import { ProtocolColorPipe }              from '@shared/pipes'

// Interface concreta em vez de Record<string,string> — evita TS4111
interface BadgeStyle {
  background:  string
  borderColor: string
  color:       string
}

@Component({
  selector:        'app-protocol-badge',
  templateUrl:     './protocol-badge.component.html',
  styleUrls:       ['./protocol-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports:         [CommonModule, ProtocolColorPipe],
})
export class ProtocolBadgeComponent {

  /** Protocolo do exercício (ex: 'RPT', 'MYO', 'PAUSE') */
  @Input({ required: true }) protocol!: Protocol

  /** Flag corporal opcional (ex: 'JOELHO', 'LOMBAR') */
  @Input() flag: BodyFlag | null = null

  /**
   * Resolve estilo inline do badge a partir de um ColorTheme.
   * Retorna BadgeStyle (interface concreta) — sem index signature.
   */
  getBadgeStyle(theme: ColorTheme): BadgeStyle {
    const t = ColorThemeRules.getBadgeTokens(theme)
    return {
      background:  t.background,
      borderColor: t.border,
      color:       t.border,
    }
  }

  /**
   * Resolve o ColorTheme da flag com fallback seguro.
   * Evita chamar o pipe com null no template.
   */
  getFlagTheme(): ColorTheme {
    if (this.flag === null) return 'rose'
    return ColorThemeRules.getThemeForBodyFlag(this.flag)
  }
}
