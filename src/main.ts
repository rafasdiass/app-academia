// ─────────────────────────────────────────────────────────────────
// main.ts
// Ponto de entrada da aplicação.
// Toda a configuração de providers foi movida para app.config.ts —
// este arquivo fica limpo e com responsabilidade única: bootstrap.
// ─────────────────────────────────────────────────────────────────
import { bootstrapApplication } from '@angular/platform-browser'

import { AppComponent } from './app/app.component'
import { appConfig }    from './app/app.config'

bootstrapApplication(AppComponent, appConfig)
  .catch((err: unknown) => console.error(err))
