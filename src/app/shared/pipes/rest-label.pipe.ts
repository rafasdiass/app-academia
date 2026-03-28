// ─────────────────────────────────────────────────────────────────
// rest-label.pipe.ts
// Label humanizado de descanso.
// Retorna restNote do coach quando existir; senão "M:SS de descanso".
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { RestTimerRules }      from '@core/rules'

@Pipe({ name: 'restLabel', pure: true, standalone: true })
export class RestLabelPipe implements PipeTransform {
  transform(restSec: number, restNote: string | null): string {
    if (restNote && restNote.trim().length > 0) return restNote.trim()
    return `${RestTimerRules.formatCountdown(restSec)} de descanso`
  }
}
