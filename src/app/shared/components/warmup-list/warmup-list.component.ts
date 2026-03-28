// ─────────────────────────────────────────────────────────────────
// warmup-list.component.ts
// Responsabilidade única: lista de aquecimento do bloco de treino.
//
// CORREÇÃO: NgFor + NgIf → CommonModule
// ─────────────────────────────────────────────────────────────────
import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { IonIcon }      from '@ionic/angular/standalone'
import { addIcons }     from 'ionicons'
import { flashOutline } from 'ionicons/icons'

@Component({
  selector:        'app-warmup-list',
  templateUrl:     './warmup-list.component.html',
  styleUrls:       ['./warmup-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports:         [CommonModule, IonIcon],
})
export class WarmupListComponent {

  constructor() {
    addIcons({ flashOutline })
  }

  /** Itens de aquecimento (TreinoBlock.warmup: string[]) */
  @Input({ required: true }) items: string[] = []

  /** Título exibido acima da lista */
  @Input() title = 'Aquecimento'

  trackByIndex(index: number): number {
    return index
  }
}
