// ─────────────────────────────────────────────────────────────────
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
