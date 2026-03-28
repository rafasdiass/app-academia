// ─────────────────────────────────────────────────────────────────
// user.model.ts
// Entidades de autenticação e perfil do usuário.
// ─────────────────────────────────────────────────────────────────
// Sem imports de outros models — entidade independente.

/**
 * Papéis possíveis de um usuário no sistema.
 */
export type UserRole = 'admin' | 'athlete'

/**
 * Perfil persistido no Firestore em: users/{uid}
 */
export interface UserProfile {
  uid:         string
  email:       string
  displayName: string
  role:        UserRole
  /** ID do plano de treino vinculado ao atleta */
  planId:      string
  /** Data de criação da conta — formato ISO 8601 */
  createdAt:   string
}

/**
 * Payload usado no fluxo de login.
 * Nunca persiste senha — apenas trafega para ApiService.signIn().
 */
export interface AuthCredentials {
  email:    string
  password: string
}
