// ─────────────────────────────────────────────────────────────────
// app.config.ts
// Ponto central de configuração da aplicação.
// Angular 20 standalone — sem AppModule.
//
// Providers registrados:
//   - Router + IonicRouteStrategy  → navegação e UI nativa
//   - HttpClient                   → seed local JSON (Fase 1)
//   - Firebase Auth                → autenticação
//   - Firestore                    → banco de dados
//   - Firebase Storage             → upload de arquivos
// ─────────────────────────────────────────────────────────────────
import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core'

import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router'

import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http'

// Ionic
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone'

// Firebase core
import { initializeApp }      from 'firebase/app'
import { provideFirebaseApp } from '@angular/fire/app'

// Firebase Auth
import {
  provideAuth,
  getAuth,
} from '@angular/fire/auth'

// Firestore
import {
  provideFirestore,
  getFirestore,
} from '@angular/fire/firestore'

// Firebase Storage
import {
  provideStorage,
  getStorage,
} from '@angular/fire/storage'

// Environment — troca automaticamente dev/prod no build
import { environment } from '@env/environment'

// Rotas
import { routes } from './app.routes'

// ─────────────────────────────────────────────────────────────────

export const appConfig: ApplicationConfig = {
  providers: [

    // ── Zone.js — detecção de mudança otimizada ──────────────────
    provideZoneChangeDetection({ eventCoalescing: true }),

    // ── Ionic — estratégia de reutilização de rotas ──────────────
    // IonicRouteStrategy mantém o estado das páginas ao navegar
    // Equivalente ao { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
    // que estava no main.ts original
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // ── Roteamento ───────────────────────────────────────────────
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
    ),

    // ── Ionic 8 ──────────────────────────────────────────────────
    provideIonicAngular({
      mode:                      'ios', // 'ios' | 'md' — força padrão visual único
      animated:                  true,
      backButtonText:            '',    // remove texto do botão voltar no iOS
      innerHTMLTemplatesEnabled: true,
    }),

    // ── HttpClient — seed local (Fase 1) ─────────────────────────
    // Usado pelo WorkoutPlanService.getPlanFromSeed()
    // Permanece após Fase 2 para outros recursos HTTP se necessário
    provideHttpClient(
      withInterceptorsFromDi(),
    ),

    // ── Firebase App — inicialização central ─────────────────────
    // Todas as credenciais vêm do environment — nunca hardcoded aqui
    provideFirebaseApp(() => initializeApp(environment.firebase)),

    // ── Firebase Auth ─────────────────────────────────────────────
    // Consumido exclusivamente pelo ApiService
    provideAuth(() => getAuth()),

    // ── Firestore ─────────────────────────────────────────────────
    // Consumido exclusivamente pelo ApiService
    provideFirestore(() => getFirestore()),

    // ── Firebase Storage ──────────────────────────────────────────
    // Consumido exclusivamente pelo ApiService
    provideStorage(() => getStorage()),

  ],
}
