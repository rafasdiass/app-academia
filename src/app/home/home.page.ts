// home.page.ts — responsabilidade única: orquestrar estado e tabs
//
// Componentes usados:
//   PlanHeaderComponent      → header + tags + alert bar (local)
//   TreinoTabComponent       → lista de exercícios do bloco (shared)
//   CardioTabComponent       → aba Cardio & HIIT (local)
//   AbdomenTabComponent      → aba Abdomen (local)
//   NutritionTabComponent    → aba Nutrição & Suplementação (local)
//   PeriodizationTabComponent→ aba Periodização (local)
//
// NÃO usa TreinoHeaderComponent — ele é exclusivo da TreinoDetailPage,
// onde exibe título, KPIs, flags e duração do bloco ativo.
import {
  Component, ChangeDetectionStrategy, inject, OnInit,
} from '@angular/core'
import { CommonModule }        from '@angular/common'
import { IonContent, IonIcon } from '@ionic/angular/standalone'
import { addIcons }            from 'ionicons'
import { logOutOutline }       from 'ionicons/icons'
import { Observable }                     from 'rxjs'
import { switchMap, filter, shareReplay } from 'rxjs/operators'

import { AuthService }        from '@core/services/auth.service'
import { WorkoutPlanService } from '@core/services/workout-plan.service'
import { WorkoutPlan, TreinoType, TreinoBlock, UserProfile } from '@core/models'
import {PlanHeaderComponent} from "@features/treino/components/plan-header/plan-header.component";
import {CardioTabComponent} from "@features/treino/components/cardio-tab/cardio-tab.component";
import {AbdomenTabComponent} from "@features/treino/components/abdomen-tab/abdomen-tab.component";
import {NutritionTabComponent} from "@features/treino/components/nutrition-tab/nutrition-tab.component";
import {PeriodizationTabComponent} from "@features/treino/components/periodization-tab/periodization-tab.component";
import {TreinoTabComponent} from "@features/treino/components/treino-tab/treino-tab.component";

// ── Componentes locais (home/components/) ───────────────────────


interface Tab { id: string; label: string }

@Component({
  selector:        'app-home',
  templateUrl:     './home.page.html',
  styleUrls:       ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    // local
    PlanHeaderComponent,
    CardioTabComponent,
    AbdomenTabComponent,
    NutritionTabComponent,
    PeriodizationTabComponent,
    // shared
    TreinoTabComponent,
  ],
})
export class HomePage implements OnInit {

  private readonly auth        = inject(AuthService)
  private readonly workoutPlan = inject(WorkoutPlanService)

  constructor() { addIcons({ logOutOutline }) }

  plan$!:        Observable<WorkoutPlan>
  currentUser$!: Observable<UserProfile | null>
  activeTab = 'A'

  readonly tabs: Tab[] = [
    { id: 'A',    label: 'Treino A'          },
    { id: 'B',    label: 'Treino B'          },
    { id: 'C',    label: 'Treino C'          },
    { id: 'D',    label: 'Treino D'          },
    { id: 'Card', label: 'Cardio & HIIT'     },
    { id: 'Abd',  label: 'Abdomen'           },
    { id: 'Nut',  label: 'Nutrição & Suplts' },
    { id: 'Per',  label: 'Periodização'      },
  ]

  ngOnInit(): void {
    this.currentUser$ = this.auth.currentUser$
    this.plan$ = this.auth.currentUser$.pipe(
      filter(user => !!user?.planId),
      switchMap(user => this.workoutPlan.getPlanById(user!.planId)),
      shareReplay({ bufferSize: 1, refCount: true }),
    )
  }

  setTab(id: string): void { this.activeTab = id }

  async logout(): Promise<void> { await this.auth.logout() }

  getBlock(plan: WorkoutPlan, type: string): TreinoBlock | null {
    return this.workoutPlan.getTreinoBlock(plan, type as TreinoType)
  }
}
