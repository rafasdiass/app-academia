// ─────────────────────────────────────────────────────────────────
// forgot-password.page.ts
// Responsabilidade única: solicitar reset de senha via e-mail.
//
// Fluxo:
//   1. Usuário informa o e-mail cadastrado
//   2. submit() → ApiService.sendPasswordResetEmail() (via AuthService)
//   3. Sucesso: exibe estado "email enviado" (sem navegar)
//   4. Erro:    exibe mensagem amigável
//
// TODO: implementar AuthService.sendPasswordReset(email) que chama
//       firebase.auth().sendPasswordResetEmail(email)
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
  mailOutline,
  arrowForwardOutline,
  arrowBackOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons'

import { LoadingService }  from '@core/services/loading.service'

// TODO: adicionar AuthService.sendPasswordReset(email): Promise<void>
// import { AuthService } from '@core/services/auth.service'

@Component({
  selector:        'app-forgot-password',
  templateUrl:     './forgot-password.page.html',
  styleUrls:       ['./forgot-password.page.scss'],
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
export class ForgotPasswordPage {

  // private readonly auth    = inject(AuthService)  // TODO
  private readonly loading = inject(LoadingService)

  // ── Form state ────────────────────────────────────────────────────
  email        = ''
  sent         = signal(false)
  errorMessage = signal<string | null>(null)

  constructor() {
    addIcons({
      mailOutline,
      arrowForwardOutline,
      arrowBackOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
    })
  }

  // ── Actions ───────────────────────────────────────────────────────

  async submit(): Promise<void> {
    this.errorMessage.set(null)

    if (!this.email.trim() || !this.email.includes('@')) {
      this.errorMessage.set('Informe um e-mail válido.')
      return
    }

    try {
      await this.loading.wrap(async () => {
        // TODO: await this.auth.sendPasswordReset(this.email.trim())
        // Simulação até o método ser implementado:
        await new Promise(r => setTimeout(r, 800))
      })
      this.sent.set(true)
    } catch (err: unknown) {
      this.errorMessage.set(this.friendlyError(err))
    }
  }

  retry(): void {
    this.sent.set(false)
    this.email = ''
    this.errorMessage.set(null)
  }

  private friendlyError(err: unknown): string {
    const code = (err as { code?: string })?.code ?? ''
    if (code.includes('user-not-found')) return 'Não encontramos nenhuma conta com este e-mail.'
    if (code.includes('invalid-email'))  return 'E-mail inválido.'
    if (code.includes('network'))        return 'Sem conexão. Verifique sua internet.'
    return 'Ocorreu um erro. Tente novamente.'
  }
}
