import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core'
import { AsyncPipe, NgClass }  from '@angular/common'
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
} from '@ionic/angular/standalone'
import { addIcons }            from 'ionicons'
import {
  barbellOutline,
  fitnessOutline,
  flameOutline,
  flashOutline,
  timeOutline,
} from 'ionicons/icons'
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
} from 'rxjs'
import {
  map,
  distinctUntilChanged,
  shareReplay,
  filter,
  switchMap,
} from 'rxjs/operators'

import { AuthService }           from '@core/services/auth.service'
import { WorkoutPlanService }    from '@core/services/workout-plan.service'
import {
  WorkoutPlan,
  TreinoBlock,
  TreinoType,
  BodyFlag,
} from '@core/models'
import { TreinoHeaderComponent } from './components/treino-header/treino-header.component'
import { TreinoTabComponent }    from './components/treino-tab/treino-tab.component'

@Component({
  selector:        'app-treino-detail',
  templateUrl:     './treino-detail.page.html',
  styleUrls:       ['./treino-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:      true,
  imports: [
    AsyncPipe,
    NgClass,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonIcon,
    TreinoHeaderComponent,
    TreinoTabComponent,
  ],
})
export class TreinoDetailPage implements OnInit, OnDestroy {

  private readonly auth               = inject(AuthService)
  private readonly workoutPlanService = inject(WorkoutPlanService)
  private readonly destroy$           = new Subject<void>()

  readonly treinoTypes: TreinoType[] = ['A', 'B', 'C', 'D']

  plan$!:         Observable<WorkoutPlan>
  activeTreino$!: Observable<TreinoBlock | null>
  flags$!:        Observable<BodyFlag[]>
  duration$!:     Observable<number>

  readonly activeType$ = new BehaviorSubject<TreinoType>('A')

  constructor() {
    addIcons({ barbellOutline, fitnessOutline, flameOutline, flashOutline, timeOutline })
  }

  ngOnInit(): void {
    // Aguarda perfil Firestore (planId preenchido) → busca plano do Firebase.
    // Zero fallback local — se planId estiver vazio, o stream não emite.
    this.plan$ = this.auth.currentUser$.pipe(
      filter(user => !!user?.planId),
      switchMap(user => this.workoutPlanService.getPlanById(user!.planId)),
      shareReplay({ bufferSize: 1, refCount: true }),
    )

    this.activeTreino$ = combineLatest([
      this.plan$,
      this.activeType$.pipe(distinctUntilChanged()),
    ]).pipe(
      map(([plan, type]) => this.workoutPlanService.getTreinoBlock(plan, type)),
      shareReplay({ bufferSize: 1, refCount: true }),
    )

    this.flags$ = this.activeTreino$.pipe(
      map(block => block
        ? this.workoutPlanService.collectBodyFlags(block)
        : [],
      ),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    )

    this.duration$ = this.activeTreino$.pipe(
      map(block => block
        ? this.workoutPlanService.estimateDuration(block)
        : 0,
      ),
      distinctUntilChanged(),
    )
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  onSegmentChange(event: CustomEvent): void {
    const type = event.detail.value as TreinoType
    if (type) this.activeType$.next(type)
  }

  get activeType(): TreinoType {
    return this.activeType$.getValue()
  }

  getIconForType(type: TreinoType): string {
    const icons: Record<TreinoType, string> = {
      A: 'barbell-outline',
      B: 'fitness-outline',
      C: 'flame-outline',
      D: 'flash-outline',
    }
    return icons[type] ?? 'barbell-outline'
  }
}
