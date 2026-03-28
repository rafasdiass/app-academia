// ─────────────────────────────────────────────────────────────────
// days-ago.pipe.ts
// Converte 'YYYY-MM-DD' em texto relativo: "hoje", "ontem",
// "3 dias atrás", "1 sem. atrás", "2 sem. atrás".
// ─────────────────────────────────────────────────────────────────
import { Pipe, PipeTransform } from '@angular/core'

@Pipe({ name: 'daysAgo', standalone: true, pure: true })
export class DaysAgoPipe implements PipeTransform {
  transform(dateStr: string | null | undefined): string {
    if (!dateStr) return ''
    const today = new Date()
    today.setHours(0,0,0,0)
    const d = new Date(dateStr + 'T00:00:00')
    const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000)
    if (diff === 0) return 'hoje'
    if (diff === 1) return 'ontem'
    if (diff < 7)  return `${diff} dias atrás`
    const weeks = Math.round(diff / 7)
    return weeks === 1 ? '1 sem. atrás' : `${weeks} sem. atrás`
  }
}
