// ─────────────────────────────────────────────────────────────────
// color-theme.rules.ts
// Responsabilidade única: derivações visuais de ColorTheme.
//
// Cobre:
//   - Tokens completos por tema (hex, CSS class, gradient, contrast)
//   - Mapeamento de nome Ionic Framework (para [color] binding)
//   - Derivação de tema a partir de TreinoType, Protocol e BodyFlag
//   - Contraste automático de texto (WCAG AA simplificado)
//   - Utilitários de validação e listagem
//   - Tokens para StepProgress e RingProgress
//
// Não contém lógica de negócio nem imports de modelos de domínio
// além dos tipos de base — pure presentation layer.
// ─────────────────────────────────────────────────────────────────
import { ColorTheme, TreinoType } from '@core/models'
import { Protocol, BodyFlag }     from '@core/models'

// ── Tipos públicos ────────────────────────────────────────────────

/**
 * Conjunto completo de tokens de cor resolvidos para um tema.
 * Consumido diretamente pelos componentes via style/class bindings.
 */
export interface ColorTokens {
  /** Cor primária em HEX (#rrggbb) */
  hex:           string
  /** Versão semitransparente (15% opacity) para fundos de card */
  hexAlpha15:    string
  /** Versão semitransparente (30% opacity) para estados ativos */
  hexAlpha30:    string
  /** Classe CSS raiz aplicada ao host do componente (ex: 'theme-rose') */
  cssClass:      string
  /** Nome de cor do Ionic Framework para [color] binding */
  ionicColor:    IonColorName
  /** Gradiente radial CSS para backgrounds de card/header */
  gradient:      string
  /** 'light' → texto branco | 'dark' → texto escuro (contraste WCAG AA) */
  contrast:      ColorContrast
  /** Cor do anel de progresso (ring/donut charts) */
  ringColor:     string
  /** Cor do track de fundo do anel (versão desbotada) */
  ringTrack:     string
}

/**
 * Tokens simplificados para exibição de badge (protocolo, flag, etc).
 */
export interface BadgeTokens {
  background: string   // hex com baixa opacidade
  border:     string   // hex da cor primária
  text:       string   // '#ffffff' ou '#1a1a2e'
}

/** Subconjunto dos color names suportados pelo Ionic Framework */
export type IonColorName =
  | 'danger'
  | 'success'
  | 'primary'
  | 'warning'
  | 'tertiary'
  | 'medium'
  | 'dark'

export type ColorContrast = 'light' | 'dark'

// ── Tabelas de mapeamento ─────────────────────────────────────────

/**
 * Tema padrão por tipo de treino.
 * Convenção cromática baseada em divisão muscular clássica:
 *   A = Empurrar (blue)  |  B = Puxar (rose)
 *   C = Pernas  (orange) |  D = Full / Ombros (teal)
 */
const TREINO_TYPE_THEME_MAP: Record<TreinoType, ColorTheme> = {
  A: 'blue',
  B: 'rose',
  C: 'orange',
  D: 'teal',
}

/**
 * Tema padrão por protocolo de treino.
 * Convenção baseada na "temperatura" do estímulo:
 *   RPT=orange (alta intensidade), MYO=purple (metabólico),
 *   STRAIGHT=blue (clássico), PAUSE=teal (TUT), RPT_HALF=amber.
 */
const PROTOCOL_THEME_MAP: Record<Protocol, ColorTheme> = {
  RPT:      'orange',
  MYO:      'purple',
  STRAIGHT: 'blue',
  PAUSE:    'teal',
  RPT_HALF: 'amber',
}

/**
 * Tema padrão por flag de restrição corporal.
 * Cores de alerta para facilitar identificação rápida.
 */
const BODY_FLAG_THEME_MAP: Record<BodyFlag, ColorTheme> = {
  'JOELHO':   'rose',
  'LOMBAR':   'amber',
  '90° MÁX':  'orange',
}

/**
 * Tokens completos por ColorTheme.
 * Valores de hex alinhados com Tailwind CSS 3.x (paleta 400–500).
 */
