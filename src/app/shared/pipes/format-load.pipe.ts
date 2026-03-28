// ─────────────────────────────────────────────────────────────────
// format-load.pipe.ts
// Formata carga em kg para exibição no log de execução.
// null → "—" (série não registrada).
// Delega para SetRules.formatLoad() — zero lógica aqui.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { SetRules }            from '@core/rules'

@Pipe({ name: 'formatLoad', pure: true, standalone: true })
export class FormatLoadPipe implements PipeTransform {

  /**
   * @param loadKg  Carga em kg ou null se não registrada
   * @returns       "80 kg" | "22.5 kg" | "—"
   */
  transform(loadKg: number | null): string {
    return SetRules.formatLoad(loadKg)
  }
}
