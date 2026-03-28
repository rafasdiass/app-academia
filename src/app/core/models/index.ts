// ─────────────────────────────────────────────────────────────────
// index.ts — Barrel export dos models
// Permite import limpo: import { WorkoutPlan } from '@core/models'
//
// IMPORTANTE: todos os arquivos abaixo devem estar na MESMA pasta
// que este index.ts para os paths relativos './xxx' resolverem.
// Estrutura esperada:
//   src/app/core/models/
//     index.ts              ← este arquivo
//     base.model.ts
//     user.model.ts
//     exercise.model.ts
//     workout-plan.model.ts
//     set.model.ts
//     session.model.ts
// ─────────────────────────────────────────────────────────────────
export * from './base.model'
export * from './user.model'
export * from './exercise.model'
export * from './workout-plan.model'
export * from './set.model'
export * from './session.model'
