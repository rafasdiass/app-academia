// plan-header.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { WorkoutPlan, UserProfile } from '@core/models'

@Component({
  selector:        'app-plan-header',
  templateUrl:     './plan-header.component.html',
  styleUrls:       ['./plan-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports:         [CommonModule],
})
export class PlanHeaderComponent {
  @Input({ required: true }) plan!: WorkoutPlan
  @Input() user: UserProfile | null = null
}
