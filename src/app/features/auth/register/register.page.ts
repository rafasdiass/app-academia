// ─────────────────────────────────────────────────────────────────
// register.page.ts
// Responsabilidade única: capturar dados e delegar ao RegisterService.
// ─────────────────────────────────────────────────────────────────
import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core'
import { CommonModule }    from '@angular/common'
import { FormsModule }     from '@angular/forms'
import { RouterLink }      from '@angular/router'
import {
  IonContent,
  IonIcon,
}                          from '@ionic/angular/standalone'
import { addIcons }        from 'ionicons'
import {
  eyeOutline,
  eyeOffOutline,
  mailOutline,
  lockClosedOutline,
  personOutline,
  arrowForwardOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons'

import { RegisterService } from '@core/services/register.service'
import { LoadingService }  from '@core/services/loading.service'

@Component({
  selector:        'app-register',
  templateUrl:     './register.page.html',
  styleUrls:       ['./register.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonIcon,
  ],
})
export class RegisterPage {

  private readonly registerService = inject(RegisterService)
  private readonly loading         = inject(LoadingService)

  // ── Form state ────────────────────────────────────────────────────
  displayName     = ''
  email           = ''
  password        = ''
  confirmPassword = ''
  showPassword    = signal(false)
  showConfirm     = signal(false)
  errorMessage    = signal<string | null>(null)

  constructor() {
    addIcons({
      eyeOutline,
      eyeOffOutline,
      mailOutline,
      lockClosedOutline,
      personOutline,
      arrowForwardOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
    })
  }

  // ── Derived ───────────────────────────────────────────────────────

  get passwordsMatch(): boolean {
    return this.registerService.passwordsMatch(this.password, this.confirmPassword)
  }

  get confirmTouched(): boolean {
    return this.confirmPassword.length > 0
  }

  // ── Actions ───────────────────────────────────────────────────────

  togglePassword(): void { this.showPassword.update(v => !v) }
  toggleConfirm():  void { this.showConfirm.update(v => !v) }

  async submit(): Promise<void> {
    this.errorMessage.set(null)

    if (!this.passwordsMatch) {
      this.errorMessage.set('As senhas não conferem.')
      return
    }

    try {
      await this.loading.wrap(() =>
        this.registerService.register({
          displayName: this.displayName,
          email:       this.email.trim(),
          password:    this.password,
        }),
      )
    } catch (err: unknown) {
      this.errorMessage.set(this.friendlyError(err))
    }
  }

  private friendlyError(err: unknown): string {
    const msg  = (err as { message?: string })?.message ?? ''
    const code = (err as { code?:    string })?.code    ?? ''

    // Erros de validação local do RegisterService
    if (msg && !code) return msg

    if (code.includes('email-already-in-use')) return 'Este e-mail já está cadastrado.'
    if (code.includes('invalid-email'))        return 'E-mail inválido.'
    if (code.includes('weak-password'))        return 'Senha muito fraca. Use no mínimo 6 caracteres.'
    if (code.includes('network'))              return 'Sem conexão. Verifique sua internet.'
    return 'Ocorreu um erro. Tente novamente.'
  }
}
