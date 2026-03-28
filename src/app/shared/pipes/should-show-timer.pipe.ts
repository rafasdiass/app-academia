// ─────────────────────────────────────────────────────────────────
// should-show-timer.pipe.ts
// Retorna false para séries AQUEC. A / AQUEC. B (sem timer).
// Delega para RestTimerRules.shouldShowTimer().
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { SetLabelType }        from '@core/models'
import { RestTimerRules }      from '@core/rules'

@Pipe({ name: 'shouldShowTimer', pure: true, standalone: true })
export class ShouldShowTimerPipe implements PipeTransform {
  transform(label: SetLabelType): boolean {
    return RestTimerRules.shouldShowTimer(label)
  }
}
