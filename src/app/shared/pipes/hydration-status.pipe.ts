// ─────────────────────────────────────────────────────────────────
// hydration-status.pipe.ts
// Classifica o status de hidratação do dia para colorização da UI.
// Delega para HydrationRules.getStatus() — zero lógica aqui.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform }          from '@angular/core'
import { HydrationRules, HydrationStatus } from '@core/rules'

@Pipe({ name: 'hydrationStatus', pure: true, standalone: true })
export class HydrationStatusPipe implements PipeTransform {

  /**
   * @param totalMl  Total de ml consumidos no dia
   * @param goalMl   Meta diária (opcional — usa padrão 2500ml)
   * @returns        'critical' | 'low' | 'ok' | 'optimal'
   */
  transform(totalMl: number, goalMl?: number): HydrationStatus {
    return HydrationRules.getStatus(totalMl, goalMl)
  }
}
