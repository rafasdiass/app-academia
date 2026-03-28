// ─────────────────────────────────────────────────────────────────
// treino-tab.component.ts
// ─────────────────────────────────────────────────────────────────
import {
  Component, Input, ChangeDetectionStrategy,
  ChangeDetectorRef, inject,
} from '@angular/core'
import { CommonModule }                  from '@angular/common'
import { TreinoBlock, ExerciseTemplate } from '@core/models'
import { ExerciseStat }                  from '@core/models/session.model'
import { WarmupListComponent }           from '@shared/components/warmup-list/warmup-list.component'
import { ExerciseCardComponent }         from '@shared/components/exercise-card/exercise-card.component'

@Component({
  selector:        'app-treino-tab',
  templateUrl:     './treino-tab.component.html',
  styleUrls:       ['./treino-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports: [CommonModule, WarmupListComponent, ExerciseCardComponent],
})
export class TreinoTabComponent {

  private readonly cdr = inject(ChangeDetectorRef)

  @Input({ required: true }) block!: TreinoBlock

  /**
   * Mapa de estatísticas de execução por exerciseId.
   * Carregado pela TreinoDetailPage via WorkoutPlanService.getExerciseStats().
   * Permite exibir "12× executado · 3 dias atrás" em cada card.
   * null/undefined = stats ainda não carregadas (exibe "Primeira vez").
   */
  @Input() exerciseStats: Map<string, ExerciseStat> | null = null

  expandedIndex: number | null = null

  onCardExpanded(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index
    this.cdr.markForCheck()
  }

  /** Retorna o total de execuções de um exercício, 0 se não houver stat. */
  getExecCount(exerciseId: string): number {
    return this.exerciseStats?.get(exerciseId)?.totalSessions ?? 0
  }

  /** Retorna a data da última execução, null se nunca executado. */
  getLastDoneAt(exerciseId: string): string | null {
    return this.exerciseStats?.get(exerciseId)?.lastDoneAt ?? null
  }
}
