// ─────────────────────────────────────────────────────────────────
// workout-plan.service.ts — Firebase only, zero seed local
// ─────────────────────────────────────────────────────────────────
import { Injectable, inject }        from '@angular/core'
import { Observable, combineLatest } from 'rxjs'
import { map, distinctUntilChanged, shareReplay } from 'rxjs/operators'

import { ApiService }       from '@core/api'
import { WorkoutPlanRules } from '@core/rules'
import {
  WorkoutPlan, TreinoBlock, TreinoType, BodyFlag, ExerciseTemplate,
  Nutrition, Hydration, Supplement, Cardio, Abdomen,
  PeriodizationWeek, WeekDay, AdvancedProtocols,
  PlanKpi, PlanTag, PlanRestriction,
} from '@core/models'

@Injectable({ providedIn: 'root' })
export class WorkoutPlanService {

  private readonly api = inject(ApiService)

  private planPath(planId: string): string {
    return `workoutPlans/${planId}`
  }

  // ── Firestore ─────────────────────────────────────────────────────

  getPlanById(planId: string): Observable<WorkoutPlan> {
    return this.api.get<WorkoutPlan>(this.planPath(planId)).pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
    )
  }

  getAllPlans(): Observable<WorkoutPlan[]> {
    return this.api.getCollection<WorkoutPlan>('workoutPlans')
  }

  getPlansByCreator(uid: string): Observable<WorkoutPlan[]> {
    return this.api.query<WorkoutPlan>('workoutPlans', {
      filters: [{ field: 'createdBy', operator: '==', value: uid }],
    })
  }

  // ── Header ────────────────────────────────────────────────────────

  getKpis(plan: WorkoutPlan): PlanKpi[]               { return plan.kpis         ?? [] }
  getTags(plan: WorkoutPlan): PlanTag[]               { return plan.tags         ?? [] }
  getRestrictions(plan: WorkoutPlan): PlanRestriction[]{ return plan.restrictions ?? [] }

  // ── Treinos ───────────────────────────────────────────────────────

  getTreinoBlock(plan: WorkoutPlan, type: TreinoType): TreinoBlock | null {
    return WorkoutPlanRules.getTreinoBlock(plan, type)
  }

  getActiveTreinoBlock$(
    plan$: Observable<WorkoutPlan>, activeType$: Observable<TreinoType>,
  ): Observable<TreinoBlock | null> {
    return combineLatest([plan$, activeType$]).pipe(
      map(([plan, type]) => WorkoutPlanRules.getTreinoBlock(plan, type)),
      distinctUntilChanged(),
    )
  }

  getExerciseById(block: TreinoBlock, id: string): ExerciseTemplate | null {
    return WorkoutPlanRules.getExerciseById(block, id)
  }

  collectBodyFlags(block: TreinoBlock): BodyFlag[] {
    return WorkoutPlanRules.collectBodyFlags(block)
  }

  estimateDuration(block: TreinoBlock): number {
    return WorkoutPlanRules.estimateDurationMinutes(block)
  }

  getCurrentWeek(startDate: string, currentDate: string, durationWeeks: number): number | null {
    return WorkoutPlanRules.getWeekNumber(startDate, currentDate, durationWeeks)
  }

  isDeloadWeek(startDate: string, currentDate: string, durationWeeks: number): boolean {
    return WorkoutPlanRules.isDeloadWeek(startDate, currentDate, durationWeeks)
  }

  // ── Seções do plano — todas vêm do Firestore ──────────────────────

  getNutrition(plan: WorkoutPlan): Nutrition              { return plan.nutrition          }
  getHydration(plan: WorkoutPlan): Hydration              { return plan.hydration          }
  getSupplements(plan: WorkoutPlan): Supplement[]         { return plan.supplements  ?? [] }
  getCardio(plan: WorkoutPlan): Cardio                    { return plan.cardio             }
  getAbdomen(plan: WorkoutPlan): Abdomen                  { return plan.abdomen            }
  getPeriodization(plan: WorkoutPlan): PeriodizationWeek[]{ return plan.periodization ?? [] }
  getWeekSchedule(plan: WorkoutPlan): WeekDay[]           { return plan.weekSchedule  ?? [] }
  getAdvancedProtocols(plan: WorkoutPlan): AdvancedProtocols { return plan.advancedProtocols }

  getPeriodizationWeek(plan: WorkoutPlan, week: number): PeriodizationWeek | null {
    return plan.periodization?.find(w => w.week === week) ?? null
  }
}
