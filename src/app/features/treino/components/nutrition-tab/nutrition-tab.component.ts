// nutrition-tab.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Nutrition, Hydration, Supplement, AthleteProfile } from '@core/models'

@Component({
  selector:        'app-nutrition-tab',
  templateUrl:     './nutrition-tab.component.html',
  styleUrls:       ['./nutrition-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports:         [CommonModule],
})
export class NutritionTabComponent {
  @Input({ required: true }) nutrition!:   Nutrition
  @Input({ required: true }) hydration!:   Hydration
  @Input({ required: true }) supplements!: Supplement[]
  @Input({ required: true }) athlete!:     AthleteProfile
}
