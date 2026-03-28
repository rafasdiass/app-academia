// ─────────────────────────────────────────────────────────────────
// seconds-to-mmss.pipe.ts
// Transforma segundos em "M:SS".
// Delega para RestTimerRules.formatCountdown().
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { RestTimerRules }      from '@core/rules'

@Pipe({ name: 'secondsToMmss', pure: true, standalone: true })
export class SecondsTommssPipe implements PipeTransform {
  /** @param value segundos (ex: 90) → "1:30" */
  transform(value: number): string {
    return RestTimerRules.formatCountdown(value)
  }
}
