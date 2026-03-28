// ─────────────────────────────────────────────────────────────────
// treino-tab.component.ts
// Responsabilidade única: renderizar a lista de exercícios do bloco.
//
// RECEBE:
//   block — TreinoBlock com exercises[] e warmup[]
//
// ESTADO INTERNO:
//   expandedIndex: number | null — qual card está expandido (accordion)
//   Lógica puramente de UI — não é regra de negócio.
//
// REPASSA para ExerciseCardComponent:
//   [exercise] [color] [index] [expanded] (expandedChange)
//
// NÃO FAZ:
//   - Não injeta service
//   - Não injeta rules
//   - Não conhece SetTemplate — só repassa o exercise completo
// ─────────────────────────────────────────────────────────────────
import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core'
import { NgFor, NgIf }   from '@angular/common'
import { TreinoBlock }   from '@core/models'
import { WarmupListComponent }  from '@shared/components/warmup-list/warmup-list.component'
import { ExerciseCardComponent } from '@shared/components/exercise-card/exercise-card.component'

@Component({
  selector:        'app-treino-tab',
  templateUrl:     './treino-tab.component.html',
  styleUrls:       ['./treino-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports: [
    NgFor, NgIf,
    WarmupListComponent,
    ExerciseCardComponent,
  ],
})
export class TreinoTabComponent {
  private readonly cdr = inject(ChangeDetectorRef)

  @Input({ required: true }) block!: TreinoBlock

  // ── Estado de UI: accordion ──────────────────────────────────────
  // null = todos fechados | number = índice do card aberto
  expandedIndex: number | null = null

  /**
   * Alterna o card expandido.
   * Se o mesmo índice for clicado, fecha. Se outro, abre o novo.
   * OnPush requer markForCheck() pois o estado é mutado internamente.
   */
  onCardExpanded(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index
    this.cdr.markForCheck()
  }

  trackByExerciseId(_: number, exercise: { id: string }): string {
    return exercise.id
  }
}
