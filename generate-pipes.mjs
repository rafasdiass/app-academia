// ═══════════════════════════════════════════════════════════════════
//  FitTracker — Gerador de Pipes
//  Execute: node generate-pipes.mjs
//  Cria todos os arquivos em src/app/shared/pipes/
//
//  Pipes gerados (11 + barrel):
//    seconds-to-mmss       number           → string "M:SS"
//    rest-label            number, string?  → string compacto
//    should-show-timer     SetLabelType     → boolean
//    set-visual-style      SetLabelType     → SetVisualStyle
//    protocol-color        Protocol         → ColorTheme
//    flag-color            BodyFlag | null  → ColorTheme | null
//    color-tokens          ColorTheme       → ColorTokens
//    format-load           number | null    → string "80 kg" / "—"
//    format-reps           number | null    → string "8 reps" / "—"
//    hydration-status      number           → HydrationStatus
//    sound-profile-label   SoundProfile     → string label
//
//  Todos os pipes delegam para a rules correspondente.
//  Nenhum pipe contém lógica própria.
// ═══════════════════════════════════════════════════════════════════

import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const BASE_PATH = join('src', 'app', 'shared', 'pipes')

// ── Garante que a pasta existe ──────────────────────────────────────
if (!existsSync(BASE_PATH)) {
  mkdirSync(BASE_PATH, { recursive: true })
  console.log(`📁 Pasta criada: ${BASE_PATH}`)
} else {
  console.log(`📁 Pasta já existe: ${BASE_PATH}`)
}

