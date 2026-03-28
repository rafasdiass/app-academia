// ─────────────────────────────────────────────────────────────────
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
