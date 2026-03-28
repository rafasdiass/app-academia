// ─────────────────────────────────────────────────────────────────
// loading.service.ts
// Responsabilidade única: estado global de carregamento da UI.
//
// O que faz:
//   - Expõe isLoading$ para o LoadingSpinnerComponent
//   - show() e hide() com contador aninhado (suporta calls paralelos)
//   - wrap() para encapsular qualquer Promise com loading automático
//   - reset() para casos de erro global
//
// O que NÃO faz:
//   - Não conhece ApiService
//   - Não conhece Firebase
//   - Não tem lógica de negócio — estado puro de UI
// ─────────────────────────────────────────────────────────────────
import { Injectable }   from '@angular/core'
import {
  BehaviorSubject,
  Observable,
}                       from 'rxjs'
import {
  map,
  distinctUntilChanged,
}                       from 'rxjs/operators'

// ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class LoadingService {

  // ── Estado interno ───────────────────────────────────────────────
  // Contador em vez de boolean — suporta chamadas aninhadas.
  // Dois requests paralelos: show() × 2 → hide() × 2 → spinner some.
  // O spinner só some quando o contador chega a zero.
  private readonly _counter$ = new BehaviorSubject<number>(0)

  // ── Stream público ───────────────────────────────────────────────

  /**
   * Stream booleano do estado de carregamento.
   * true  quando há pelo menos uma operação em andamento.
   * false quando todas as operações terminaram.
   * Emite apenas quando o valor muda — evita renders desnecessários.
   *
   * Consumido pelo LoadingSpinnerComponent:
   *   *ngIf="loadingService.isLoading$ | async"
   */
  readonly isLoading$: Observable<boolean> = this._counter$.pipe(
    map(count => count > 0),
    distinctUntilChanged(),
  )

  // ── Getter síncrono ──────────────────────────────────────────────

  /**
   * Snapshot síncrono do estado de carregamento.
   * Prefira isLoading$ para reatividade no template.
   */
  get isLoading(): boolean {
    return this._counter$.getValue() > 0
  }

  // ── Controle ─────────────────────────────────────────────────────

  /**
   * Inicia o estado de carregamento.
   * Incrementa o contador interno.
   * Seguro de chamar múltiplas vezes em paralelo.
   */
  show(): void {
    this._counter$.next(this._counter$.getValue() + 1)
  }

  /**
   * Encerra uma operação de carregamento.
   * Decrementa o contador interno.
   * O spinner só some quando o contador chega a zero.
   * Chamadas extras além do necessário são ignoradas — floor: 0.
   */
  hide(): void {
    const next = Math.max(0, this._counter$.getValue() - 1)
    this._counter$.next(next)
  }

  /**
   * Encapsula uma Promise com loading automático.
   * show() antes de executar, hide() no finally — sucesso ou erro.
   * Elimina o padrão try/finally manual nos services e pages.
   *
   * @param fn  Função que retorna uma Promise<T>
   * @returns   Promise<T> com o resultado da função
   *
   * Uso em uma page:
   *   await this.loading.wrap(() => this.authService.login(credentials))
   *
   * Uso em um service:
   *   return this.loading.wrap(() =>
   *     this.api.get<WorkoutPlan>('workoutPlans/abc').toPromise()
   *   )
   */
  async wrap<T>(fn: () => Promise<T>): Promise<T> {
    this.show()
    try {
      return await fn()
    } finally {
      this.hide()
    }
  }

  /**
   * Reseta o contador para zero imediatamente.
   * Útil em casos de erro global onde hide() pode não ter sido chamado.
   * Prefira wrap() para garantia automática no fluxo normal.
   */
  reset(): void {
    this._counter$.next(0)
  }
}
