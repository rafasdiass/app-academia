// ─────────────────────────────────────────────────────────────────
// auth.guard.ts
// Guard de rota privada — bloqueia acesso sem autenticação.
//
// Comportamento:
//   - Aguarda Firebase resolver o estado inicial (waitUntilReady)
//   - Usuário autenticado  → permite navegação (retorna true)
//   - Usuário não autenticado → redireciona para /login (retorna UrlTree)
//
// Aplicado em: /home, /treino-detail e qualquer rota privada futura.
//
// Por que waitUntilReady()?
//   No refresh do app, o Firebase leva ~200ms para restaurar a sessão
//   persistida. Sem aguardar, o BehaviorSubject começa com null e o
//   guard redirecionaria usuários autenticados para /login.
// ─────────────────────────────────────────────────────────────────
import { inject }               from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AuthService }           from '@core/services/auth.service'

export const authGuard: CanActivateFn = async () => {
  const auth   = inject(AuthService)
  const router = inject(Router)

  const isLoggedIn = await auth.waitUntilReady()

  if (isLoggedIn) {
    return true
  }

  // Redireciona para /login preservando a URL tentada como queryParam
  // para que após o login o usuário seja enviado de volta ao destino
  return router.createUrlTree(['/login'])
}
