// ─────────────────────────────────────────────────────────────────
// loading-spinner.component.ts
// Responsabilidade única: overlay de carregamento global.
//
// Consome LoadingService.isLoading$ via async pipe.
// IonSpinner importado individualmente (standalone).
// Overlay fixo com backdrop blur — ver SCSS.
// ─────────────────────────────────────────────────────────────────
import {
  Component,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core'
import { CommonModule }  from '@angular/common'
import { IonSpinner }    from '@ionic/angular/standalone'
import { LoadingService } from '@core/services/loading.service'

@Component({
  selector:        'app-loading-spinner',
  templateUrl:     './loading-spinner.component.html',
  styleUrls:       ['./loading-spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports:         [CommonModule, IonSpinner],
})
export class LoadingSpinnerComponent {
  readonly loadingService = inject(LoadingService)
}
