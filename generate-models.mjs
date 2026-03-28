// ═══════════════════════════════════════════════════════════════════
//  FitTracker — Gerador de Models
//  Execute: node generate-models.mjs
//  Cria todos os arquivos em src/app/core/models/
// ═══════════════════════════════════════════════════════════════════

import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const BASE_PATH = join('src', 'app', 'core', 'models')

// ── Garante que a pasta existe ──────────────────────────────────────
if (!existsSync(BASE_PATH)) {
  mkdirSync(BASE_PATH, { recursive: true })
  console.log(`📁 Pasta criada: ${BASE_PATH}`)
} else {
  console.log(`📁 Pasta já existe: ${BASE_PATH}`)
}

// ── Definição dos arquivos ──────────────────────────────────────────
const files = {

  // ── 1. BASE — tipos primitivos compartilhados ─────────────────────
  'base.model.ts': `// ─────────────────────────────────────────────────────────────────
// base.model.ts
// Tipos primitivos reutilizados por 2 ou mais models.
// Nenhum import externo — zero dependências circulares.
// ─────────────────────────────────────────────────────────────────

/**
 * Tipo de treino (bloco do plano).
 * Usado em WorkoutPlan e Session.
 */
export type TreinoType = 'A' | 'B' | 'C' | 'D'

/**
 * Paleta de cores disponível para temas de treino e protocolos.
 * Usado em TreinoBlock, ExerciseTemplate e pipes de cor.
 */
export type ColorTheme =
  | 'rose'
  | 'teal'
  | 'blue'
  | 'orange'
  | 'purple'
  | 'amber'
  | 'green'
`,

  // ── 2. USER ───────────────────────────────────────────────────────
  'user.model.ts': `// ─────────────────────────────────────────────────────────────────
// user.model.ts
// Entidades de autenticação e perfil do usuário.
// ─────────────────────────────────────────────────────────────────
// Sem imports de outros models — entidade independente.

/**
 * Papéis possíveis de um usuário no sistema.
 */
export type UserRole = 'admin' | 'athlete'

/**
 * Perfil persistido no Firestore em: users/{uid}
 */
export interface UserProfile {
  uid:         string
  email:       string
  displayName: string
  role:        UserRole
  /** ID do plano de treino vinculado ao atleta */
  planId:      string
  /** Data de criação da conta — formato ISO 8601 */
  createdAt:   string
}

/**
 * Payload usado no fluxo de login.
 * Nunca persiste senha — apenas trafega para ApiService.signIn().
 */
export interface AuthCredentials {
  email:    string
  password: string
}
`,

  // ── 3. EXERCISE ───────────────────────────────────────────────────
  'exercise.model.ts': `// ─────────────────────────────────────────────────────────────────
// exercise.model.ts
// Entidades de exercício e protocolo de treino.
// ─────────────────────────────────────────────────────────────────
import { ColorTheme } from './base.model'

/**
 * Protocolo de execução do exercício.
 * Determina o estilo visual do badge e a lógica de séries.
 *
 * RPT      — Reverse Pyramid Training (carga decresce por série)
 * MYO      — Myo-reps (top set + mini-séries de ativação)
 * STRAIGHT — Séries retas com mesma carga
 * PAUSE    — Pausa isométrica no ponto de maior tensão
 * RPT_HALF — RPT com metade das séries (versão reduzida)
 */
export type Protocol = 'RPT' | 'MYO' | 'STRAIGHT' | 'PAUSE' | 'RPT_HALF'

/**
 * Alerta de restrição corporal exibido no header do treino.
 */
export type BodyFlag = 'JOELHO' | 'LOMBAR' | '90° MÁX'

/**
 * Template de exercício como definido no plano.
 * Representa a prescrição, não a execução (ver ExerciseLog em session.model.ts).
 */
export interface ExerciseTemplate {
  id:          string
  name:        string
  /** Grupo muscular primário treinado */
  muscle:      string
  /** Cor do tema para renderização visual */
  color:       ColorTheme
  protocol:    Protocol
  /** Restrição corporal associada, se houver */
  flag:        BodyFlag | null
  sets:        SetTemplate[]
  /** Nota científica opcional exibida no card expandido */
  scienceNote: string | null
}

// Importação circular prevenida: SetTemplate é definido aqui
// para ser importado por set.model.ts sem criar ciclo.
// set.model.ts importa ExerciseTemplate, não o contrário.

/**
 * Template de série como prescrito no plano.
 * Representa a prescrição, não a execução (ver SetLog em set.model.ts).
 */
export interface SetTemplate {
  index:    number
  label:    SetLabelType
  /** Referência de carga: "~75% 1RM" | "−10%" | "PC" | null */
  loadPct:  string | null
  /** Faixa de repetições: "6-8" | "8-10" | "falha" */
  reps:     string
  /** Instrução de isometria, se aplicável */
  isoNote:  string | null
  /** Tempo de descanso em segundos */
  restSec:  number
  /** Nota descritiva do descanso (ex: "5 respirações") */
  restNote: string | null
}

/**
 * Rótulo visual de cada série dentro de um exercício.
 * Determina o estilo visual via SetVisualStylePipe → SetRules.getVisualStyle().
 */
export type SetLabelType =
  | 'TOP SET'
  | 'SÉRIE 1'
  | 'SÉRIE 2'
  | 'SÉRIE 3'
  | 'ATIVAÇÃO'
  | 'MINI ×1'
  | 'MINI ×2'
  | 'MINI ×3'
  | 'MINI ×4'
  | 'RODADA 2'
  | 'AQUEC. A'
  | 'AQUEC. B'

/**
 * Estilo visual aplicado ao SetRowComponent via [ngClass].
 * Calculado por SetRules.getVisualStyle(label).
 */
export type SetVisualStyle =
  | 'top-set'    // destaque — borda grossa com cor do treino
  | 'activation' // borda roxa — início de bloco Myo
  | 'mini'       // indent + fundo suave
  | 'warmup'     // opacidade reduzida, tamanho menor
  | 'default'    // séries retas comuns
`,

  // ── 4. WORKOUT-PLAN ───────────────────────────────────────────────
  'workout-plan.model.ts': `// ─────────────────────────────────────────────────────────────────
// workout-plan.model.ts
// Entidades do plano de treino e seus blocos.
// ─────────────────────────────────────────────────────────────────
import { TreinoType, ColorTheme } from './base.model'
import { ExerciseTemplate }       from './exercise.model'

/**
 * Plano de treino completo do atleta.
 * Persistido no Firestore em: workoutPlans/{id}
 */
export interface WorkoutPlan {
  id:            string
  name:          string
  /** Duração total do plano em semanas */
  durationWeeks: number
  /** UID do admin que criou o plano */
  createdBy:     string
  /** Lista de blocos de treino (A, B, C, D…) */
  treinos:       TreinoBlock[]
}

/**
 * Bloco de treino correspondente a um dia (ex: Treino A, Treino B).
 * Contém exercícios prescritos e instruções de aquecimento.
 */
export interface TreinoBlock {
  type:      TreinoType
  title:     string
  subtitle:  string
  color:     ColorTheme
  /** Instruções de aquecimento como strings descritivas */
  warmup:    string[]
  exercises: ExerciseTemplate[]
}
`,

  // ── 5. SET ────────────────────────────────────────────────────────
  'set.model.ts': `// ─────────────────────────────────────────────────────────────────
// set.model.ts
// Entidades de log de execução de série (Fase 2).
// ─────────────────────────────────────────────────────────────────
import { SetLabelType } from './exercise.model'

/**
 * Log de execução de uma série durante uma sessão de treino.
 * Representa o que o atleta realmente fez (vs SetTemplate = prescrição).
 * Fase 2: persistido dentro de ExerciseLog em sessions/{id}.
 */
export interface SetLog {
  index:        number
  label:        SetLabelType
  /** Carga utilizada em kg. null se não registrado */
  loadKg:       number | null
  /** Repetições realizadas. null se não registrado */
  repsDone:     number | null
  /** Duração da isometria em segundos. null se não aplicável */
  isoSeconds:   number | null
  /** Descanso efetivamente tomado em segundos. null se não registrado */
  restTakenSec: number | null
  completed:    boolean
  notes:        string
}
`,

  // ── 6. SESSION ────────────────────────────────────────────────────
  'session.model.ts': `// ─────────────────────────────────────────────────────────────────
// session.model.ts
// Entidades de sessão de treino executada (Fase 2).
// Também inclui logs de hidratação e nutrição.
// ─────────────────────────────────────────────────────────────────
import { TreinoType } from './base.model'
import { SetLog }     from './set.model'

/**
 * Sessão de treino executada pelo atleta.
 * Persistida no Firestore em: sessions/{id}
 * Fase 2 — estrutura definida agora para guiar o desenvolvimento.
 */
export interface Session {
  /** null enquanto não persistida (novo registro em memória) */
  id:          string | null
  userId:      string
  planId:      string
  /** Data do treino — formato 'YYYY-MM-DD' */
  date:        string
  treinoType:  TreinoType
  completed:   boolean
  /** Duração total em minutos. null se sessão inacabada */
  durationMin: number | null
  /** ISO 8601. null se não iniciada */
  startedAt:   string | null
  /** ISO 8601. null se não finalizada */
  finishedAt:  string | null
  notes:       string
  exercises:   ExerciseLog[]
  warmup:      WarmupLog[]
}

/**
 * Log de um exercício dentro de uma sessão.
 * Agrupa todas as séries executadas daquele exercício.
 */
export interface ExerciseLog {
  exerciseId:   string
  exerciseName: string
  completed:    boolean
  sets:         SetLog[]
}

/**
 * Log de um item de aquecimento dentro de uma sessão.
 */
export interface WarmupLog {
  index:     number
  label:     string
  completed: boolean
}

/**
 * Log de hidratação diária do atleta.
 * Fase 2 — persistido em: hydration/{userId}_{date}
 */
export interface HydrationLog {
  userId:     string
  /** Formato 'YYYY-MM-DD' */
  date:       string
  cupsFilled: number
  totalMl:    number
}

/**
 * Log de nutrição diária do atleta.
 * Fase 2 — persistido em: nutrition/{userId}_{date}
 */
export interface NutritionLog {
  userId: string
  /** Formato 'YYYY-MM-DD' */
  date:   string
  items:  NutritionItem[]
}

/**
 * Item individual de checklist nutricional.
 */
export interface NutritionItem {
  key:       string
  label:     string
  sub:       string
  completed: boolean
}
`,

  // ── 7. INDEX (barrel) ─────────────────────────────────────────────
  'index.ts': `// ─────────────────────────────────────────────────────────────────
// index.ts — Barrel export dos models
// Permite import limpo: import { WorkoutPlan } from '@core/models'
// ─────────────────────────────────────────────────────────────────
export * from './base.model'
export * from './user.model'
export * from './exercise.model'
export * from './workout-plan.model'
export * from './set.model'
export * from './session.model'
`,
}

// ── Escreve os arquivos ─────────────────────────────────────────────
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

// ── Resumo ──────────────────────────────────────────────────────────
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Criados : ${created}
  ⚠️  Pulados : ${skipped}
  📁 Local   : ${BASE_PATH}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Próximos passos:
  1. Configurar path alias em tsconfig.json:
     "@core/models": ["src/app/core/models/index.ts"]

  2. Rodar: npx tsc --noEmit
     (verifica tipos sem gerar build)

  3. Próxima camada: core/rules/
`)
