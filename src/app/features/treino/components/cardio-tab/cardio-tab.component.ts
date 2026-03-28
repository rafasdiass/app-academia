// cardio-tab.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Cardio } from '@core/models'

@Component({
  selector:        'app-cardio-tab',
  templateUrl:     './cardio-tab.component.html',
  styleUrls:       ['./cardio-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports:         [CommonModule],
})
export class CardioTabComponent {
  @Input({ required: true }) cardio!: Cardio
}
