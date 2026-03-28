// ─────────────────────────────────────────────────────────────────
// register.service.ts
// Responsabilidade única: criação de conta do atleta.
//
// O que faz:
//   - Valida os dados de cadastro localmente
//   - Cria conta no Firebase Auth via ApiService.createAccount()
//   - Orquestra a criação do UserProfile via UserService.createProfile()
//   - Navega para '/home' após sucesso
//
// O que NÃO faz:
//   - Não gerencia sessão              → auth.service.ts
//   - Não atualiza perfil existente    → user.service.ts
//   - Não conhece Firebase             → api.service.ts
//   - Não tem lógica de negócio        → rules/
//
// FLUXO:
//   register()
//     1. validate()                  → valida localmente
//     2. api.createAccount()         → POST /auth/register (Firebase Auth)
//     3. userService.buildNewProfile → constrói UserProfile (puro, sem I/O)
//     4. userService.createProfile() → PUT /users/{uid} (Firestore)
//     5. router.navigate('/home')    → navega após sucesso
// ─────────────────────────────────────────────────────────────────
import { Injectable, inject }   from '@angular/core'
import { Router }               from '@angular/router'

import { ApiService }           from '@core/api'
import { UserService }          from '@core/services/user.service'
import { AuthCredentials }      from '@core/models'

// ── Tipos públicos ───────────────────────────────────────────────

/**
 * Dados necessários para criar uma nova conta de atleta.
 * Estende AuthCredentials com o nome de exibição.
 */
export interface RegisterCredentials extends AuthCredentials {
  displayName: string
}

/**
 * Resultado da validação local de cadastro.
 */
export interface ValidationResult {
  valid:   boolean
  message: string | null
}

// ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class RegisterService {

  private readonly api         = inject(ApiService)
  private readonly userService = inject(UserService)
  private readonly router      = inject(Router)

  // ── Registro ─────────────────────────────────────────────────────

  /**
   * Fluxo completo de criação de conta do atleta.
   *
   * Etapas:
   *   1. Valida os dados localmente — evita chamadas Firebase desnecessárias
   *   2. Cria conta no Firebase Auth via api.createAccount()
   *   3. Constrói o UserProfile com valores padrão (role: 'athlete')
   *   4. Persiste o UserProfile no Firestore via userService.createProfile()
   *   5. Navega para '/home'
   *
   * @param credentials  Email, senha e nome de exibição
   * @throws Error        se a validação local falhar
   * @throws ApiError     se Firebase Auth ou Firestore retornar erro
   */
  async register(credentials: RegisterCredentials): Promise<void> {
    // 1. Valida localmente antes de qualquer chamada à API
    const validation = this.validate(credentials)
    if (!validation.valid) {
      throw new Error(validation.message ?? 'Dados inválidos.')
    }

    // 2. Cria conta no Firebase Auth
    // api.createAccount() → POST /auth/register
    // Retorna UserCredential com o uid gerado pelo Firebase
    const userCredential = await this.api.createAccount({
      email:    credentials.email,
      password: credentials.password,
    })

    const uid = userCredential.user.uid

    // 3. Constrói o perfil com valores padrão
    // buildNewProfile é pura — sem I/O, sem efeitos colaterais
    const profile = this.userService.buildNewProfile(
      uid,
      credentials.email,
      credentials.displayName,
    )

    // 4. Persiste o perfil no Firestore
    // userService.createProfile() → PUT /users/{uid}
    await this.userService.createProfile(profile)

    // 5. Navega para home após sucesso
    await this.router.navigate(['/home'], { replaceUrl: true })
  }

  // ── Validações ───────────────────────────────────────────────────

  /**
   * Valida os dados de cadastro antes de enviar ao Firebase.
   * Função pura — sem I/O, sem efeitos colaterais.
   * Retorna ValidationResult com valid e message descritiva.
   *
   * @param credentials  Dados de cadastro a validar
   */
  validate(credentials: RegisterCredentials): ValidationResult {
    if (!credentials.displayName?.trim()) {
      return { valid: false, message: 'O nome é obrigatório.' }
    }
    if (credentials.displayName.trim().length < 2) {
      return { valid: false, message: 'O nome deve ter pelo menos 2 caracteres.' }
    }
    if (!credentials.email?.trim()) {
      return { valid: false, message: 'O e-mail é obrigatório.' }
    }
    if (!credentials.email.includes('@')) {
      return { valid: false, message: 'E-mail inválido.' }
    }
    if (!credentials.password) {
      return { valid: false, message: 'A senha é obrigatória.' }
    }
    if (credentials.password.length < 6) {
      return { valid: false, message: 'A senha deve ter no mínimo 6 caracteres.' }
    }
    return { valid: true, message: null }
  }

  /**
   * Verifica se duas senhas conferem.
   * Função pura — sem I/O, sem efeitos colaterais.
   * Útil para validar o campo "confirmar senha" no formulário.
   *
   * @param password         Senha digitada
   * @param confirmPassword  Confirmação digitada
   * @returns                true se idênticas e não vazias
   */
  passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword && password.length > 0
  }
}
