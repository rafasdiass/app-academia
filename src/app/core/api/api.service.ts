// ─────────────────────────────────────────────────────────────────
// api.service.ts
// Cliente Firebase genérico — equivalente a um HttpClient para Firebase.
//
// REGRA ABSOLUTA:
//   Este arquivo é o ÚNICO que importa Firebase no projeto.
//   Nenhum service, component, rule ou guard importa Firebase.
//
// RESPONSABILIDADE ÚNICA:
//   Expor operações genéricas do Firebase sem conhecimento de domínio.
//   Não sabe o que é WorkoutPlan, UserProfile, Session ou atleta.
//   O caller (service) define o tipo T e o significado da operação.
//
// OPERAÇÕES DISPONÍVEIS:
//   AUTH      → signIn, signOut, createAccount, onAuthStateChanged
//   FIRESTORE → get, getCollection, query, post, put, patch, delete
//   STORAGE   → upload, getUrl, deleteFile, uploadAndGetUrl
// ─────────────────────────────────────────────────────────────────
import { Injectable, inject }           from '@angular/core'
import { Observable, throwError }       from 'rxjs'
import { catchError, map }              from 'rxjs/operators'

// Firebase Auth
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User                as FirebaseUser,
  UserCredential,
}                                       from '@angular/fire/auth'

// Firestore
import {
  Firestore,
  doc,
  collection,
  collectionGroup,
  docData,
  collectionData,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  DocumentSnapshot,
  QueryConstraint,
  CollectionReference,
  Query,
  QueryDocumentSnapshot,
  SnapshotOptions,
}                                       from '@angular/fire/firestore'

// Storage
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  UploadResult,
}                                       from '@angular/fire/storage'

// Models — apenas AuthCredentials é necessário aqui
// ApiService não conhece nenhuma outra entidade do domínio
import { AuthCredentials }              from '@core/models'

// ── Tipos públicos do ApiService ─────────────────────────────────
// Exportados para os services usarem sem importar Firebase

/**
 * Opção de filtro para query().
 * Encapsula o operador where() do Firestore.
 */
export interface QueryFilter {
  field:    string
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'not-in'
  value:    unknown
}

/**
 * Opção de ordenação para query().
 * Encapsula o operador orderBy() do Firestore.
 */
export interface QueryOrder {
  field:     string
  direction: 'asc' | 'desc'
}

/**
 * Opções completas de query.
 * Combina filtros, ordenação, limite e cursor de paginação.
 */
export interface QueryOptions {
  filters?:       QueryFilter[]
  orderByFields?: QueryOrder[]
  limitTo?:       number
  startAfterDoc?: DocumentSnapshot
}

/**
 * Resultado de uma query paginada.
 */
export interface PaginatedResult<T> {
  items:   T[]
  lastDoc: QueryDocumentSnapshot | null
  hasMore: boolean
}

/**
 * Erro normalizado retornado pelo ApiService.
 * Todos os erros do Firebase são convertidos para este formato.
 * Os services nunca recebem erros crus do Firebase SDK.
 */
export interface ApiError {
  code:    string
  message: string
  raw:     unknown
}

// ── Converter genérico ───────────────────────────────────────────
// Garante tipagem correta em docData/collectionData sem 'as any'.
// Usado internamente — não exposto ao caller.

function genericConverter<T>() {
  return {
    toFirestore:   (data: T): DocumentData => data as DocumentData,
    fromFirestore: (snap: QueryDocumentSnapshot, opts: SnapshotOptions): T =>
      snap.data(opts) as T,
  }
}

// ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ApiService {

  // ── Injeção via inject() — padrão Angular 20 ─────────────────────
  private readonly auth      = inject(Auth)
  private readonly firestore = inject(Firestore)
  private readonly storage   = inject(Storage)

  // ══════════════════════════════════════════════════════════════════
  // AUTH
  // Operações genéricas de autenticação Firebase.
  // Os services de domínio (AuthService, RegisterService) orquestram
  // o fluxo de negócio usando estes métodos.
  // ══════════════════════════════════════════════════════════════════

  /**
   * Autentica com email e senha.
   * Equivalente a um POST /auth/login.
   *
   * @throws ApiError — nunca lança erros crus do Firebase
   */
  async signIn(credentials: AuthCredentials): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password,
      )
    } catch (err) {
      throw this.buildApiError(err)
    }
  }

  /**
   * Cria uma nova conta com email e senha.
   * Equivalente a um POST /auth/register.
   * Não cria perfil no Firestore — responsabilidade do RegisterService.
   *
   * @throws ApiError — nunca lança erros crus do Firebase
   */
  async createAccount(credentials: AuthCredentials): Promise<UserCredential> {
    try {
      return await createUserWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password,
      )
    } catch (err) {
      throw this.buildApiError(err)
    }
  }

  /**
   * Encerra a sessão do usuário autenticado.
   * Equivalente a um POST /auth/logout.
   *
   * @throws ApiError — nunca lança erros crus do Firebase
   */
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth)
    } catch (err) {
      throw this.buildApiError(err)
    }
  }

  /**
   * Stream reativo do estado de autenticação.
   * Emite FirebaseUser quando logado, null quando deslogado.
   * O AuthService transforma FirebaseUser → UserProfile.
   */
  onAuthStateChanged(): Observable<FirebaseUser | null> {
    return new Observable<FirebaseUser | null>(observer => {
      const unsubscribe = onAuthStateChanged(
        this.auth,
        user  => observer.next(user),
        error => observer.error(this.buildApiError(error)),
      )
      return () => unsubscribe()
    })
  }

  /**
   * Retorna o usuário Firebase atualmente autenticado.
   * null se não há sessão ativa.
   */
  getCurrentFirebaseUser(): FirebaseUser | null {
    return this.auth.currentUser
  }

  // ══════════════════════════════════════════════════════════════════
  // FIRESTORE — GET (leitura)
  // Equivalentes a GET /resource/:id e GET /resource
  // ══════════════════════════════════════════════════════════════════

  /**
   * Lê um documento único como stream reativo.
   * Equivalente a GET /resource/:id.
   * Atualiza automaticamente quando o documento muda no Firestore.
   *
   * @param path  'users/uid123' | 'workoutPlans/plan456'
   *
   * Uso:
   *   this.api.get<UserProfile>('users/uid123')
   */
  get<T>(path: string): Observable<T> {
    const docRef = doc(this.firestore, path).withConverter(genericConverter<T>())
    return docData(docRef).pipe(
      map(data => {
        if (data === undefined) {
          throw this.buildApiError({
            code:    'not-found',
            message: `Documento não encontrado: ${path}`,
          })
        }
        return data
      }),
      catchError(err => throwError(() => this.buildApiError(err))),
    )
  }

  /**
   * Lê uma coleção completa como stream reativo.
   * Equivalente a GET /resource.
   * Atualiza automaticamente quando qualquer documento muda.
   *
   * @param path  'sessions' | 'workoutPlans'
   *
   * Uso:
   *   this.api.getCollection<Session>('sessions')
   */
  getCollection<T>(path: string): Observable<T[]> {
    const colRef = collection(this.firestore, path)
      .withConverter(genericConverter<T>()) as CollectionReference<T>
    return collectionData(colRef).pipe(
      catchError(err => throwError(() => this.buildApiError(err))),
    )
  }

  /**
   * Query com filtros, ordenação e paginação.
   * Equivalente a GET /resource?field=value&orderBy=date&limit=20.
   *
   * @param path     Caminho da coleção
   * @param options  Filtros, ordenação, limite e cursor
   *
   * Uso:
   *   this.api.query<Session>('sessions', {
   *     filters:       [{ field: 'userId', operator: '==', value: uid }],
   *     orderByFields: [{ field: 'date', direction: 'desc' }],
   *     limitTo:       20,
   *   })
   */
  query<T>(path: string, options: QueryOptions = {}): Observable<T[]> {
    const colRef      = collection(this.firestore, path)
      .withConverter(genericConverter<T>()) as CollectionReference<T>
    const constraints = this.buildQueryConstraints(options)
    const q           = query(colRef, ...constraints) as Query<T>
    return collectionData(q).pipe(
      catchError(err => throwError(() => this.buildApiError(err))),
    )
  }

  /**
   * Query paginada — retorna items + cursor para próxima página.
   * Equivalente a GET /resource?page=2&limit=20.
   *
   * @param path     Caminho da coleção
   * @param options  Deve incluir limitTo para paginação funcionar
   */
  queryPaginated<T>(
    path: string,
    options: QueryOptions = {},
  ): Observable<PaginatedResult<T>> {
    const colRef      = collection(this.firestore, path)
      .withConverter(genericConverter<T>()) as CollectionReference<T>
    const constraints = this.buildQueryConstraints(options)
    const q           = query(colRef, ...constraints) as Query<T>
    return collectionData(q).pipe(
      map(items => ({
        items,
        lastDoc: null, // Fase 2: getDocs para cursor real
        hasMore: items.length === (options.limitTo ?? items.length),
      })),
      catchError(err => throwError(() => this.buildApiError(err))),
    )
  }

  /**
   * Query em collection group — busca em subcoleções de mesmo nome.
   * Equivalente a GET /{colecao}/{id}/subcollection?filters.
   *
   * @param collectionId  Nome da subcoleção: 'sets' | 'exercises'
   * @param options
   */
  queryGroup<T>(
    collectionId: string,
    options: QueryOptions = {},
  ): Observable<T[]> {
    const groupRef    = collectionGroup(this.firestore, collectionId)
    const constraints = this.buildQueryConstraints(options)
    const q           = query(groupRef, ...constraints)
    return collectionData(q).pipe(
      map(items => items as T[]),
      catchError(err => throwError(() => this.buildApiError(err))),
    )
  }

  // ══════════════════════════════════════════════════════════════════
  // FIRESTORE — POST (criação)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Cria documento com ID gerado automaticamente pelo Firestore.
   * Equivalente a POST /resource (body: data).
   * Retorna o ID gerado.
   *
   * @param path  Caminho da coleção: 'sessions'
   * @param data  Dados a persistir — tipado por T
   * @returns     string — ID gerado pelo Firestore
   *
   * Uso:
   *   const id = await this.api.post<Session>('sessions', session)
   */
  async post<T extends DocumentData>(
    path: string,
    data: T,
  ): Promise<string> {
    try {
      const colRef = collection(this.firestore, path)
      const docRef = await addDoc(colRef, data as DocumentData)
      return docRef.id
    } catch (err) {
      throw this.buildApiError(err)
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // FIRESTORE — PUT (substituição total)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Cria ou substitui completamente um documento com ID definido.
   * Equivalente a PUT /resource/:id (body: data).
   * Se o documento existir, sobrescreve — não faz merge.
   *
   * @param path  'users/uid123'
   * @param data  Dados completos — todos os campos
   *
   * Uso:
   *   await this.api.put<UserProfile>('users/uid123', profile)
   */
  async put<T extends DocumentData>(path: string, data: T): Promise<void> {
    try {
      const docRef = doc(this.firestore, path).withConverter(genericConverter<T>())
      await setDoc(docRef, data)
    } catch (err) {
      throw this.buildApiError(err)
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // FIRESTORE — PATCH (atualização parcial)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Atualiza campos específicos de um documento existente.
   * Equivalente a PATCH /resource/:id (body: partial data).
   * Não sobrescreve campos não mencionados — merge parcial.
   *
   * @param path  Caminho do documento
   * @param data  Apenas os campos a atualizar como Partial<T>
   *
   * Uso:
   *   await this.api.patch<Session>(
   *     'sessions/abc',
   *     { completed: true, finishedAt: new Date().toISOString() }
   *   )
   */
  async patch<T extends DocumentData>(
    path: string,
    data: Partial<T>,
  ): Promise<void> {
    try {
      const docRef = doc(this.firestore, path)
      await updateDoc(docRef, data as DocumentData)
    } catch (err) {
      throw this.buildApiError(err)
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // FIRESTORE — DELETE
  // ══════════════════════════════════════════════════════════════════

  /**
   * Remove um documento permanentemente.
   * Equivalente a DELETE /resource/:id.
   *
   * @param path  'sessions/abc123'
   *
   * Uso:
   *   await this.api.delete('sessions/abc123')
   */
  async delete(path: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, path)
      await deleteDoc(docRef)
    } catch (err) {
      throw this.buildApiError(err)
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STORAGE — upload, download, delete
  // ══════════════════════════════════════════════════════════════════

  /**
   * Faz upload de um arquivo para o Firebase Storage.
   * Equivalente a POST /storage/:path (multipart/form-data).
   *
   * @param storagePath  'avatars/uid123.jpg'
   * @param file         Blob ou File
   */
  async upload(storagePath: string, file: Blob | File): Promise<UploadResult> {
    try {
      const storageRef = ref(this.storage, storagePath)
      return await uploadBytes(storageRef, file)
    } catch (err) {
      throw this.buildApiError(err)
    }
  }

  /**
   * Retorna a URL pública de download de um arquivo.
   * Equivalente a GET /storage/:path.
   *
   * @param storagePath  'avatars/uid123.jpg'
   * @returns            URL pública assinada
   */
  async getUrl(storagePath: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, storagePath)
      return await getDownloadURL(storageRef)
    } catch (err) {
      throw this.buildApiError(err)
    }
  }

  /**
   * Remove um arquivo do Storage permanentemente.
   * Equivalente a DELETE /storage/:path.
   *
   * @param storagePath  'avatars/uid123.jpg'
   */
  async deleteFile(storagePath: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, storagePath)
      await deleteObject(storageRef)
    } catch (err) {
      throw this.buildApiError(err)
    }
  }

  /**
   * Upload + URL em um único passo.
   * Conveniência para o caso mais comum: avatar, foto de progresso.
   *
   * @param storagePath  Caminho no Storage
   * @param file         Blob ou File
   * @returns            URL pública
   */
  async uploadAndGetUrl(storagePath: string, file: Blob | File): Promise<string> {
    await this.upload(storagePath, file)
    return this.getUrl(storagePath)
  }

  // ══════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ══════════════════════════════════════════════════════════════════

  /**
   * Constrói QueryConstraints a partir das QueryOptions.
   * Mantém o SDK do Firestore completamente encapsulado.
   */
  private buildQueryConstraints(options: QueryOptions): QueryConstraint[] {
    const constraints: QueryConstraint[] = []

    if (options.filters && options.filters.length > 0) {
      for (const filter of options.filters) {
        constraints.push(where(filter.field, filter.operator, filter.value))
      }
    }

    if (options.orderByFields && options.orderByFields.length > 0) {
      for (const order of options.orderByFields) {
        constraints.push(orderBy(order.field, order.direction))
      }
    }

    if (options.startAfterDoc) {
      constraints.push(startAfter(options.startAfterDoc))
    }

    if (options.limitTo && options.limitTo > 0) {
      constraints.push(limit(options.limitTo))
    }

    return constraints
  }

  /**
   * Normaliza qualquer erro do Firebase para ApiError.
   * Garante que os services sempre recebam code + message amigável.
   */
  private buildApiError(err: unknown): ApiError {
    if (this.isFirebaseError(err)) {
      return {
        code:    err.code,
        message: this.getFriendlyMessage(err.code),
        raw:     err,
      }
    }
    return {
      code:    'unknown',
      message: 'Ocorreu um erro inesperado. Tente novamente.',
      raw:     err,
    }
  }

  /**
   * Type guard para erros do Firebase.
   */
  private isFirebaseError(err: unknown): err is { code: string; message: string } {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      typeof (err as Record<string, unknown>)['code'] === 'string'
    )
  }

  /**
   * Mensagens amigáveis em PT-BR para os erros mais comuns do Firebase.
   */
  private getFriendlyMessage(code: string): string {
    const messages: Record<string, string> = {
      // Auth
      'auth/user-not-found':         'Usuário não encontrado.',
      'auth/wrong-password':         'Senha incorreta.',
      'auth/invalid-email':          'E-mail inválido.',
      'auth/user-disabled':          'Conta desativada. Entre em contato com o suporte.',
      'auth/too-many-requests':      'Muitas tentativas. Aguarde alguns minutos.',
      'auth/network-request-failed': 'Sem conexão com a internet.',
      'auth/email-already-in-use':   'Este e-mail já está cadastrado.',
      'auth/weak-password':          'A senha deve ter no mínimo 6 caracteres.',
      'auth/invalid-credential':     'Credenciais inválidas. Verifique e-mail e senha.',
      'auth/operation-not-allowed':  'Operação não permitida.',
      'auth/requires-recent-login':  'Por segurança, faça login novamente para continuar.',
      // Firestore
      'not-found':                   'Registro não encontrado.',
      'permission-denied':           'Você não tem permissão para acessar este recurso.',
      'unavailable':                 'Serviço temporariamente indisponível. Tente novamente.',
      'deadline-exceeded':           'A requisição demorou demais. Verifique sua conexão.',
      'already-exists':              'Este registro já existe.',
      'resource-exhausted':          'Limite de requisições atingido. Aguarde um momento.',
      'cancelled':                   'Operação cancelada.',
      'data-loss':                   'Erro ao processar os dados. Tente novamente.',
      'unauthenticated':             'Sua sessão expirou. Faça login novamente.',
      // Storage
      'storage/object-not-found':    'Arquivo não encontrado.',
      'storage/unauthorized':        'Sem permissão para acessar este arquivo.',
      'storage/canceled':            'Upload cancelado.',
      'storage/unknown':             'Erro ao fazer upload. Tente novamente.',
      'storage/quota-exceeded':      'Limite de armazenamento atingido.',
      // Genérico
      'unknown':                     'Ocorreu um erro inesperado. Tente novamente.',
    }
    return messages[code] ?? `Erro: ${code}`
  }
}
