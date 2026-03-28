// ─────────────────────────────────────────────────────────────────
// user.service.ts
// Responsabilidade única: perfil do usuário no Firestore.
//
// O que faz:
//   - Lê o perfil do usuário (UserProfile)
//   - Cria o documento de perfil no primeiro registro
//   - Atualiza campos do perfil
//   - Atualiza avatar (upload + URL no perfil)
//   - Constrói UserProfile novo com valores padrão
//
// O que NÃO faz:
//   - Não gerencia sessão              → auth.service.ts
//   - Não cria conta Firebase Auth     → register.service.ts
//   - Não conhece Firebase             → api.service.ts
//   - Não tem lógica de negócio        → rules/
// ─────────────────────────────────────────────────────────────────
import { Injectable, inject }   from '@angular/core'
import { Observable }           from 'rxjs'
import { map }                  from 'rxjs/operators'

import { ApiService }           from '@core/api'
import {
  UserProfile,
  UserRole,
}                               from '@core/models'

// ── Tipos auxiliares ─────────────────────────────────────────────

/**
 * Campos que o próprio atleta pode atualizar no perfil.
 * uid, email, role e createdAt são imutáveis após criação.
 */
export type UpdateableProfileFields = Pick<
  UserProfile,
  'displayName' | 'planId'
>

/**
 * UserProfile com campo opcional de foto.
 * Estende o model base para suportar o avatar sem alterar o contrato original.
 */
export interface UserProfileWithPhoto extends UserProfile {
  photoUrl?: string
}

// ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly api = inject(ApiService)

  // ── Paths ────────────────────────────────────────────────────────
  private userPath(uid: string): string {
    return `users/${uid}`
  }

  private avatarPath(uid: string): string {
    return `avatars/${uid}.jpg`
  }

  // ── GET ──────────────────────────────────────────────────────────

  /**
   * Stream reativo do perfil do usuário.
   * Atualiza automaticamente quando o documento muda no Firestore.
   * Usa api.get<T>() — GET /users/{uid}.
   *
   * @param uid  UID do usuário Firebase Auth
   */
  getProfile(uid: string): Observable<UserProfile> {
    return this.api.get<UserProfile>(this.userPath(uid))
  }

  /**
   * Verifica se o documento de perfil já existe no Firestore.
   * Usado pelo RegisterService para evitar duplicação.
   *
   * @param uid  UID do usuário Firebase Auth
   */
  profileExists(uid: string): Observable<boolean> {
    return this.api.get<UserProfile>(this.userPath(uid)).pipe(
      map(profile => profile !== null && profile !== undefined),
    )
  }

  // ── PUT ──────────────────────────────────────────────────────────

  /**
   * Cria o documento de perfil no Firestore.
   * Chamado pelo RegisterService após criar a conta no Firebase Auth.
   * Usa api.put<T>() — PUT /users/{uid} — idempotente (seguro chamar 2x).
   *
   * @param profile  UserProfile completo — todos os campos obrigatórios
   */
  async createProfile(profile: UserProfile): Promise<void> {
    await this.api.put<UserProfile>(
      this.userPath(profile.uid),
      profile,
    )
  }

  // ── PATCH ────────────────────────────────────────────────────────

  /**
   * Atualiza campos específicos do perfil.
   * Não sobrescreve campos não mencionados.
   * Usa api.patch<T>() — PATCH /users/{uid}.
   *
   * @param uid    UID do usuário
   * @param fields Apenas os campos atualizáveis: displayName | planId
   *
   * Uso:
   *   await this.userService.updateProfile(uid, { displayName: 'João' })
   */
  async updateProfile(
    uid:    string,
    fields: Partial<UpdateableProfileFields>,
  ): Promise<void> {
    await this.api.patch<UserProfile>(
      this.userPath(uid),
      fields,
    )
  }

  /**
   * Atualiza o papel do usuário.
   * Operação restrita — apenas admin deve chamar este método.
   * Usa api.patch<T>() — PATCH /users/{uid}.
   *
   * @param uid   UID do usuário
   * @param role  Novo papel: 'admin' | 'athlete'
   */
  async updateRole(uid: string, role: UserRole): Promise<void> {
    await this.api.patch<UserProfile>(
      this.userPath(uid),
      { role },
    )
  }

  /**
   * Faz upload do avatar e persiste a URL no perfil.
   * Usa api.uploadAndGetUrl() — POST /storage/avatars/{uid}.jpg
   * Usa api.patch<T>()        — PATCH /users/{uid} (photoUrl).
   *
   * @param uid   UID do usuário
   * @param file  Imagem selecionada (Blob ou File)
   * @returns     URL pública do avatar salvo
   */
  async updateAvatar(uid: string, file: Blob | File): Promise<string> {
    const url = await this.api.uploadAndGetUrl(this.avatarPath(uid), file)

    await this.api.patch<UserProfileWithPhoto>(
      this.userPath(uid),
      { photoUrl: url },
    )

    return url
  }

  // ── Helpers ──────────────────────────────────────────────────────

  /**
   * Constrói um UserProfile novo com valores padrão.
   * Chamado pelo RegisterService ao criar a conta.
   * Função pura — sem efeitos colaterais.
   *
   * @param uid          UID gerado pelo Firebase Auth
   * @param email        Email de cadastro
   * @param displayName  Nome exibido no app
   */
  buildNewProfile(
    uid:         string,
    email:       string,
    displayName: string,
  ): UserProfile {
    return {
      uid,
      email,
      displayName,
      role:      'athlete',
      planId:    '',
      createdAt: new Date().toISOString(),
    }
  }
}