// ── Definição dos arquivos ──────────────────────────────────────────
const files = {

  // ── 1. SECONDS-TO-MMSS ────────────────────────────────────────────
  //  Entrada : number (segundos)
  //  Saída   : string "M:SS"   ex: 90 → "1:30" | 9 → "0:09"
  //  Delega  : RestTimerRules.formatCountdown()
  //  Usado em: RestTimerComponent display principal do countdown
  // ─────────────────────────────────────────────────────────────────
  'seconds-to-mmss.pipe.ts': `// ─────────────────────────────────────────────────────────────────
// seconds-to-mmss.pipe.ts
// Formata segundos no padrão "M:SS" para o display do timer.
// Delega para RestTimerRules.formatCountdown() — zero lógica aqui.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { RestTimerRules }      from '@core/rules'

@Pipe({ name: 'secondsToMmss', pure: true, standalone: true })
export class SecondsToMmssPipe implements PipeTransform {

  /**
   * @param value  Segundos totais (inteiro não negativo)
   * @returns      String no formato "M:SS" — ex: 90 → "1:30"
   */
  transform(value: number): string {
    return RestTimerRules.formatCountdown(value)
  }
}
`,

  // ── 2. REST-LABEL ─────────────────────────────────────────────────
  //  Entrada : number (segundos) + string? (restNote do SetTemplate)
  //  Saída   : string compacto para badge de descanso
  //            ex: 90, null → "1m30s" | 60, "5 respirações" → "5 respirações"
  //  Delega  : RestTimerRules.formatCompact() com fallback para restNote
  //  Usado em: SetRowComponent badge de tempo de descanso
  // ─────────────────────────────────────────────────────────────────
  'rest-label.pipe.ts': `// ─────────────────────────────────────────────────────────────────
// rest-label.pipe.ts
// Gera o label de descanso para exibição no SetRowComponent.
// Prioriza restNote (texto descritivo) sobre o tempo numérico.
// Delega formatação numérica para RestTimerRules.formatCompact().
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { RestTimerRules }      from '@core/rules'

@Pipe({ name: 'restLabel', pure: true, standalone: true })
export class RestLabelPipe implements PipeTransform {

  /**
   * @param restSec   Tempo de descanso em segundos (SetTemplate.restSec)
   * @param restNote  Nota descritiva opcional (SetTemplate.restNote)
   * @returns         restNote se presente, senão formatação compacta do tempo
   */
  transform(restSec: number, restNote: string | null = null): string {
    if (restNote !== null && restNote.trim().length > 0) return restNote
    return RestTimerRules.formatCompact(restSec)
  }
}
`,

  // ── 3. SHOULD-SHOW-TIMER ─────────────────────────────────────────
  //  Entrada : SetLabelType
  //  Saída   : boolean — true = exibir timer | false = ocultar
  //  Delega  : RestTimerRules.shouldShowTimer()
  //  Usado em: RestTimerComponent *ngIf para ocultar em aquecimentos
  // ─────────────────────────────────────────────────────────────────
  'should-show-timer.pipe.ts': `// ─────────────────────────────────────────────────────────────────
// should-show-timer.pipe.ts
// Indica se o timer de descanso deve ser exibido para um label.
// Séries de aquecimento (AQUEC. A / B) não exibem timer.
// Delega para RestTimerRules.shouldShowTimer() — zero lógica aqui.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { RestTimerRules }      from '@core/rules'
import { SetLabelType }        from '@core/models'

@Pipe({ name: 'shouldShowTimer', pure: true, standalone: true })
export class ShouldShowTimerPipe implements PipeTransform {

  /**
   * @param label  SetLabelType da série atual
   * @returns      true se o timer deve ser exibido
   */
  transform(label: SetLabelType): boolean {
    return RestTimerRules.shouldShowTimer(label)
  }
}
`,

  // ── 4. SET-VISUAL-STYLE ───────────────────────────────────────────
  //  Entrada : SetLabelType
  //  Saída   : SetVisualStyle ('top-set' | 'activation' | 'mini' | 'warmup' | 'default')
  //  Delega  : SetRules.getVisualStyle()
  //  Usado em: SetRowComponent [ngClass]="set.label | setVisualStyle"
  // ─────────────────────────────────────────────────────────────────
  'set-visual-style.pipe.ts': `// ─────────────────────────────────────────────────────────────────
// set-visual-style.pipe.ts
// Converte SetLabelType em SetVisualStyle para [ngClass] binding.
// Delega para SetRules.getVisualStyle() — zero lógica aqui.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { SetRules }            from '@core/rules'
import { SetLabelType, SetVisualStyle } from '@core/models'

@Pipe({ name: 'setVisualStyle', pure: true, standalone: true })
export class SetVisualStylePipe implements PipeTransform {

  /**
   * @param label  SetLabelType da série
   * @returns      SetVisualStyle — classe CSS aplicada via [ngClass]
   */
  transform(label: SetLabelType): SetVisualStyle {
    return SetRules.getVisualStyle(label)
  }
}
`,

  // ── 5. PROTOCOL-COLOR ─────────────────────────────────────────────
  //  Entrada : Protocol
  //  Saída   : ColorTheme
  //  Delega  : ColorThemeRules.getThemeForProtocol()
  //  Usado em: ProtocolBadgeComponent para cor do badge
  // ─────────────────────────────────────────────────────────────────
  'protocol-color.pipe.ts': `// ─────────────────────────────────────────────────────────────────
// protocol-color.pipe.ts
// Mapeia Protocol → ColorTheme para colorização do badge.
// Delega para ColorThemeRules.getThemeForProtocol() — zero lógica aqui.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { ColorThemeRules }     from '@core/rules'
import { Protocol, ColorTheme } from '@core/models'

@Pipe({ name: 'protocolColor', pure: true, standalone: true })
export class ProtocolColorPipe implements PipeTransform {

  /**
   * @param protocol  Protocol do exercício
   * @returns         ColorTheme correspondente ao protocolo
   */
  transform(protocol: Protocol): ColorTheme {
    return ColorThemeRules.getThemeForProtocol(protocol)
  }
}
`,

  // ── 6. FLAG-COLOR ─────────────────────────────────────────────────
  //  Entrada : BodyFlag | null
  //  Saída   : ColorTheme | null (null quando flag = null)
  //  Delega  : ColorThemeRules.getThemeForBodyFlag()
  //  Usado em: ProtocolBadgeComponent e TreinoHeaderComponent
  // ─────────────────────────────────────────────────────────────────
  'flag-color.pipe.ts': `// ─────────────────────────────────────────────────────────────────
// flag-color.pipe.ts
// Mapeia BodyFlag → ColorTheme para exibição de alertas corporais.
// Retorna null quando flag for null (sem restrição).
// Delega para ColorThemeRules.getThemeForBodyFlag() — zero lógica aqui.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { ColorThemeRules }     from '@core/rules'
import { BodyFlag, ColorTheme } from '@core/models'

@Pipe({ name: 'flagColor', pure: true, standalone: true })
export class FlagColorPipe implements PipeTransform {

  /**
   * @param flag  BodyFlag do exercício ou null (sem restrição)
   * @returns     ColorTheme do alerta ou null
   */
  transform(flag: BodyFlag | null): ColorTheme | null {
    if (flag === null) return null
    return ColorThemeRules.getThemeForBodyFlag(flag)
  }
}
`,

  // ── 7. COLOR-TOKENS ───────────────────────────────────────────────
  //  Entrada : ColorTheme
  //  Saída   : ColorTokens (hex, gradient, contrast, ring…)
  //  Delega  : ColorThemeRules.getTokens()
  //  Usado em: ExerciseCardComponent, TreinoHeaderComponent style bindings
  //  Exemplo : [style.--active-color]="block.color | colorTokens | keyvalue"
  // ─────────────────────────────────────────────────────────────────
  'color-tokens.pipe.ts': `// ─────────────────────────────────────────────────────────────────
// color-tokens.pipe.ts
// Resolve ColorTheme → ColorTokens completo para style bindings.
// Delega para ColorThemeRules.getTokens() — zero lógica aqui.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform }       from '@angular/core'
import { ColorThemeRules, ColorTokens } from '@core/rules'
import { ColorTheme }                from '@core/models'

@Pipe({ name: 'colorTokens', pure: true, standalone: true })
export class ColorTokensPipe implements PipeTransform {

  /**
   * @param theme  ColorTheme do bloco ou exercício
   * @returns      ColorTokens com hex, gradient, contrast, ring e ionic color
   */
  transform(theme: ColorTheme): ColorTokens {
    return ColorThemeRules.getTokens(theme)
  }
}
`,

  // ── 8. FORMAT-LOAD ────────────────────────────────────────────────
  //  Entrada : number | null
  //  Saída   : string "80 kg" | "22.5 kg" | "—"
  //  Delega  : SetRules.formatLoad()
  //  Usado em: SetRowComponent exibição de carga no log de execução
  // ─────────────────────────────────────────────────────────────────
  'format-load.pipe.ts': `// ─────────────────────────────────────────────────────────────────
// format-load.pipe.ts
// Formata carga em kg para exibição no log de execução.
// null → "—" (série não registrada).
// Delega para SetRules.formatLoad() — zero lógica aqui.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { SetRules }            from '@core/rules'

@Pipe({ name: 'formatLoad', pure: true, standalone: true })
export class FormatLoadPipe implements PipeTransform {

  /**
   * @param loadKg  Carga em kg ou null se não registrada
   * @returns       "80 kg" | "22.5 kg" | "—"
   */
  transform(loadKg: number | null): string {
    return SetRules.formatLoad(loadKg)
  }
}
`,

  // ── 9. FORMAT-REPS ────────────────────────────────────────────────
  //  Entrada : number | null
  //  Saída   : string "8 reps" | "1 rep" | "—"
  //  Delega  : SetRules.formatReps()
  //  Usado em: SetRowComponent exibição de reps no log de execução
  // ─────────────────────────────────────────────────────────────────
  'format-reps.pipe.ts': `// ─────────────────────────────────────────────────────────────────
// format-reps.pipe.ts
// Formata repetições para exibição no log de execução.
// Trata corretamente singular (1 rep) vs plural (N reps).
// null → "—" (série não registrada).
// Delega para SetRules.formatReps() — zero lógica aqui.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { SetRules }            from '@core/rules'

@Pipe({ name: 'formatReps', pure: true, standalone: true })
export class FormatRepsPipe implements PipeTransform {

  /**
   * @param repsDone  Repetições realizadas ou null se não registrado
   * @returns         "8 reps" | "1 rep" | "—"
   */
  transform(repsDone: number | null): string {
    return SetRules.formatReps(repsDone)
  }
}
`,

  // ── 10. HYDRATION-STATUS ─────────────────────────────────────────
  //  Entrada : number (ml consumidos no dia)
  //  Saída   : HydrationStatus ('critical' | 'low' | 'ok' | 'optimal')
  //  Delega  : HydrationRules.getStatus()
  //  Usado em: HydrationWidget — cor e ícone de status do dia
  // ─────────────────────────────────────────────────────────────────
  'hydration-status.pipe.ts': `// ─────────────────────────────────────────────────────────────────
// hydration-status.pipe.ts
// Classifica o status de hidratação do dia para colorização da UI.
// Delega para HydrationRules.getStatus() — zero lógica aqui.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform }          from '@angular/core'
import { HydrationRules, HydrationStatus } from '@core/rules'

@Pipe({ name: 'hydrationStatus', pure: true, standalone: true })
export class HydrationStatusPipe implements PipeTransform {

  /**
   * @param totalMl  Total de ml consumidos no dia
   * @param goalMl   Meta diária (opcional — usa padrão 2500ml)
   * @returns        'critical' | 'low' | 'ok' | 'optimal'
   */
  transform(totalMl: number, goalMl?: number): HydrationStatus {
    return HydrationRules.getStatus(totalMl, goalMl)
  }
}
`,

  // ── 11. SOUND-PROFILE-LABEL ──────────────────────────────────────
  //  Entrada : SoundProfile
  //  Saída   : string — label legível para o usuário
  //  Delega  : SoundRules.getProfileDescriptions()
  //  Usado em: SettingsPage seletor de perfil sonoro
  // ─────────────────────────────────────────────────────────────────
  'sound-profile-label.pipe.ts': `// ─────────────────────────────────────────────────────────────────
// sound-profile-label.pipe.ts
// Converte SoundProfile em label legível para o seletor de configurações.
// Delega para SoundRules.getProfileDescriptions() — zero lógica aqui.
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'
import { SoundRules }          from '@core/rules'
import { SoundProfile }        from '@core/rules'

@Pipe({ name: 'soundProfileLabel', pure: true, standalone: true })
export class SoundProfileLabelPipe implements PipeTransform {

  /**
   * @param profile  SoundProfile do usuário
   * @returns        Label legível — ex: 'standard' → 'Padrão'
   */
  transform(profile: SoundProfile): string {
    const found = SoundRules.getProfileDescriptions()
      .find(d => d.profile === profile)
    return found?.label ?? profile
  }
}
`,

  // ── 12. INDEX (barrel) ────────────────────────────────────────────
  //  Exporta todos os pipes para import limpo:
  //  import { SecondsToMmssPipe } from '@shared/pipes'
  // ─────────────────────────────────────────────────────────────────
  'index.ts': `// ─────────────────────────────────────────────────────────────────
// index.ts — Barrel export dos pipes compartilhados
// Permite import limpo: import { SecondsToMmssPipe } from '@shared/pipes'
// ─────────────────────────────────────────────────────────────────
export * from './seconds-to-mmss.pipe'
export * from './rest-label.pipe'
export * from './should-show-timer.pipe'
export * from './set-visual-style.pipe'
export * from './protocol-color.pipe'
export * from './flag-color.pipe'
export * from './color-tokens.pipe'
export * from './format-load.pipe'
export * from './format-reps.pipe'
export * from './hydration-status.pipe'
export * from './sound-profile-label.pipe'
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
  1. Adicionar path alias no tsconfig.json (se ainda não existir):
     "@shared/pipes": ["src/app/shared/pipes/index.ts"]

  2. Importar os pipes standalone no módulo ou componente:
     imports: [ SecondsToMmssPipe, SetVisualStylePipe, ... ]

  3. Rodar: npx tsc --noEmit
     (verifica tipos sem gerar build)

  4. Próxima camada: shared/components/
`)
