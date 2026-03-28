// ─────────────────────────────────────────────────────────────────
// protocol-color.pipe.ts
// Protocol → ColorTheme para badges e highlights.
// Delega para ColorThemeRules.getThemeForProtocol().
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform }  from '@angular/core'
import { Protocol, ColorTheme } from '@core/models'
import { ColorThemeRules }      from '@core/rules'

@Pipe({ name: 'protocolColor', pure: true, standalone: true })
export class ProtocolColorPipe implements PipeTransform {
  transform(protocol: Protocol): ColorTheme {
    return ColorThemeRules.getThemeForProtocol(protocol)
  }
}
