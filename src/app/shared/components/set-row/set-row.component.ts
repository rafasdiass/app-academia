// set-row.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule }    from '@angular/common'
import { Pipe, PipeTransform } from '@angular/core'
import { SetTemplate, ColorTheme } from '@core/models'
import { SetVisualStylePipe } from '@shared/pipes'
import { ColorThemeRules }    from '@core/rules'

// ── badge label → classe CSS ──────────────────────────────────────
@Pipe({ name: 'badgeClass', standalone: true })
export class BadgeClassPipe implements PipeTransform {
  transform(badge: string): string {
    if (badge.startsWith('RPT'))      return 'rpt'
    if (badge.startsWith('MYO MINI')) return 'myo-mini'
    if (badge.startsWith('MYO'))      return 'myo'
    const map: Record<string, string> = {
      'ISO': 'iso', 'EXC': 'exc', 'PAUSE': 'pause',
      'DROP ISO': 'drop', 'UNI': 'uni', 'SAFE': 'safe',
      '+MYO': 'myo', '1,5 REP': 'uni',
    }
    return map[badge] ?? 'iso'
  }
}

// ── cor do tema → hex ─────────────────────────────────────────────
@Pipe({ name: 'themeHex', standalone: true })
export class ThemeHexPipe implements PipeTransform {
  transform(color: ColorTheme): string { return ColorThemeRules.getHex(color) }
}

// ── label da série → dica legível para o iniciante ───────────────
@Pipe({ name: 'setLabelHint', standalone: true })
export class SetLabelHintPipe implements PipeTransform {
  transform(label: string): string {
    const map: Record<string, string> = {
      'TOP SET':  'Série principal',
      'SÉRIE 1':  'Série principal',
      'SÉRIE 2':  '−10% de carga',
      'SÉRIE 3':  '−20% de carga',
      'ATIVAÇÃO': 'Série de ativação',
      'MINI ×1':  '5 resp. descanso',
      'MINI ×2':  '5 resp. descanso',
      'MINI ×3':  '5 resp. descanso',
      'MINI ×4':  '5 resp. descanso',
      'RODADA 2': 'Segunda rodada',
      'AQUEC. A': 'Aquecimento',
      'AQUEC. B': 'Aquecimento',
    }
    return map[label] ?? ''
  }
}

@Component({
  selector:        'app-set-row',
  templateUrl:     './set-row.component.html',
  styleUrls:       ['./set-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports: [CommonModule, SetVisualStylePipe, BadgeClassPipe, ThemeHexPipe, SetLabelHintPipe],
})
export class SetRowComponent {
  @Input({ required: true }) set!:   SetTemplate
  @Input({ required: true }) color!: ColorTheme
}
