// ─────────────────────────────────────────────────────────────────
// workout-plan.rules.ts
// Responsabilidade única: lógica de negócio do plano de treino.
//
// Todos os métodos são static e puros — sem side-effects.
// O WorkoutPlanService delega para cá; nenhuma outra camada conhece
// estas regras diretamente.
// ─────────────────────────────────────────────────────────────────
import {
  WorkoutPlan,
  TreinoBlock,
  TreinoType,
  BodyFlag,
  ExerciseTemplate,
} from '@core/models'

// ── Constantes ────────────────────────────────────────────────────

/** Tempo médio de execução de uma série em segundos (inclusão de micro-pausas) */
const SECONDS_PER_SET = 40

/** Overhead fixo de aquecimento acrescentado ao total (minutos) */
const WARMUP_OVERHEAD_MINUTES = 5

/** Descanso padrão em segundos quando SetTemplate.restSec for 0 */
const DEFAULT_REST_SECONDS = 90

export class WorkoutPlanRules {

  // ── getTreinoBlock ───────────────────────────────────────────────

  /**
   * Retorna o TreinoBlock pelo tipo (A, B, C, D).
   * Retorna null se o plano não contiver o tipo solicitado.
   *
   * @param plan  Plano de treino carregado
   * @param type  'A' | 'B' | 'C' | 'D'
   */
  static getTreinoBlock(
    plan: WorkoutPlan,
    type: TreinoType,
  ): TreinoBlock | null {
    return plan.treinos.find(t => t.type === type) ?? null
  }

  // ── getExerciseById ──────────────────────────────────────────────

  /**
   * Retorna o ExerciseTemplate pelo ID dentro de um bloco.
   * Retorna null se o exercício não for encontrado.
   *
   * @param block  TreinoBlock onde pesquisar
   * @param id     ID do exercício
   */
  static getExerciseById(
    block: TreinoBlock,
    id:    string,
  ): ExerciseTemplate | null {
    return block.exercises.find(e => e.id === id) ?? null
  }

  // ── collectBodyFlags ─────────────────────────────────────────────

  /**
   * Coleta todas as BodyFlags únicas dos exercícios de um bloco.
   * A ordem de inserção é preservada (primeira ocorrência vence).
   * Exercícios sem flag (null) são ignorados.
   *
   * @param block  TreinoBlock cujos exercícios serão inspecionados
   */
  static collectBodyFlags(block: TreinoBlock): BodyFlag[] {
    const seen = new Set<BodyFlag>()

    for (const exercise of block.exercises) {
      if (exercise.flag !== null) {
        seen.add(exercise.flag)
      }
    }

    return Array.from(seen)
  }

  // ── getWeekNumber ────────────────────────────────────────────────

  /**
   * Calcula a semana atual do plano (1-based).
   * Retorna null se a data atual estiver fora do intervalo do plano.
   *
   * Regras:
   *   - Semana 1 = dias 1–7 a partir de startDate (inclusive)
   *   - Retorna null se currentDate < startDate
   *   - Retorna null se currentDate > último dia do plano
   *
   * @param startDate     'YYYY-MM-DD' — primeiro dia do plano
   * @param currentDate   'YYYY-MM-DD' — data de referência
   * @param durationWeeks Duração total do plano em semanas
   */
  static getWeekNumber(
    startDate:     string,
    currentDate:   string,
    durationWeeks: number,
  ): number | null {
    const start   = new Date(startDate)
    const current = new Date(currentDate)

    const diffMs   = current.getTime() - start.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0)                  return null   // antes do início
    if (diffDays >= durationWeeks * 7) return null   // após o fim

