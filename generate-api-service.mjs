// ═══════════════════════════════════════════════════════════════════
//  FitTracker — Gerador do ApiService
//  Execute: node generate-api-service.mjs
//  Cria src/app/core/api/api.service.ts
// ═══════════════════════════════════════════════════════════════════

import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const BASE_PATH = join('src', 'app', 'core', 'api')

if (!existsSync(BASE_PATH)) {
  mkdirSync(BASE_PATH, { recursive: true })
  console.log(`📁 Pasta criada: ${BASE_PATH}`)
} else {
  console.log(`📁 Pasta já existe: ${BASE_PATH}`)
}

// ════════════════════════════════════════════════════════════════════
const files = {

// ────────────────────────────────────────────────────────────────────
// api.service.ts
// ────────────────────────────────────────────────────────────────────
'api.service.ts': `// ─────────────────────────────────────────────────────────────────
// api.service.ts
// ÚNICO arquivo do projeto que importa Firebase.
// Nenhum outro service, component ou rule importa Firebase diretamente.
//
// Responsabilidades:
//   - Auth: signIn, signOut, onAuthStateChanged
//   - Firestore: getDocument, getCollection, setDocument,
//                updateDocument, deleteDocument, queryCollection
//   - Storage:   uploadFile, getDownloadUrl, deleteFile
//
// Todos os métodos são genéricos (<T>) — ApiService não conhece
// WorkoutPlan, Session, UserProfile etc. O caller define o tipo.
// ─────────────────────────────────────────────────────────────────
import { Injectable }                        from '@angular/core'
import { Observable, from, throwError }      from 'rxjs'
import { catchError, map }                   from 'rxjs/operators'

// Firebase Auth
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User               as FirebaseUser,
  UserCredential,
  AuthError,
}                                            from '@angular/fire/auth'

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
  DocumentSnapshot,
  QueryConstraint,
  WithFieldValue,
  UpdateData,
  DocumentReference,
  CollectionReference,
  Query,
}                                            from '@angular/fire/firestore'

// Storage
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  UploadResult,
}                                            from '@angular/fire/storage'

// Models — apenas os tipos de Auth são necessários aqui
// ApiService não conhece as outras entidades do domínio
import { AuthCredentials }                   from '@core/models'

// ── Tipos auxiliares do ApiService ──────────────────────────────────

/**
 * Opções de filtro para queryCollection.
 * Permite construir queries sem expor o SDK do Firestore fora deste arquivo.
 */
export interface QueryFilter {
  field:    string
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'not-in'
  value:    unknown
}

/**
 * Opções de ordenação para queryCollection.
 */
export interface QueryOrder {
  field:     string
  direction: 'asc' | 'desc'
}

/**
 * Opções completas para queryCollection.
 * Combina filtros, ordenação e paginação.
 */
export interface QueryOptions {
  filters?:       QueryFilter[]
  orderByFields?: QueryOrder[]
  limitTo?:       number
  startAfterDoc?: DocumentSnapshot<unknown>
}

/**
 * Resultado paginado de queryCollection.
 */
export interface PaginatedResult<T> {
  items:       T[]
  lastDoc:     DocumentSnapshot<unknown> | null
  hasMore:     boolean
}

/**
 * Erro tipado retornado pelo ApiService.
 * Encapsula erros do Firebase com código e mensagem legível.
 */
export interface ApiError {
  code:    string
  message: string
  raw:     unknown
}

// ────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ApiService {

  constructor(
    private readonly auth:     Auth,
    private readonly firestore: Firestore,
    private readonly storage:  Storage,
  ) {}

  // ══════════════════════════════════════════════════════════════════
  // AUTH
  // ══════════════════════════════════════════════════════════════════

  /**
   * Autentica o usuário com email e senha.
   * Retorna Promise<UserCredential> — o caller (AuthService) extrai o uid.
   * Lança ApiError em caso de falha — nunca swallowa erros.
   */
  signIn(credentials: AuthCredentials): Promise<UserCredential> {
    return signInWithEmailAndPassword(
      this.auth,
      credentials.email,
      credentials.password,
    ).catch((err: AuthError) => {
      throw this.buildApiError(err)
    })
  }

  /**
   * Encerra a sessão do usuário autenticado.
   */
  signOut(): Promise<void> {
    return signOut(this.auth).catch((err: AuthError) => {
      throw this.buildApiError(err)
    })
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
      // Cleanup ao destruir o observable
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
  // FIRESTORE — LEITURA
  // ══════════════════════════════════════════════════════════════════

  /**
   * Stream reativo de um documento único.
   * Atualiza automaticamente quando o documento muda no Firestore.
   *
   * @param path  Caminho do documento: 'users/uid123' | 'workoutPlans/plan456'
   * @returns     Observable<T> — emite sempre que o documento é alterado
   *
   * Uso pelo caller (service):
   *   this.apiService.getDocument<UserProfile>('users/uid123')
   */
  getDocument<T>(path: string): Observable<T> {
    const docRef = doc(this.firestore, path) as DocumentReference<T>
    return docData<T>(docRef, { idField: 'id' } as object).pipe(
      map(data => {
        if (data === undefined) {
          throw this.buildApiError({
            code:    'not-found',
            message: \`Documento não encontrado: \${path}\`,
          })
        }
        return data
      }),
      catchError(err => throwError(() => this.buildApiError(err))),
    )
  }

  /**
   * Stream reativo de uma coleção completa.
   * Atualiza automaticamente quando qualquer documento é alterado.
   *
   * @param path  Caminho da coleção: 'sessions' | 'workoutPlans'
   * @returns     Observable<T[]>
   *
   * Uso pelo caller:
   *   this.apiService.getCollection<Session>('sessions')
   */
  getCollection<T>(path: string): Observable<T[]> {
    const colRef = collection(this.firestore, path) as CollectionReference<T>
    return collectionData<T>(colRef, { idField: 'id' } as object).pipe(
      catchError(err => throwError(() => this.buildApiError(err))),
    )
  }

  /**
   * Query com filtros, ordenação e paginação.
   * Permite buscas complexas sem expor o SDK do Firestore ao caller.
   *
   * @param path     Caminho da coleção
   * @param options  Filtros, ordenação, limite e cursor de paginação
   * @returns        Observable<T[]>
   *
   * Uso pelo caller:
   *   this.apiService.queryCollection<Session>('sessions', {
   *     filters:       [{ field: 'userId', operator: '==', value: uid }],
   *     orderByFields: [{ field: 'date', direction: 'desc' }],
   *     limitTo:       20,
   *   })
   */
  queryCollection<T>(path: string, options: QueryOptions = {}): Observable<T[]> {
    const colRef     = collection(this.firestore, path) as CollectionReference<T>
    const constraints = this.buildQueryConstraints(options)
    const q          = query(colRef, ...constraints) as Query<T>

    return collectionData<T>(q, { idField: 'id' } as object).pipe(
      catchError(err => throwError(() => this.buildApiError(err))),
    )
  }

  /**
   * Query paginada — retorna também o último documento para cursor.
   * Útil para listas com "carregar mais".
   *
   * @param path     Caminho da coleção
   * @param options  Deve incluir limitTo para paginação funcionar
   * @returns        Observable<PaginatedResult<T>>
   */
  queryCollectionPaginated<T>(
    path: string,
    options: QueryOptions = {},
  ): Observable<PaginatedResult<T>> {
    const colRef      = collection(this.firestore, path) as CollectionReference<T>
    const constraints = this.buildQueryConstraints(options)
    const q           = query(colRef, ...constraints) as Query<T>

    return collectionData<T>(q, { idField: 'id' } as object).pipe(
      map(items => ({
        items,
        lastDoc:  null, // Fase 2: implementar com getDocs para cursor real
        hasMore:  items.length === (options.limitTo ?? items.length),
      })),
      catchError(err => throwError(() => this.buildApiError(err))),
    )
  }

  /**
   * Query em collection group — busca em subcoleções de mesmo nome.
   * Ex: buscar todos os 'sets' de todos os exercícios de um usuário.
   *
   * @param collectionId  Nome da subcoleção (ex: 'sets', 'exercises')
   * @param options       Filtros e ordenação
   * @returns             Observable<T[]>
   */
  queryCollectionGroup<T>(
    collectionId: string,
    options: QueryOptions = {},
  ): Observable<T[]> {
    const groupRef    = collectionGroup(this.firestore, collectionId)
    const constraints = this.buildQueryConstraints(options)
    const q           = query(groupRef, ...constraints)

    return collectionData(q, { idField: 'id' } as object).pipe(
      map(items => items as T[]),
      catchError(err => throwError(() => this.buildApiError(err))),
    )
  }

  // ══════════════════════════════════════════════════════════════════
  // FIRESTORE — ESCRITA
  // ══════════════════════════════════════════════════════════════════

  /**
   * Cria ou sobrescreve um documento com ID definido pelo caller.
   * Se o documento existir, substitui completamente (não faz merge).
   *
   * @param path  Caminho completo: 'users/uid123'
   * @param data  Dados a persistir — tipado por T, zero any
   *
   * Uso pelo caller:
   *   this.apiService.setDocument<UserProfile>('users/uid123', profile)
   */
  setDocument<T>(path: string, data: WithFieldValue<T>): Promise<void> {
    const docRef = doc(this.firestore, path) as DocumentReference<T>
    return setDoc(docRef, data).catch(err => {
      throw this.buildApiError(err)
    })
  }

  /**
   * Atualiza campos específicos de um documento existente.
   * Não sobrescreve campos não mencionados (merge parcial).
   *
   * @param path  Caminho do documento
   * @param data  Campos a atualizar — Partial<T> via UpdateData<T>
   *
   * Uso pelo caller:
   *   this.apiService.updateDocument<Session>(
   *     'sessions/abc',
   *     { completed: true, finishedAt: new Date().toISOString() }
   *   )
   */
  updateDocument<T>(path: string, data: UpdateData<T>): Promise<void> {
    const docRef = doc(this.firestore, path) as DocumentReference<T>
    return updateDoc(docRef, data).catch(err => {
      throw this.buildApiError(err)
    })
  }

  /**
   * Adiciona um documento com ID gerado automaticamente pelo Firestore.
   * Retorna a referência do documento criado (contém o ID gerado).
   *
   * @param path  Caminho da coleção: 'sessions'
   * @param data  Dados a persistir
   * @returns     Promise<DocumentReference<T>> — use .id para obter o ID
   *
   * Uso pelo caller:
   *   const ref = await this.apiService.addDocument<Session>('sessions', session)
   *   const id  = ref.id
   */
  addDocument<T>(
    path: string,
    data: WithFieldValue<T>,
  ): Promise<DocumentReference<T>> {
    const colRef = collection(this.firestore, path) as CollectionReference<T>
    return addDoc(colRef, data).catch(err => {
      throw this.buildApiError(err)
    })
  }

  /**
   * Remove um documento do Firestore permanentemente.
   *
   * @param path  Caminho completo do documento: 'sessions/abc123'
   */
  deleteDocument(path: string): Promise<void> {
    const docRef = doc(this.firestore, path)
    return deleteDoc(docRef).catch(err => {
      throw this.buildApiError(err)
    })
  }

  // ══════════════════════════════════════════════════════════════════
  // FIREBASE STORAGE
  // ══════════════════════════════════════════════════════════════════

  /**
   * Faz upload de um arquivo para o Firebase Storage.
   * Retorna UploadResult com metadata do arquivo enviado.
   *
   * @param storagePath  Caminho no Storage: 'avatars/uid123.jpg'
   * @param file         Blob ou File a enviar
   * @returns            Promise<UploadResult>
   *
   * Uso pelo caller:
   *   await this.apiService.uploadFile('avatars/uid123.jpg', file)
   */
  uploadFile(storagePath: string, file: Blob | File): Promise<UploadResult> {
    const storageRef = ref(this.storage, storagePath)
    return uploadBytes(storageRef, file).catch(err => {
      throw this.buildApiError(err)
    })
  }

  /**
   * Retorna a URL pública de download de um arquivo no Storage.
   *
   * @param storagePath  Caminho no Storage: 'avatars/uid123.jpg'
   * @returns            Promise<string> — URL pública assinada
   */
  getDownloadUrl(storagePath: string): Promise<string> {
    const storageRef = ref(this.storage, storagePath)
    return getDownloadURL(storageRef).catch(err => {
      throw this.buildApiError(err)
    })
  }

  /**
   * Remove um arquivo do Firebase Storage permanentemente.
   *
   * @param storagePath  Caminho no Storage: 'avatars/uid123.jpg'
   */
  deleteFile(storagePath: string): Promise<void> {
    const storageRef = ref(this.storage, storagePath)
    return deleteObject(storageRef).catch(err => {
      throw this.buildApiError(err)
    })
  }

  /**
   * Faz upload e já retorna a URL pública em um único passo.
   * Conveniência para o caso mais comum (avatar, foto de progresso).
   *
   * @param storagePath  Caminho no Storage
   * @param file         Blob ou File
   * @returns            Promise<string> — URL pública
   */
  async uploadAndGetUrl(storagePath: string, file: Blob | File): Promise<string> {
    await this.uploadFile(storagePath, file)
    return this.getDownloadUrl(storagePath)
  }

  // ══════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ══════════════════════════════════════════════════════════════════

  /**
   * Constrói a lista de QueryConstraint a partir das QueryOptions.
   * Mantém o SDK do Firestore completamente encapsulado neste arquivo.
   */
  private buildQueryConstraints(options: QueryOptions): QueryConstraint[] {
    const constraints: QueryConstraint[] = []

    // Filtros where
    if (options.filters && options.filters.length > 0) {
      for (const filter of options.filters) {
        constraints.push(
          where(filter.field, filter.operator, filter.value),
        )
      }
    }

    // Ordenação
    if (options.orderByFields && options.orderByFields.length > 0) {
      for (const order of options.orderByFields) {
        constraints.push(orderBy(order.field, order.direction))
      }
    }

    // Paginação — cursor
    if (options.startAfterDoc) {
      constraints.push(startAfter(options.startAfterDoc))
    }

    // Limite
    if (options.limitTo && options.limitTo > 0) {
      constraints.push(limit(options.limitTo))
    }

    return constraints
  }

  /**
   * Normaliza qualquer erro do Firebase para ApiError.
   * Garante que o caller sempre receba um objeto com code + message.
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
   * Mensagens amigáveis para os erros mais comuns do Firebase Auth.
   * Evita expor mensagens técnicas do SDK ao usuário final.
   */
  private getFriendlyMessage(code: string): string {
    const messages: Record<string, string> = {
      // Auth
      'auth/user-not-found':        'Usuário não encontrado.',
      'auth/wrong-password':        'Senha incorreta.',
      'auth/invalid-email':         'E-mail inválido.',
      'auth/user-disabled':         'Conta desativada. Entre em contato com o suporte.',
      'auth/too-many-requests':     'Muitas tentativas. Aguarde alguns minutos.',
      'auth/network-request-failed':'Sem conexão com a internet.',
      'auth/email-already-in-use':  'Este e-mail já está cadastrado.',
      'auth/weak-password':         'A senha deve ter no mínimo 6 caracteres.',
      'auth/invalid-credential':    'Credenciais inválidas. Verifique e-mail e senha.',
      'auth/operation-not-allowed': 'Operação não permitida.',
      'auth/requires-recent-login': 'Por segurança, faça login novamente para continuar.',
      // Firestore
      'not-found':                  'Registro não encontrado.',
      'permission-denied':          'Você não tem permissão para acessar este recurso.',
      'unavailable':                'Serviço temporariamente indisponível. Tente novamente.',
      'deadline-exceeded':          'A requisição demorou demais. Verifique sua conexão.',
      'already-exists':             'Este registro já existe.',
      'resource-exhausted':         'Limite de requisições atingido. Aguarde um momento.',
      'cancelled':                  'Operação cancelada.',
      'data-loss':                  'Erro ao processar os dados. Tente novamente.',
      'unauthenticated':            'Sua sessão expirou. Faça login novamente.',
      // Storage
      'storage/object-not-found':   'Arquivo não encontrado.',
      'storage/unauthorized':       'Sem permissão para acessar este arquivo.',
      'storage/canceled':           'Upload cancelado.',
      'storage/unknown':            'Erro ao fazer upload. Tente novamente.',
      'storage/quota-exceeded':     'Limite de armazenamento atingido.',
      // Genérico
      'unknown':                    'Ocorreu um erro inesperado. Tente novamente.',
    }
    return messages[code] ?? \`Erro: \${code}\`
  }
}
`,

// ────────────────────────────────────────────────────────────────────
// index.ts (barrel — mantém padrão das outras camadas)
// ────────────────────────────────────────────────────────────────────
'index.ts': `// ─────────────────────────────────────────────────────────────────
// index.ts — Barrel export do api
// Permite import limpo: import { ApiService } from '@core/api'
// ─────────────────────────────────────────────────────────────────
export * from './api.service'
`,
}

