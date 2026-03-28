// ─────────────────────────────────────────────────────────────────
// set-visual-style.pipe.ts
// Mapeia SetLabelType → SetVisualStyle (classe CSS do set-row).
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { SetLabelType, SetVisualStyle } from '@core/models'

@Pipe({ name: 'setVisualStyle', standalone: true })
export class SetVisualStylePipe implements PipeTransform {
  transform(label: SetLabelType | string): SetVisualStyle {
    switch (label) {
      case 'TOP SET':   return 'top-set'
      case 'SÉRIE 1':   return 'top-set'
      case 'SÉRIE 2':   return 'set2'
      case 'SÉRIE 3':   return 'set3'
      case 'ATIVAÇÃO':  return 'myo-act'
      case 'MINI ×1':
      case 'MINI ×2':
      case 'MINI ×3':
      case 'MINI ×4':   return 'myo-mini'
      case 'RODADA 2':  return 'set2'
      case 'AQUEC. A':
      case 'AQUEC. B':  return 'warmup'
      default:          return 'default'
    }
  }
}