const COLOR_TOKEN_MAP: Record<ColorTheme, ColorTokens> = {
  rose: {
    hex:        '#f43f5e',
    hexAlpha15: 'rgba(244, 63, 94, 0.15)',
    hexAlpha30: 'rgba(244, 63, 94, 0.30)',
    cssClass:   'theme-rose',
    ionicColor: 'danger',
    gradient:   'radial-gradient(ellipse at top left, rgba(244,63,94,0.18) 0%, transparent 65%)',
    contrast:   'light',
    ringColor:  '#f43f5e',
    ringTrack:  'rgba(244, 63, 94, 0.12)',
  },
  teal: {
    hex:        '#14b8a6',
    hexAlpha15: 'rgba(20, 184, 166, 0.15)',
    hexAlpha30: 'rgba(20, 184, 166, 0.30)',
    cssClass:   'theme-teal',
    ionicColor: 'success',
    gradient:   'radial-gradient(ellipse at top left, rgba(20,184,166,0.18) 0%, transparent 65%)',
    contrast:   'dark',
    ringColor:  '#14b8a6',
    ringTrack:  'rgba(20, 184, 166, 0.12)',
  },
  blue: {
    hex:        '#3b82f6',
    hexAlpha15: 'rgba(59, 130, 246, 0.15)',
    hexAlpha30: 'rgba(59, 130, 246, 0.30)',
    cssClass:   'theme-blue',
    ionicColor: 'primary',
    gradient:   'radial-gradient(ellipse at top left, rgba(59,130,246,0.18) 0%, transparent 65%)',
    contrast:   'light',
    ringColor:  '#3b82f6',
    ringTrack:  'rgba(59, 130, 246, 0.12)',
  },
  orange: {
    hex:        '#f97316',
    hexAlpha15: 'rgba(249, 115, 22, 0.15)',
    hexAlpha30: 'rgba(249, 115, 22, 0.30)',
    cssClass:   'theme-orange',
    ionicColor: 'warning',
    gradient:   'radial-gradient(ellipse at top left, rgba(249,115,22,0.18) 0%, transparent 65%)',
    contrast:   'dark',
    ringColor:  '#f97316',
    ringTrack:  'rgba(249, 115, 22, 0.12)',
  },
  purple: {
    hex:        '#a855f7',
    hexAlpha15: 'rgba(168, 85, 247, 0.15)',
    hexAlpha30: 'rgba(168, 85, 247, 0.30)',
    cssClass:   'theme-purple',
    ionicColor: 'tertiary',
    gradient:   'radial-gradient(ellipse at top left, rgba(168,85,247,0.18) 0%, transparent 65%)',
    contrast:   'light',
    ringColor:  '#a855f7',
    ringTrack:  'rgba(168, 85, 247, 0.12)',
  },
  amber: {
    hex:        '#f59e0b',
    hexAlpha15: 'rgba(245, 158, 11, 0.15)',
    hexAlpha30: 'rgba(245, 158, 11, 0.30)',
    cssClass:   'theme-amber',
    ionicColor: 'warning',
    gradient:   'radial-gradient(ellipse at top left, rgba(245,158,11,0.18) 0%, transparent 65%)',
    contrast:   'dark',
    ringColor:  '#f59e0b',
    ringTrack:  'rgba(245, 158, 11, 0.12)',
  },
  green: {
    hex:        '#22c55e',
    hexAlpha15: 'rgba(34, 197, 94, 0.15)',
    hexAlpha30: 'rgba(34, 197, 94, 0.30)',
    cssClass:   'theme-green',
    ionicColor: 'success',
    gradient:   'radial-gradient(ellipse at top left, rgba(34,197,94,0.18) 0%, transparent 65%)',
    contrast:   'dark',
    ringColor:  '#22c55e',
    ringTrack:  'rgba(34, 197, 94, 0.12)',
  },
}

export class ColorThemeRules {

  // ── Resolução de tokens ──────────────────────────────────────────

  /**
   * Retorna o conjunto completo de tokens de cor para um tema.
   * Principal entry point para componentes que precisam de estilos.
   *
   * Uso: const tokens = ColorThemeRules.getTokens(block.color)
   */
  static getTokens(theme: ColorTheme): ColorTokens {
    return COLOR_TOKEN_MAP[theme]
  }

  /**
   * Retorna apenas o HEX da cor primária.
   * Atalho para style bindings simples: [style.color]="hex".
   */
  static getHex(theme: ColorTheme): string {
    return COLOR_TOKEN_MAP[theme].hex
  }

  /**
   * Retorna a versão rgba com 15% de opacidade (para fundos de card).
   */
  static getHexAlpha15(theme: ColorTheme): string {
    return COLOR_TOKEN_MAP[theme].hexAlpha15
  }

  /**
   * Retorna a versão rgba com 30% de opacidade (para estados ativos).
   */
  static getHexAlpha30(theme: ColorTheme): string {
    return COLOR_TOKEN_MAP[theme].hexAlpha30
  }

  /**
   * Retorna a classe CSS raiz associada ao tema.
   * Aplicada via [class] binding no componente host.
   */
  static getCssClass(theme: ColorTheme): string {
    return COLOR_TOKEN_MAP[theme].cssClass
  }

  /**
   * Retorna o nome de cor do Ionic Framework.
   * Usado no [color] binding de IonButton, IonBadge, etc.
   */
  static getIonicColor(theme: ColorTheme): IonColorName {
    return COLOR_TOKEN_MAP[theme].ionicColor
  }

  /**
   * Retorna o gradiente radial CSS para fundo de cards e headers.
   * Aplicado via [style.background] ou classe utilitária.
   */
  static getGradient(theme: ColorTheme): string {
    return COLOR_TOKEN_MAP[theme].gradient
  }

