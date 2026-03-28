// ─────────────────────────────────────────────────────────────────
// app.routes.ts
// ─────────────────────────────────────────────────────────────────
import { Routes }      from '@angular/router'
import { publicGuard } from './core/guards/public.guard'
import { authGuard }   from '@core/guards/auth-guard'

export const routes: Routes = [

  // ── Redirect raiz ────────────────────────────────────────────────
  {
    path:       '',
    redirectTo: 'login',
    pathMatch:  'full',
  },

  // ── Área pública ─────────────────────────────────────────────────
  {
    path:          'login',
    canActivate:   [publicGuard],
    loadComponent: () =>
      import('./features/auth/login/login.page').then(m => m.LoginPage),
  },
  {
    path:          'register',
    canActivate:   [publicGuard],
    loadComponent: () =>
      import('./features/auth/register/register.page').then(m => m.RegisterPage),
  },
  {
    path:          'forgot-password',
    canActivate:   [publicGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage),
  },

  // ── Área privada ─────────────────────────────────────────────────
  {
    path:          'home',
    canActivate:   [authGuard],
    loadComponent: () =>
      import('./home/home.page').then(m => m.HomePage),
  },

  // ── Fallback ─────────────────────────────────────────────────────
  {
    path:       '**',
    redirectTo: 'login',
  },
]
