import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
// CommonModule removido pois o @if não precisa dele
import { IonIcon }           from '@ionic/angular/standalone';
import { addIcons }          from 'ionicons';
import { timerOutline }      from 'ionicons/icons';
import { SetLabelType }      from '@core/models';
import { SecondsTommssPipe, RestLabelPipe } from '@shared/pipes';

@Component({
  selector:        'app-rest-timer',
  templateUrl:     './rest-timer.component.html',
  styleUrls:       ['./rest-timer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports:         [IonIcon, SecondsTommssPipe, RestLabelPipe], // Limpo e direto
})
export class RestTimerComponent {

  constructor() {
    // Registra o ícone para o standalone component
    addIcons({ timerOutline });
  }

  @Input({ required: true }) restSec!: number;
  @Input() restNote: string | null = null;
  @Input() label: SetLabelType | null = null;
  @Input() active = false;
  @Output() finished = new EventEmitter<void>();
}
