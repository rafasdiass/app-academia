// ─────────────────────────────────────────────────────────────────
// flag-color.pipe.ts
// BodyFlag | null → ColorTheme | null para badges de alerta.
// Delega para ColorThemeRules.getThemeForBodyFlag().
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform }   from '@angular/core'
import { BodyFlag, ColorTheme }  from '@core/models'
import { ColorThemeRules }       from '@core/rules'

@Pipe({ name: 'flagColor', pure: true, standalone: true })
export class FlagColorPipe implements PipeTransform {
  transform(flag: BodyFlag | null): ColorTheme | null {
    if (flag === null) return null
    return ColorThemeRules.getThemeForBodyFlag(flag)
  }
}
