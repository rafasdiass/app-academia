// periodization-tab.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  PeriodizationWeek, WeekDay, AdvancedProtocols,
} from '@core/models'

@Component({
  selector:        'app-periodization-tab',
  templateUrl:     './periodization-tab.component.html',
  styleUrls:       ['./periodization-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports:         [CommonModule],
})
export class PeriodizationTabComponent {
  @Input({ required: true }) periodization!:      PeriodizationWeek[]
  @Input({ required: true }) weekSchedule!:       WeekDay[]
  @Input({ required: true }) advancedProtocols!:  AdvancedProtocols
  @Input({ required: true }) durationWeeks!:      number

  /** Mapeia fase → classe de cor CSS */
  phaseColor(phase: string): string {
    const p = phase?.toLowerCase() ?? ''
    if (p.includes('adapt'))    return 'green'
    if (p.includes('consol'))   return 'teal'
    if (p.includes('hipert'))   return 'amber'
    if (p.includes('intens'))   return 'red'
    return 'teal'
  }
}
