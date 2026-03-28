// ─────────────────────────────────────────────────────────────────
// login.page.ts
// ─────────────────────────────────────────────────────────────────
import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core'
import { CommonModule }    from '@angular/common'
import { FormsModule }     from '@angular/forms'
import { RouterLink }      from '@angular/router'
import {
  IonContent,
  IonIcon,
  IonSpinner,
}                          from '@ionic/angular/standalone'
import { addIcons }        from 'ionicons'
import {
  eyeOutline,
  eyeOffOutline,
  mailOutline,
  lockClosedOutline,
  arrowForwardOutline,
  alertCircleOutline,
} from 'ionicons/icons'

import { AuthService } from '@core/services/auth.service'

@Component({
  selector:        'app-login',
  templateUrl:     './login.page.html',
  styleUrls:       ['./login.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonIcon,
    IonSpinner,
  ],
})
export class LoginPage {

  private readonly auth = inject(AuthService)
  private readonly cdr  = inject(ChangeDetectorRef)

  email        = ''
  password     = ''
  showPassword = signal(false)
  isLoading    = signal(false)
  errorMessage = signal<string | null>(null)

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline, mailOutline, lockClosedOutline, arrowForwardOutline, alertCircleOutline })
  }

  togglePassword(): void {
    this.showPassword.update(v => !v)
  }

  async submit(): Promise<void> {
    if (this.isLoading()) return

    this.errorMessage.set(null)

    if (!this.email.trim() || !this.password) {
      this.errorMessage.set('Preencha e-mail e senha.')
      return
    }

    console.log('[LoginPage] submit — chamando auth.login()')
    this.isLoading.set(true)
    this.cdr.markForCheck()

    try {
      await this.auth.login({
        email:    this.email.trim(),
        password: this.password,
      })
      console.log('[LoginPage] auth.login() resolveu — navegação foi delegada ao AuthService')
    } catch (err: unknown) {
      console.error('[LoginPage] erro no login:', err)
      this.errorMessage.set(this.friendlyError(err))
      this.isLoading.set(false)
      this.cdr.markForCheck()
    }
  }

  private friendlyError(err: unknown): string {
    const code = (err as { code?: string })?.code ?? ''
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
      return 'E-mail ou senha incorretos.'
    }
    if (code.includes('too-many-requests')) {
      return 'Muitas tentativas. Aguarde e tente novamente.'
    }
    if (code.includes('network')) {
      return 'Sem conexão. Verifique sua internet.'
    }
    return 'Ocorreu um erro. Tente novamente.'
  }
}
