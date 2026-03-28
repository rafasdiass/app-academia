// ─────────────────────────────────────────────────────────────────
// auth.service.ts
// ─────────────────────────────────────────────────────────────────
import { Injectable, inject }   from '@angular/core'
import { Router }               from '@angular/router'
import {
  BehaviorSubject,
  Observable,
  of,
}                               from 'rxjs'
import {
  map,
  switchMap,
  distinctUntilChanged,
  filter,
  take,
  catchError,
}                               from 'rxjs/operators'

import { ApiService }           from '@core/api'
import { UserService }          from '@core/services/user.service'
import {
  AuthCredentials,
  UserProfile,
}                               from '@core/models'

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly api         = inject(ApiService)
  private readonly userService = inject(UserService)
  private readonly router      = inject(Router)

  // ── Estado interno ───────────────────────────────────────────────
  private readonly _currentUser$ = new BehaviorSubject<UserProfile | null>(null)
  private readonly _initialized$ = new BehaviorSubject<boolean>(false)

  // Flag síncrona — atualizada pelo onAuthStateChanged E pelo login().
  // Não depende do Firestore — guards lêem isso, não isLoggedIn$.
  private _firebaseAuthed = false

  // ── Streams públicos (usados por components/pages futuras) ───────

  /** Perfil Firestore do usuário autenticado. null se não logado ou perfil ainda carregando. */
  readonly currentUser$: Observable<UserProfile | null> =
    this._currentUser$.asObservable()

  /** true quando há sessão ativa E perfil Firestore carregado. */
  readonly isLoggedIn$: Observable<boolean> = this._currentUser$.pipe(
    map(user => user !== null),
    distinctUntilChanged(),
  )

  constructor() {
    this.initAuthListener()
  }

  // ── Listener de auth ─────────────────────────────────────────────

  private initAuthListener(): void {
    this.api.onAuthStateChanged().pipe(
      distinctUntilChanged((prev, curr) => prev?.uid === curr?.uid),
      switchMap(firebaseUser => {
        this._firebaseAuthed = firebaseUser !== null
        this._initialized$.next(true)

        console.log('[Auth] onAuthStateChanged uid:', firebaseUser?.uid ?? 'null')

        if (firebaseUser === null) {
          return of(null)
        }

        return this.userService.getProfile(firebaseUser.uid).pipe(
          catchError(err => {
            console.warn('[Auth] getProfile falhou (Firestore):', err?.code ?? err)
            return of(null)
          }),
        )
      }),
    ).subscribe({
      next:  profile => this._currentUser$.next(profile),
      error: err => {
        console.error('[Auth] Erro fatal:', err)
        this._firebaseAuthed = false
        this._currentUser$.next(null)
        this._initialized$.next(true)
      },
    })
  }

  // ── Guards ───────────────────────────────────────────────────────

  /**
   * Aguarda Firebase Auth resolver o estado inicial.
   * Baseado em _firebaseAuthed — não depende do Firestore.
   * Usado por authGuard e publicGuard.
   */
  waitUntilReady(): Promise<boolean> {
    console.log('[Auth] waitUntilReady — initialized:', this._initialized$.getValue(), 'authed:', this._firebaseAuthed)
    return new Promise(resolve => {
      this._initialized$.pipe(
        filter(v => v === true),
        take(1),
      ).subscribe(() => {
        console.log('[Auth] waitUntilReady resolvido — authed:', this._firebaseAuthed)
        resolve(this._firebaseAuthed)
      })
    })
  }

  // ── Ações ────────────────────────────────────────────────────────

  async login(credentials: AuthCredentials): Promise<void> {
    console.log('[Auth] login — chamando signIn...')
    await this.api.signIn(credentials)

    // Garante _firebaseAuthed = true ANTES de navegar
    // onAuthStateChanged pode não ter disparado ainda neste tick
    this._firebaseAuthed = true
    this._initialized$.next(true)

    console.log('[Auth] signIn OK — navegando para /home')
    const ok = await this.router.navigate(['/home'], { replaceUrl: true })
    console.log('[Auth] navigate /home resultado:', ok)
  }

  async logout(): Promise<void> {
    await this.api.signOut()
    this._firebaseAuthed = false
    this._currentUser$.next(null)
    await this.router.navigate(['/login'], { replaceUrl: true })
  }

  // ── Helpers síncronos ────────────────────────────────────────────

  /** Snapshot do perfil Firestore. Pode ser null mesmo logado (perfil ainda carregando). */
  getCurrentUser(): UserProfile | null {
    return this._currentUser$.getValue()
  }

  /** UID via Firebase Auth — não depende do Firestore. */
  getCurrentUid(): string | null {
    return this.api.getCurrentFirebaseUser()?.uid ?? null
  }

  /** true se o usuário tem o papel especificado. Requer perfil Firestore carregado. */
  hasRole(role: UserProfile['role']): boolean {
    return this._currentUser$.getValue()?.role === role
  }
}
