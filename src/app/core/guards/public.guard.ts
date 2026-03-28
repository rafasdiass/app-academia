// ─────────────────────────────────────────────────────────────────
// public.guard.ts
// Guard de rota pública — bloqueia acesso de usuários já logados.
//
// Comportamento:
//   - Aguarda Firebase resolver o estado inicial (waitUntilReady)
//   - Usuário NÃO autenticado → permite navegação (retorna true)
//   - Usuário autenticado     → redireciona para /home (retorna UrlTree)
//
// Aplicado em: /login, /register, /forgot-password.
//
// Por que isso é necessário?
//   Evita que usuário logado acesse /login e veja a tela de auth.
//   Sem este guard, digitar /login na barra exibiria o formulário
//   mesmo com sessão ativa.
// ─────────────────────────────────────────────────────────────────
import { inject }                from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AuthService }           from '@core/services/auth.service'

export const publicGuard: CanActivateFn = async () => {
  const auth   = inject(AuthService)
  const router = inject(Router)

  const isLoggedIn = await auth.waitUntilReady()

  if (!isLoggedIn) {
    return true
  }

  // Usuário já autenticado — envia direto para o dashboard
  return router.createUrlTree(['/home'])
}