    return Math.floor(diffDays / 7) + 1              // 1-based
  }

  // ── isDeloadWeek ─────────────────────────────────────────────────

  /**
   * Verifica se a semana atual é de deload.
   * Convenção: a última semana de cada bloco de 4 é deload
   * (semanas 4, 8, 12, 16 …).
   *
   * Retorna false se a data estiver fora do período do plano.
   *
   * @param startDate     'YYYY-MM-DD'
   * @param currentDate   'YYYY-MM-DD'
   * @param durationWeeks Duração total do plano em semanas
   */
  static isDeloadWeek(
    startDate:     string,
    currentDate:   string,
    durationWeeks: number,
  ): boolean {
    const week = WorkoutPlanRules.getWeekNumber(
      startDate,
      currentDate,
      durationWeeks,
    )

    if (week === null) return false

    return week % 4 === 0
  }

  // ── estimateDurationMinutes ──────────────────────────────────────

  /**
   * Estima a duração total do treino em minutos.
   *
   * Fórmula por série:
   *   SECONDS_PER_SET (execução) + SetTemplate.restSec (descanso)
   *   — a última série de cada exercício não computa descanso pós-série.
   *
   * Acrescenta WARMUP_OVERHEAD_MINUTES fixos ao total.
   * Arredonda para cima ao minuto mais próximo.
   *
   * @param block  TreinoBlock com exercícios e SetTemplates definidos
   */
  static estimateDurationMinutes(block: TreinoBlock): number {
    let totalSeconds = 0

    for (const exercise of block.exercises) {
      const sets = exercise.sets   // SetTemplate[]

      for (let i = 0; i < sets.length; i++) {
        totalSeconds += SECONDS_PER_SET

        const isLastSet = i === sets.length - 1
        if (!isLastSet) {
          const restSec = sets[i].restSec > 0
            ? sets[i].restSec
            : DEFAULT_REST_SECONDS
          totalSeconds += restSec
        }
      }
    }

    return Math.ceil(totalSeconds / 60 + WARMUP_OVERHEAD_MINUTES)
  }

  // ── Contagem ─────────────────────────────────────────────────────

  /**
   * Retorna quantos exercícios um bloco possui.
   * Útil para barra de progresso na TreinoDetailPage.
   */
  static getExerciseCount(block: TreinoBlock): number {
    return block.exercises.length
  }

  /**
   * Retorna o número total de séries prescritas em um bloco.
   */
  static getTotalSetCount(block: TreinoBlock): number {
    return block.exercises.reduce((acc, e) => acc + e.sets.length, 0)
  }

  // ── Filtros ──────────────────────────────────────────────────────

  /**
   * Filtra exercícios de um bloco pelo grupo muscular primário.
   * Comparação case-insensitive.
   *
   * @param block   TreinoBlock
   * @param muscle  Nome do grupo muscular (ex: 'chest', 'back')
   */
  static getExercisesByMuscle(
    block:  TreinoBlock,
    muscle: string,
  ): ExerciseTemplate[] {
    const normalized = muscle.toLowerCase()
    return block.exercises.filter(
      e => e.muscle.toLowerCase() === normalized,
    )
  }

  /**
   * Retorna exercícios que possuem restrição corporal (flag não nula).
   * Usado para exibir aviso de cautela na sessão.
   */
  static getExercisesWithFlags(block: TreinoBlock): ExerciseTemplate[] {
    return block.exercises.filter(e => e.flag !== null)
  }

  /**
   * Verifica se o bloco possui algum exercício com restrição corporal.
   */
  static hasBodyFlags(block: TreinoBlock): boolean {
    return block.exercises.some(e => e.flag !== null)
  }

  // ── Ordenação ────────────────────────────────────────────────────

  /**
   * Retorna os blocos do plano ordenados por tipo (A → D).
   * Preserva imutabilidade — retorna novo array.
   */
  static getSortedTreinoBlocks(plan: WorkoutPlan): TreinoBlock[] {
    const order: TreinoType[] = ['A', 'B', 'C', 'D']
    return [...plan.treinos].sort(
      (a, b) => order.indexOf(a.type) - order.indexOf(b.type),
    )
  }

  // ── Validação ────────────────────────────────────────────────────

  /**
   * Verifica se um plano está minimamente válido para uso.
   * Requer: id, name, durationWeeks > 0 e pelo menos um bloco.
   */
  static isValidPlan(plan: WorkoutPlan): boolean {
    return (
      plan.id.trim().length > 0
      && plan.name.trim().length > 0
      && plan.durationWeeks > 0
      && plan.treinos.length > 0
    )
  }

  /**
   * Verifica se o plano possui o bloco do tipo informado.
   */
  static hasBlock(plan: WorkoutPlan, type: TreinoType): boolean {
    return plan.treinos.some(t => t.type === type)
  }
}
