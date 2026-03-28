// ─────────────────────────────────────────────────────────────────
// sum-sets.pipe.ts
// Conta o total de séries prescritas de uma lista de ExerciseTemplate.
// Usado no TreinoHeaderComponent para o KPI de séries.
// Delega para WorkoutPlanRules.getTotalSetCount() via bloco virtual.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { ExerciseTemplate }    from '@core/models'

@Pipe({ name: 'sumSets', pure: true, standalone: true })
export class SumSetsPipe implements PipeTransform {
  /**
   * @param exercises  Array de ExerciseTemplate do bloco
   * @returns          Total de séries prescritas
   */
  transform(exercises: ExerciseTemplate[]): number {
    if (!exercises?.length) return 0
    return exercises.reduce((total, ex) => total + ex.sets.length, 0)
  }
}
