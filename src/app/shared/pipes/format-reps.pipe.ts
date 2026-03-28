// ─────────────────────────────────────────────────────────────────
// format-reps.pipe.ts
// Formata repetições para exibição no log de execução.
// Trata corretamente singular (1 rep) vs plural (N reps).
// null → "—" (série não registrada).
// Delega para SetRules.formatReps() — zero lógica aqui.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { SetRules }            from '@core/rules'

@Pipe({ name: 'formatReps', pure: true, standalone: true })
export class FormatRepsPipe implements PipeTransform {

  /**
   * @param repsDone  Repetições realizadas ou null se não registrado
   * @returns         "8 reps" | "1 rep" | "—"
   */
  transform(repsDone: number | null): string {
    return SetRules.formatReps(repsDone)
  }
}