  /**
   * Retorna o contraste de texto recomendado sobre o tema.
   * 'light' = texto branco (#fff) | 'dark' = texto escuro (#1a1a2e).
   * Baseado em análise de luminância relativa (WCAG AA simplificado).
   */
  static getContrast(theme: ColorTheme): ColorContrast {
    return COLOR_TOKEN_MAP[theme].contrast
  }

  /**
   * Retorna o valor HEX de texto de acordo com o contraste do tema.
   * Pronto para uso direto no [style.color] binding.
   */
  static getContrastHex(theme: ColorTheme): string {
    return COLOR_TOKEN_MAP[theme].contrast === 'light' ? '#ffffff' : '#1a1a2e'
  }

  // ── Tokens de badge ───────────────────────────────────────────────

  /**
   * Retorna os tokens simplificados para renderização de badge.
   * Usado em: ProtocolBadgeComponent, BodyFlagBadgeComponent.
   *
   * background = hexAlpha15, border = hex primário, text = contraste.
   */
  static getBadgeTokens(theme: ColorTheme): BadgeTokens {
    const tokens = COLOR_TOKEN_MAP[theme]
    return {
      background: tokens.hexAlpha15,
      border:     tokens.hex,
      text:       tokens.contrast === 'light' ? '#ffffff' : '#1a1a2e',
    }
  }

  // ── Derivações por entidade de domínio ────────────────────────────

  /**
   * Tema padrão de um TreinoType.
   * A=blue, B=rose, C=orange, D=teal.
   */
  static getThemeForTreinoType(type: TreinoType): ColorTheme {
    return TREINO_TYPE_THEME_MAP[type]
  }

  /**
   * Tokens completos para um TreinoType diretamente.
   * Atalho: evita dois steps (type → theme → tokens).
   */
  static getTokensForTreinoType(type: TreinoType): ColorTokens {
    return ColorThemeRules.getTokens(
      ColorThemeRules.getThemeForTreinoType(type),
    )
  }

  /**
   * Tema padrão de um Protocol de exercício.
   * RPT=orange, MYO=purple, STRAIGHT=blue, PAUSE=teal, RPT_HALF=amber.
   */
  static getThemeForProtocol(protocol: Protocol): ColorTheme {
    return PROTOCOL_THEME_MAP[protocol]
  }

  /**
   * Tokens de badge para um Protocol.
   * Atalho direto para ProtocolBadgeComponent.
   */
  static getBadgeTokensForProtocol(protocol: Protocol): BadgeTokens {
    return ColorThemeRules.getBadgeTokens(
      ColorThemeRules.getThemeForProtocol(protocol),
    )
  }

  /**
   * Tema para exibição de alerta de restrição corporal (BodyFlag).
   * JOELHO=rose, LOMBAR=amber, 90°MÁX=orange.
   */
  static getThemeForBodyFlag(flag: BodyFlag): ColorTheme {
    return BODY_FLAG_THEME_MAP[flag]
  }

  /**
   * Tokens de badge para um BodyFlag.
   * Atalho direto para BodyFlagBadgeComponent.
   */
  static getBadgeTokensForBodyFlag(flag: BodyFlag): BadgeTokens {
    return ColorThemeRules.getBadgeTokens(
      ColorThemeRules.getThemeForBodyFlag(flag),
    )
  }

  // ── Ring / Donut progress ─────────────────────────────────────────

  /**
   * Retorna os tokens de cor para componentes de anel de progresso.
   * ringColor = cor primária | ringTrack = versão desbotada (fundo).
   */
  static getRingTokens(theme: ColorTheme): { ringColor: string; ringTrack: string } {
    const t = COLOR_TOKEN_MAP[theme]
    return { ringColor: t.ringColor, ringTrack: t.ringTrack }
  }

  // ── Utilitários ────────────────────────────────────────────────────

  /**
   * Lista todos os ColorThemes disponíveis.
   * Útil para seletores de tema no painel admin.
   */
  static getAllThemes(): ColorTheme[] {
    return Object.keys(COLOR_TOKEN_MAP) as ColorTheme[]
  }

  /**
   * Verifica se um valor string é um ColorTheme válido.
   * Usado para validar dados externos (Firestore, JSON seed).
   */
  static isValidTheme(value: string): value is ColorTheme {
    return value in COLOR_TOKEN_MAP
  }

  /**
   * Interpola visualmente entre dois temas baseado em um percentual (0–1).
   * Retorna o tema mais próximo do percentual — útil para progress rings
   * que mudam de cor conforme o progresso (ex: cinza → verde).
   *
   * @param percent  0.0 (início) a 1.0 (completo)
   * @param from     Tema inicial (padrão: 'rose')
   * @param to       Tema final (padrão: 'green')
   */
  static interpolateThemeByProgress(
    percent: number,
    from:    ColorTheme = 'rose',
    to:      ColorTheme = 'green',
  ): ColorTheme {
    return percent >= 0.5 ? to : from
  }
}