// ════════════════════════════════════════════════════════════════════
// Escreve os arquivos
// ════════════════════════════════════════════════════════════════════
let created = 0
let skipped = 0

for (const [filename, content] of Object.entries(files)) {
  const filePath = join(BASE_PATH, filename)

  if (existsSync(filePath)) {
    console.log(`⚠️  Já existe (pulado): ${filePath}`)
    skipped++
    continue
  }

  writeFileSync(filePath, content, 'utf8')
  console.log(`✅ Criado: ${filePath}`)
  created++
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Criados : ${created}
  ⚠️  Pulados : ${skipped}
  📁 Local   : ${BASE_PATH}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Arquivos gerados:
  ├── api.service.ts   → único arquivo que importa Firebase
  └── index.ts         → barrel export

  Métodos disponíveis:
  │
  ├── AUTH
  │   ├── signIn(credentials)           → Promise<UserCredential>
  │   ├── signOut()                     → Promise<void>
  │   ├── onAuthStateChanged()          → Observable<FirebaseUser | null>
  │   └── getCurrentFirebaseUser()      → FirebaseUser | null
  │
  ├── FIRESTORE — LEITURA
  │   ├── getDocument<T>(path)          → Observable<T>
  │   ├── getCollection<T>(path)        → Observable<T[]>
  │   ├── queryCollection<T>(path, opts)→ Observable<T[]>
  │   ├── queryCollectionPaginated<T>() → Observable<PaginatedResult<T>>
  │   └── queryCollectionGroup<T>()     → Observable<T[]>
  │
  ├── FIRESTORE — ESCRITA
  │   ├── setDocument<T>(path, data)    → Promise<void>
  │   ├── updateDocument<T>(path, data) → Promise<void>
  │   ├── addDocument<T>(path, data)    → Promise<DocumentReference<T>>
  │   └── deleteDocument(path)          → Promise<void>
  │
  └── STORAGE
      ├── uploadFile(path, file)        → Promise<UploadResult>
      ├── getDownloadUrl(path)          → Promise<string>
      ├── deleteFile(path)              → Promise<void>
      └── uploadAndGetUrl(path, file)   → Promise<string>

  Próximos passos:
  1. npx tsc --noEmit   (verifica tipos)
  2. Próxima camada: core/services/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
