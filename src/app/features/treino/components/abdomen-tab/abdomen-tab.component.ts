// abdomen-tab.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Abdomen } from '@core/models'

@Component({
  selector:        'app-abdomen-tab',
  templateUrl:     './abdomen-tab.component.html',
  styleUrls:       ['./abdomen-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports:         [CommonModule],
})
export class AbdomenTabComponent {
  @Input({ required: true }) abdomen!: Abdomen
}
