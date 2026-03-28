/**
 * SEED SCRIPT — Protocolo 8 Semanas Hipertrofia
 * Usuário: Laracri1706@gmail.com
 *
 * Dependências:
 *   npm install firebase
 *
 * Uso:
 *   node seed-firebase.js
 */

const { initializeApp } = require("firebase/app");
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} = require("firebase/auth");
const {
  getFirestore,
  doc,
  setDoc,
  collection,
  writeBatch,
} = require("firebase/firestore");

// ─── CONFIG VIA environment.ts do projeto Angular ───────────────────────────
// Lê o environment.ts como texto e extrai o objeto firebase via regex.
// Funciona sem ts-node e sem duplicar as chaves no seed.
const fs   = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, 'src/environments/environment.ts');
const envText = fs.readFileSync(envPath, 'utf8');

// Extrai o bloco firebase: { ... } do arquivo TypeScript
const match = envText.match(/firebase\s*:\s*(\{[\s\S]*?\})/);
if (!match) {
  console.error('❌ Não foi possível encontrar o bloco firebase no environment.ts');
  process.exit(1);
}

// Converte para JSON válido: remove aspas simples, trailing commas etc.
const rawBlock = match[1]
  .replace(/(\/\/[^\n]*)/g, '')           // remove comentários
  .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // chaves sem aspas → com aspas
  .replace(/'/g, '"')                      // aspas simples → duplas
  .replace(/,\s*}/g, '}')                 // trailing comma
  .replace(/,\s*]/g, ']');

const firebaseConfig = JSON.parse(rawBlock);
// ────────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ════════════════════════════════════════════════════════════════════════════
// DADOS DO PROTOCOLO
// ════════════════════════════════════════════════════════════════════════════

const PROTOCOLO_META = {
  titulo: "Protocolo Completo 8 Semanas — Hipertrofia Inferiores + Corpo Total",
  versao: "3.0",
  duracao_semanas: 8,
  dias_por_semana: 4,
  splits: ["A", "B", "C", "D"],
  semana_atual: 1,
  dados_usuario: {
    peso_kg: 60,
    altura_cm: 165,
    email: "Laracri1706@gmail.com",
  },
  restricoes: {
    joelho: "amplitude máx. 90° · sem saltos de alto impacto · passada reversa no lugar da frontal",
    lombar: "RDL amplitude parcial · desenvolvimento sentada · core ativo antes de todo hip hinge",
    diastase: "confirmada · sem crunch/sit-up · sem buchamento · saltos só fase 3 (sem. 5+)",
  },
  kpis: {
    duracao_forca_min: 50,
    duracao_hiit_min: 12,
    frequencia_gluteos_semana: 2,
  },
  tags: [
    "60 kg · 1,65 m",
    "RPT + Myo-reps",
    "Diastase confirmada",
    "Joelho protegido",
    "Lombar sensível",
    "Pirâmide Reversa",
    "HIIT · Corda · Sprints",
    "Hiperhidratação 2 sem",
    "Creatina · Malto · Gatorade",
  ],
  createdAt: new Date().toISOString(),
};

// ─── GRADE SEMANAL ───────────────────────────────────────────────────────────
const GRADE_SEMANAL = [
  { dia: "Segunda", codigo: "A", nome: "Glúteos", cardio: "Sprint HIIT" },
  { dia: "Terça",   codigo: "B", nome: "Quadríceps", cardio: "Sprint HIIT" },
  { dia: "Quarta",  codigo: "REST", nome: "Mobilidade leve", cardio: null },
  { dia: "Quinta",  codigo: "C", nome: "Superior", cardio: "Elíptico 15'" },
  { dia: "Sexta",   codigo: "REST", nome: "Caminhada 30'", cardio: null },
  { dia: "Sábado",  codigo: "D", nome: "Glúteos v2", cardio: "Sprint HIIT" },
  { dia: "Domingo", codigo: "REST", nome: "Descanso total", cardio: null },
];

// ════════════════════════════════════════════════════════════════════════════
// TREINO A — Glúteos & Posterior de Coxa
// ════════════════════════════════════════════════════════════════════════════
const TREINO_A = {
  codigo: "A",
  nome: "Treino A — Glúteos & Posterior de Coxa",
  descricao: "Exercícios compostos em RPT · Isolações em Myo-reps · Zero estresse de joelho/lombar",
  duracao_min: 50,
  cardio_pos: "Sprint HIIT 12 min",
  protocolo_principal: "RPT + Myo-reps",
  series_efetivas: "18–20",
  joelho: "Seguro (hip-dominante)",
  aquecimento: [
    "Clamshell com elástico 2×12 cada",
    "Dead bug respiratório 1×8",
    "Glute bridge bilateral lento 2×10",
    "Ativação glúteo 4 apoios + elástico 2×10",
    "Mobilização quadril em círculo 1×8 cada",
  ],
  exercicios: [
    {
      numero: 1,
      nome: "Hip Thrust — Barra",
      musculo_alvo: "Glúteo Máximo",
      protocolo: "RPT",
      tipo: "composto",
      restricao: null,
      aquecimento_especifico: [
        "Série A: 40% 1RM × 15 reps (leve)",
        "Série B: 60% 1RM × 8 reps",
      ],
      series: [
        { label: "TOP SET", carga_pct: 75, reps: "6–8", iso: "4s topo", tecnicas: ["RPT S1", "ISO"] },
        { label: "SÉRIE 2", carga_pct: -10, reps: "10–12", iso: "3s topo", tecnicas: ["EXC 2s", "ISO"] },
        { label: "SÉRIE 3", carga_pct: -20, reps: "14–16 + ISO 12s final", iso: "2s + 12s final", tecnicas: ["DROP ISO"] },
      ],
      intervalo: "90s",
      notas: "Pés quadril, joelhos para fora. Isométrica 4s no topo do top set.",
    },
    {
      numero: 2,
      nome: "RDL Halteres — Amplitude Parcial",
      musculo_alvo: "Isquiotibiais / Glúteo",
      protocolo: "RPT",
      tipo: "composto",
      restricao: "LOMBAR",
      series: [
        { label: "TOP SET", carga_pct: 70, reps: "8–10", iso: "PAUSE 2s no estiramento", tecnicas: ["RPT S1", "PAUSE", "SAFE"] },
        { label: "SÉRIE 2", carga_pct: -10, reps: "12–14", iso: "PAUSE 1s", tecnicas: ["EXC"] },
        { label: "SÉRIE 3", carga_pct: -20, reps: "16–18", iso: "—", tecnicas: [] },
      ],
      intervalo: "90s",
      notas: "Descida máx. 55cm · descida 3s na série 1 · core ativo o tempo todo.",
    },
    {
      numero: 3,
      nome: "Cadeira Abdutora",
      musculo_alvo: "Glúteo Médio",
      protocolo: "MYO-REPS",
      tipo: "isolacao",
      restricao: null,
      series: [
        { label: "ATIVAÇÃO", carga_pct: 60, reps: "15–18", iso: "ISO 2s fechado", tecnicas: ["MYO ACT", "ISO"] },
        { label: "MINI × 4", carga_pct: "mesma", reps: "4–5 cada", iso: "ISO 2s", tecnicas: ["MYO MINI"] },
      ],
      rodadas_myo: 2,
      descanso_mini: "5 respirações",
      intervalo: "5 respirações",
      notas: "Inclinação +15° para frente · RPE 8-9 na ativação.",
    },
    {
      numero: 4,
      nome: "Cadeira Flexora — 0–90°",
      musculo_alvo: "Isquiotibiais",
      protocolo: "MYO-REPS",
      tipo: "isolacao",
      restricao: "JOELHO",
      series: [
        { label: "ATIVAÇÃO", reps: "15", iso: "2s no pico", tecnicas: ["MYO ACT"] },
        { label: "MINI × 4", reps: "4 cada", iso: "2s", tecnicas: ["MYO MINI"] },
      ],
      rodadas_myo: 2,
      descanso_mini: "5 respirações",
      intervalo: "5 respirações",
      notas: "Amplitude limitada 0–90°",
    },
    {
      numero: 5,
      nome: "Kick Back Polia Baixa",
      musculo_alvo: "Glúteo Máximo",
      protocolo: "Séries Retas",
      tipo: "isolacao",
      restricao: "LOMBAR",
      series: [
        { label: "S1–S3", reps: "15 cada", iso: "2s extensão", tecnicas: ["UNI", "ISO"] },
      ],
      series_total: "3 × 15 cada lado",
      intervalo: "60s",
      notas: "Extensão sem hiper-extensão lombar.",
    },
    {
      numero: 6,
      nome: "Glute Bridge Unilateral",
      musculo_alvo: "Glúteo Máximo",
      protocolo: "MYO-REPS",
      tipo: "isolacao",
      restricao: null,
      series: [
        { label: "ATIVAÇÃO", reps: "15", iso: "3s no topo", tecnicas: ["MYO ACT", "UNI"] },
        { label: "MINI × 4", reps: "4 cada", iso: "3s", tecnicas: ["MYO MINI"] },
      ],
      rodadas_myo: 2,
      descanso_mini: "5 respirações",
      intervalo: "5 respirações",
      notas: "Hold 3s no topo · 2 rodadas Myo por lado.",
    },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// TREINO B — Quadríceps, Adutores & Panturrilha
// ════════════════════════════════════════════════════════════════════════════
const TREINO_B = {
  codigo: "B",
  nome: "Treino B — Quadríceps, Adutores & Panturrilha",
  descricao: "Leg press com 1,5 rep em RPT · Extensora em Myo-reps · Amplitude máx. 90° joelho",
  duracao_min: 50,
  cardio_pos: "Sprint HIIT 12 min",
  protocolo_principal: "RPT + 1,5 rep",
  joelho: "⚡ 90° MÁXIMO — regra absoluta",
  aquecimento: [
    "Esteira 4 min (5 km/h plano)",
    "Agachamento sumô corporal 2×10 (só até 90°)",
    "Extensão quadril em 4 apoios 1×10 cada",
  ],
  exercicios: [
    {
      numero: 1,
      nome: "Leg Press 45° — Pés Médios",
      musculo_alvo: "Quadríceps",
      protocolo: "RPT + 1,5 REP",
      tipo: "composto",
      restricao: "90° MÁX",
      tecnica_15rep: "Desce 100% (90°) → sobe até 50% → volta ao fundo → sobe 100% = 1 rep",
      series: [
        { label: "TOP SET", carga_pct: 75, reps: "6–8 reps 1,5×", iso: "—", tecnicas: ["RPT S1", "1,5 REP"] },
        { label: "SÉRIE 2", carga_pct: -10, reps: "10–12 reps 1,5×", iso: "—", tecnicas: ["1,5 REP"] },
        { label: "SÉRIE 3", carga_pct: -20, reps: "14–16 normais + Myo: 5 resp → 3r × 3 mini", iso: "—", tecnicas: ["+MYO"] },
      ],
      intervalo: "2 min",
      notas: "Carga mais elevada desta ficha. Nunca passar de 90°.",
    },
    {
      numero: 2,
      nome: "Cadeira Extensora",
      musculo_alvo: "Quadríceps",
      protocolo: "MYO-REPS",
      tipo: "isolacao",
      restricao: "JOELHO",
      series: [
        { label: "ATIVAÇÃO", reps: "18–20", iso: "2s no topo", tecnicas: ["MYO ACT"] },
        { label: "MINI × 4", reps: "4 cada", iso: "2s", tecnicas: ["MYO MINI"] },
      ],
      rodadas_myo: 2,
      descanso_mini: "5 respirações",
      intervalo: "5 respirações",
      notas: "2 rodadas Myo completas.",
    },
    {
      numero: 3,
      nome: "Agachamento Sumô — Haltere",
      musculo_alvo: "Quadríceps / Adutores",
      protocolo: "Séries Retas — PAUSE",
      tipo: "composto",
      restricao: "90° MÁX",
      series_total: "3 × 15",
      series: [
        { label: "S1–S3", reps: "15", iso: "2s fundo (PAUSE)", tecnicas: ["PAUSE", "SAFE"] },
      ],
      intervalo: "75s",
      notas: "Pés 45°, pausa 2s no fundo, joelhos seguem os pés.",
    },
    {
      numero: 4,
      nome: "Cadeira Adutora",
      musculo_alvo: "Adutores",
      protocolo: "MYO-REPS",
      tipo: "isolacao",
      restricao: null,
      series: [
        { label: "ATIVAÇÃO", reps: "20", iso: "3s fechado", tecnicas: ["MYO ACT"] },
        { label: "MINI × 4", reps: "4 cada", iso: "3s", tecnicas: ["MYO MINI"] },
      ],
      rodadas_myo: 2,
      descanso_mini: "5 respirações",
      intervalo: "5 respirações",
      notas: "Perna a 45° para adutor longo.",
    },
    {
      numero: 5,
      nome: "Step Lateral Baixo 10–15cm",
      musculo_alvo: "VMO / Quadríceps",
      protocolo: "Séries Retas — UNI",
      tipo: "isolacao",
      restricao: "JOELHO",
      series_total: "3 × 12 cada",
      series: [
        { label: "S1–S3", reps: "12 cada", iso: "1s no topo", tecnicas: ["UNI", "SAFE"] },
      ],
      intervalo: "60s",
      notas: "Subida lenta 2s, joelho sobre 2° dedo.",
    },
    {
      numero: 6,
      nome: "Panturrilha em Pé",
      musculo_alvo: "Gastrocnêmio",
      protocolo: "RPT — Volume Alto",
      tipo: "isolacao",
      restricao: null,
      series_total: "4 × 20–25",
      series: [
        { label: "S1–S4", reps: "20→25 (descendo por série)", iso: "2s topo", tecnicas: ["ISO", "EXC"] },
      ],
      intervalo: "45s",
      notas: "Peso leve, volume alto.",
    },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// TREINO C — Superior Completo
// ════════════════════════════════════════════════════════════════════════════
const TREINO_C = {
  codigo: "C",
  nome: "Treino C — Superior Completo",
  descricao: "Séries retas para manutenção · Elíptico pós-treino · Core ativo em todos os movimentos",
  duracao_min: 46,
  cardio_pos: "Elíptico 15 min — 65–70% FC",
  protocolo_principal: "Straight Sets (vol. moderado)",
  joelho: "✓ Seguro (membros superiores)",
  aquecimento: [
    "Rotação ombro com elástico 2×15",
    "Remada elástico 2×12",
    "Mobilização torácica rolo 1×10",
  ],
  exercicios: [
    {
      numero: 1,
      nome: "Supino Halteres",
      musculo_alvo: "Peitoral",
      protocolo: "Séries Retas",
      series_total: "3 × 12–15",
      iso: "EXC 3s — cotovelos 45°",
      intervalo: "60s",
    },
    {
      numero: 2,
      nome: "Remada Curvada Haltere",
      musculo_alvo: "Dorsal / Romboides",
      protocolo: "Séries Retas",
      series_total: "3 × 12–15",
      iso: "ISO 1s — lombar neutra",
      intervalo: "60s",
    },
    {
      numero: 3,
      nome: "Puxada Frente Polia",
      musculo_alvo: "Grande Dorsal",
      protocolo: "Séries Retas",
      series_total: "3 × 12–15",
      iso: "ISO 1s — retração escápula",
      intervalo: "60s",
    },
    {
      numero: 4,
      nome: "Desenvolvimento Halteres — Sentada",
      musculo_alvo: "Deltóide",
      protocolo: "Séries Retas",
      restricao: "LOMBAR",
      series_total: "3 × 12–15",
      iso: "EXC — sem extensão lombar",
      intervalo: "60s",
    },
    {
      numero: 5,
      nome: "Elevação Lateral",
      musculo_alvo: "Deltóide Lateral",
      protocolo: "MYO-REPS",
      series: [
        { label: "ATIVAÇÃO", reps: "15", iso: "—", tecnicas: ["MYO ACT"] },
        { label: "MINI × 4", reps: "4 cada", iso: "—", tecnicas: ["MYO MINI"] },
      ],
      rodadas_myo: 2,
      intervalo: "5 respirações",
    },
    {
      numero: 6,
      nome: "Remada Unilateral Haltere",
      musculo_alvo: "Dorsal",
      protocolo: "Séries Retas",
      series_total: "2 × 12 cada",
      iso: "ISO 1s — apoio no banco",
      intervalo: "45s",
    },
    {
      numero: 7,
      nome: "Rosca Direta Halteres",
      musculo_alvo: "Bíceps",
      protocolo: "Séries Retas",
      series_total: "2 × 12–15",
      iso: "EXC 3s",
      intervalo: "45s",
    },
    {
      numero: 8,
      nome: "Tríceps Corda Polia Alta",
      musculo_alvo: "Tríceps",
      protocolo: "Séries Retas",
      series_total: "2 × 12–15",
      iso: "ISO 1s — separar corda",
      intervalo: "45s",
    },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// TREINO D — Glúteos & Inferiores (Variante A₂)
// ════════════════════════════════════════════════════════════════════════════
const TREINO_D = {
  codigo: "D",
  nome: "Treino D — Glúteos & Inferiores (Variante A₂)",
  descricao: "Segunda sessão semanal de glúteos · Exercícios diferentes do Treino A · RPT + Myo-reps",
  duracao_min: 48,
  cardio_pos: "Sprint HIIT 12 min",
  protocolo_principal: "RPT + Myo isolações",
  diferencial: "Unilateral — Hip thrust + passada reversa",
  aquecimento: [
    "Glute bridge + elástico 2×15",
    "Donkey kick 4 apoios 2×12 cada",
    "Fire hydrant elástico 1×12 cada",
    "Mobilidade quadril passada baixa 1×8 cada",
  ],
  exercicios: [
    {
      numero: 1,
      nome: "Hip Thrust Unilateral — Barra Leve",
      musculo_alvo: "Glúteo Máximo",
      protocolo: "RPT — Unilateral",
      tipo: "composto",
      series: [
        { label: "TOP SET", carga_pct: 65, reps: "8–10 cada", iso: "ISO 3s", tecnicas: ["RPT S1", "UNI"] },
        { label: "SÉRIE 2", carga_pct: -10, reps: "12–15 cada", iso: "ISO 2s", tecnicas: ["EXC"] },
        { label: "SÉRIE 3", carga_pct: -20, reps: "18–20 bilateral + 15s ISO", iso: "ISO 15s final", tecnicas: ["DROP ISO"] },
      ],
      intervalo: "75s",
      notas: "Perna livre estendida, squeeze 3s no topo. Cada lado independente.",
    },
    {
      numero: 2,
      nome: "Elevação Pélvica — Haltere No Quadril",
      musculo_alvo: "Glúteo Máximo",
      protocolo: "MYO-REPS",
      tipo: "isolacao",
      series: [
        { label: "ATIVAÇÃO", reps: "20", iso: "2s topo", tecnicas: ["MYO ACT"] },
        { label: "MINI × 4", reps: "5 cada", iso: "2s", tecnicas: ["MYO MINI"] },
      ],
      rodadas_myo: 2,
      descanso_mini: "5 respirações",
      intervalo: "5 respirações",
    },
    {
      numero: 3,
      nome: "Abdutora Polia — Tornozeleira Em Pé",
      musculo_alvo: "Glúteo Médio",
      protocolo: "UNI + MYO-REPS",
      tipo: "isolacao",
      series_total: "3 × 15 cada",
      iso: "2s lateral",
      intervalo: "60s",
    },
    {
      numero: 4,
      nome: "Extensão Quadril 45° — Máquina",
      musculo_alvo: "Glúteo Máximo",
      protocolo: "RPT — 3 séries descendentes",
      tipo: "isolacao",
      restricao: "LOMBAR",
      series: [
        { label: "S1", reps: "15", iso: "2s extensão", tecnicas: ["ISO", "SAFE"] },
        { label: "S2", reps: "18", iso: "2s extensão", tecnicas: [] },
        { label: "S3", reps: "20", iso: "2s extensão", tecnicas: [] },
      ],
      intervalo: "60s",
      notas: "Carga diminui a cada série.",
    },
    {
      numero: 5,
      nome: "Passada Reversa — Halteres Leves",
      musculo_alvo: "Glúteo / Quadríceps",
      protocolo: "UNI + PAUSE",
      tipo: "composto",
      restricao: "JOELHO",
      series_total: "3 × 10 cada",
      iso: "2s fundo (PAUSE)",
      intervalo: "75s",
      notas: "40% menos carga patelofemoral vs. passada frontal. Pausa 2s no fundo.",
    },
    {
      numero: 6,
      nome: "Panturrilha Sentada",
      musculo_alvo: "Sóleo",
      protocolo: "Séries Retas",
      tipo: "isolacao",
      series_total: "3 × 20",
      iso: "2s topo",
      intervalo: "45s",
      notas: "Sóleo ativado com joelho 90°. Halteres nas coxas.",
    },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// CARDIO & HIIT
// ════════════════════════════════════════════════════════════════════════════
const CARDIO = {
  progressao_sprints: [
    {
      semanas: "1–2",
      fase: "Adaptação",
      velocidade_kmh: "8–9",
      num_tiros: 5,
      duracao_sprint_s: 20,
      duracao_walk_s: 70,
      ratio: "1:3,5",
      total_min: 12,
      recuperacao_kmh: 4,
      nota: "Se dor ≥ 4/10 no joelho → usar esteira inclinada 8–12° a 6 km/h.",
    },
    {
      semanas: "3–4",
      fase: "Desenvolvimento",
      velocidade_kmh: "9–10",
      num_tiros: 6,
      duracao_sprint_s: 25,
      duracao_walk_s: 60,
      ratio: "1:2,4",
      total_min: 12,
    },
    {
      semanas: "5–6",
      fase: "Intensificação",
      velocidade_kmh: "10–11",
      num_tiros: 7,
      duracao_sprint_s: 30,
      duracao_walk_s: 50,
      ratio: "1:1,7",
      total_min: 13,
    },
    {
      semanas: "7–8",
      fase: "Pico",
      velocidade_kmh: "11–12",
      num_tiros: 8,
      duracao_sprint_s: 35,
      duracao_walk_s: 40,
      ratio: "1:1,1",
      total_min: 14,
    },
  ],
  hiit_circuito: {
    nome: "Circuito HIIT Pós-Treino A/B/D — 12 min (sem. 3+)",
    etapas: [
      { numero: 1, exercicio: "Corda básica (2 pés)", tempo: "30s ON / 20s OFF", nota: "Core ativo · assoalho pélvico · substitua por marcha alta se joelho doer" },
      { numero: 2, exercicio: "Sprint esteira", tempo: "ver protocolo sprint", nota: "Velocidade da fase atual" },
      { numero: 3, exercicio: "Corda ou marcha alta", tempo: "30s ON / 20s OFF", nota: "Manter FC elevada" },
      { numero: 4, exercicio: "Jumping jack com braços", tempo: "20s ON / 20s OFF", nota: "Sem. 1–4: sem sair do chão · Sem. 5+: pode pular" },
      { numero: 5, exercicio: "Step box 15cm (sem. 1–4) / Box jump baixo (sem. 7–8 se joelho ok)", tempo: "30s ON / 20s OFF", nota: "Aterrissar com joelhos semiflexos" },
      { numero: 6, exercicio: "Sprint esteira — tiro final", tempo: "ver protocolo", nota: "Máximo esforço do dia" },
      { numero: 7, exercicio: "Desaceleração — caminhada", tempo: "2 min", nota: "4 km/h · FC abaixo de 120 bpm" },
    ],
  },
  eliptico_dia_c: {
    duracao_min: 15,
    intensidade: "65–70% FC máx.",
    formula_fc: "220 − idade × 0,67",
    nota: "Sem sprints. Zero impacto articular. Mais seguro para joelhos.",
  },
};

// ════════════════════════════════════════════════════════════════════════════
// ABDOMEN — Protocolo Diastase
// ════════════════════════════════════════════════════════════════════════════
const ABDOMEN = {
  titulo: "Protocolo Abdominal — Diastase Confirmada",
  alerta: "Crunch, sit-up e qualquer buchamento na linha alba são PROIBIDOS nas 8 semanas.",
  objetivo: "Restaurar tensão funcional da linha alba via TVA + oblíquo interno. Saltos só após sem. 5 com checagem visual.",
  fases: [
    {
      semanas: "1–2",
      nome: "Fase 1 — Ativação Profunda e Respiração",
      duracao_min: 7,
      impacto: "zero",
      exercicios: [
        { numero: 1, nome: "Respiração Diafragmática + TVA", series: "3 × 10 resp.", desc: "Inspire expansão costas laterais. Expire: umbigo→lombar, ativa assoalho pélvico. Sem mover pelve." },
        { numero: 2, nome: "Dead Bug — Braço Apenas", series: "3 × 8 cada", desc: "Pernas em 90°, apenas o braço se estende. Lombar SEMPRE no chão." },
        { numero: 3, nome: "Bird Dog em 4 Apoios — Hold 3s", series: "3 × 8 cada", desc: "Braço + perna opostos paralelos ao chão. Hold 3s. Seguro para lombar sensível." },
        { numero: 4, nome: "Glute Bridge Isométrico (foco TVA)", series: "3 × 25s", desc: "Ative o abdome profundo ANTES de elevar o quadril." },
      ],
    },
    {
      semanas: "3–4",
      nome: "Fase 2 — Estabilização e Prancha",
      duracao_min: 8,
      impacto: "zero",
      exercicios: [
        { numero: 1, nome: "Dead Bug Completo", series: "3 × 10 cada", desc: "Braço + perna opostos simultâneos. Expiração total ao estender. Lombar colada." },
        { numero: 2, nome: "Prancha Frontal Antebraço — Estática", series: "3 × 20–30s", desc: "Pelve neutra. NÃO prender respiração. Meta: sem.3=20s, sem.4=30s." },
        { numero: 3, nome: "Side Plank Modificado (joelho no chão)", series: "3 × 20s cada", desc: "Apoio no joelho. Progressão: sem.4→apoio no pé." },
        { numero: 4, nome: "Prancha Alta — Toque de Ombro", series: "3 × 8 cada", desc: "Anti-rotação, oblíquo externo sem crunch. Pelve não rota." },
      ],
    },
    {
      semanas: "5–6",
      nome: "Fase 3 — Força + Impacto Baixo (condicional)",
      duracao_min: 9,
      impacto: "baixo",
      exercicios: [
        { numero: 1, nome: "Prancha Frontal Progressiva", series: "3 × 40–50s", desc: "Sem.5=40s, sem.6=50s. Respiração contínua obrigatória." },
        { numero: 2, nome: "Side Plank No Pé — Estático", series: "3 × 25s cada", desc: "Versão completa. Oblíquo interno." },
        { numero: 3, nome: "Corda — Simulação sem Salto", series: "3 × 30s", desc: "Movimentos de braço de corda, pés alternando levemente sem sair do chão." },
        { numero: 4, nome: "Jumping Jack Modificado — Sem Salto", series: "3 × 20", desc: "Abertura lateral sem pular. Ative assoalho pélvico antes. Condicional: sem buchamento." },
      ],
    },
    {
      semanas: "7–8",
      nome: "Fase 4 — Funcional + Saltos (condicional IR <2,5 cm)",
      duracao_min: 10,
      impacto: "moderado",
      exercicios: [
        { numero: 1, nome: "Side Plank Dinâmico — Elevação de Quadril", series: "3 × 10 cada", desc: "Desce o quadril ao chão e sobe." },
        { numero: 2, nome: "Corda Básica — 2 Pés (condicional)", series: "3 × 30s", desc: "SOMENTE se: sem buchamento na linha alba, DIR < 2,5 cm. Ativa assoalho pélvico ANTES." },
        { numero: 3, nome: "Step Box Rítmico (15–20 cm)", series: "3 × 20 passos", desc: "Subida e descida alternada no step. Não é salto. Aterrissar com joelho semiflexo.", restricao: "JOELHO" },
        { numero: 4, nome: "Jumping Jack Completo (condicional joelho + diastase)", series: "3 × 15", desc: "Somente se joelho tolerou step box SEM dor e DIR ok." },
      ],
    },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// NUTRIÇÃO & SUPLEMENTAÇÃO
// ════════════════════════════════════════════════════════════════════════════
const NUTRICAO = {
  calorias: {
    tmb_kcal: 1390,
    tdee_kcal: 2100,
    fator_atividade: 1.55,
    alvo_perda_gordura_kcal: 1950,
    deficit_kcal: 300,
    gasto_hiit_kcal: 350,
    proteina_g_min: 132,
    proteina_g_max: 144,
    proteina_g_por_kg_min: 2.2,
    proteina_g_por_kg_max: 2.4,
    carboidratos_g: 210,
    gorduras_g: 60,
  },
  distribuicao_dia_treino: {
    pre_treino: { calorias: "400–450 kcal", janela_h: "1–2h antes", composicao: "CHO + proteína" },
    intra_treino: { calorias: "120–150 kcal", composicao: "maltodextrina + Gatorade" },
    pos_treino: { calorias: "400 kcal", janela_min: 45, composicao: "CHO + 30g proteína" },
    demais_refeicoes: "distribuídas em 2 refeições",
  },
  dias_descanso: "Retirar calorias intra-treino e reduzir CHO em ~60g",
  suplementos: [
    {
      nome: "Creatina Monohidratada",
      evidencia: "Nível A",
      fases: [
        { fase: "Carga (Sem 1)", dose: "20g/dia divididos em 4× 5g", horarios: ["café manhã", "almoço", "pré-treino", "pós-treino"], duracao_dias: 7 },
        { fase: "Manutenção (Sem 2–8)", dose: "5g/dia", horario: "shake pós-treino (ou com CHO nos dias sem treino)" },
      ],
      nota: "Retém ~1–2 kg de água na 1ª semana — não é gordura, é necessário para os benefícios. Sinergia com hiperhidratação.",
    },
    {
      nome: "Maltodextrina — Intra-Treino",
      quando: "SOMENTE durante o treino (início até fim do HIIT)",
      dose_g_min: 25,
      dose_g_max: 35,
      dissolucao: "350–400ml de água fria",
      nota: "Não usar em dias de descanso. Pode misturar com Gatorade.",
      beneficio: "Reduz cortisol ~20% (Haff 2003)",
    },
    {
      nome: "Gatorade / Repositor de Eletrólitos",
      quando: "Exclusivamente durante o treino — especialmente dias de HIIT/sprints",
      dose_ml_min: 350,
      dose_ml_max: 500,
      nota: "ESSENCIAL com hiperhidratação ativa para prevenir hiponatremia. Pitada de sal rosa nas demais doses de água (1/8 colher de chá a cada 2ª dose).",
    },
  ],
  hiperhidratacao: {
    duracao_semanas: 2,
    volume_total_dia_l: 6.65,
    doses: 19,
    volume_por_dose_ml: 350,
    intervalo_min: 30,
    horario_inicio: "08:00",
    horario_fim: "17:00",
    gatorade_intra_ml: 400,
    alerta: "Hiperhidratação >4L/dia sem reposição de sódio pode causar hiponatremia. Usar com Gatorade e sal nas refeições. Protocolo MÁXIMO 2 semanas.",
    mecanismo: "Expansão do volume plasmático aumenta perfusão tecidual e mobilização de ácidos graxos livres. Efeito modesto — principal mecanismo é déficit calórico + HIIT.",
  },
};

// ════════════════════════════════════════════════════════════════════════════
// PERIODIZAÇÃO — 8 SEMANAS
// ════════════════════════════════════════════════════════════════════════════
const PERIODIZACAO = {
  fases: [
    { semanas: "1–2", nome: "Adaptação", protocolo_composto: "RPT", carga_top_set_pct: "65–68%", iso_top_set_s: 3, myo_reps: "2 séries", sprint_kmh: "8–9", tiros: "5×20s", hiperhidratacao: true, creatina: "Carga 20g" },
    { semanas: "3–4", nome: "Consolidação", protocolo_composto: "RPT", carga_top_set_pct: "70–72%", iso_top_set_s: 4, myo_reps: "2 rodadas", sprint_kmh: "9–10", tiros: "6×25s", hiperhidratacao: false, creatina: "Manutenção 5g/dia" },
    { semanas: "5–6", nome: "Hipertrofia", protocolo_composto: "Pirâmide Dupla", carga_top_set_pct: "73–75%", iso_top_set_s: "4–5", myo_reps: "2–3 rodadas", sprint_kmh: "10–11", tiros: "7×30s", hiperhidratacao: false, creatina: "Manutenção 5g/dia" },
    { semanas: "7–8", nome: "Intensificação", protocolo_composto: "Pirâmide Dupla", carga_top_set_pct: "75–78%", iso_top_set_s: 5, myo_reps: "3 rodadas", sprint_kmh: "11–12", tiros: "8×35s", hiperhidratacao: false, creatina: "Manutenção 5g/dia" },
  ],
  malto_intra: "25–35g por treino (todo o protocolo)",
  deload: "Programado na semana 4 ou 5 se: fadiga acumulada, queda de performance, dor articular persistente ou sono ruim. Reduzir volume 40%, carga 20%, manter frequência.",
  expectativas_2_meses: "Perda de 2–4 kg de gordura corporal · Ganho ou manutenção de 0,5–1 kg de massa muscular · Melhora visível de definição em glúteos, coxa e flancos. A balança pode pouco variar nas primeiras 2 semanas (creatina + hiperhidratação) — usar fotos e medidas.",
  abd_por_fase: [
    { semanas: "1–2", fase_abd: "F1 — TVA" },
    { semanas: "3–4", fase_abd: "F2 — Prancha" },
    { semanas: "5–6", fase_abd: "F3 — Low-impact" },
    { semanas: "7–8", fase_abd: "F4 — Condicional" },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL DE SEED
// ════════════════════════════════════════════════════════════════════════════
async function runSeed() {
  console.log("🔐 Autenticando usuário...");

  let userCredential;
  try {
    console.log("👤 Tentando criar usuário...");
    userCredential = await createUserWithEmailAndPassword(
      auth,
      "Laracri1706@gmail.com",
      "meurafa123"
    );
    console.log("✅ Usuário criado com sucesso!");
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log("ℹ️  Usuário já existe. Fazendo login...");
      try {
        userCredential = await signInWithEmailAndPassword(
          auth,
          "Laracri1706@gmail.com",
          "meurafa123"
        );
      } catch (loginErr) {
        console.error("❌ Falha no login:", loginErr.message);
        process.exit(1);
      }
    } else {
      console.error("❌ Falha ao criar usuário:", err.message);
      process.exit(1);
    }
  }

  const uid = userCredential.user.uid;
  console.log(`✅ Autenticado! UID: ${uid}`);

  // Caminho base no Firestore: users/{uid}/protocolo/
  const basePath = `users/${uid}/protocolo`;

  try {
    console.log("\n📦 Gravando metadados do protocolo...");
    await setDoc(doc(db, basePath, "meta"), PROTOCOLO_META);

    console.log("📅 Gravando grade semanal...");
    await setDoc(doc(db, basePath, "grade_semanal"), { dias: GRADE_SEMANAL });

    console.log("💪 Gravando Treino A...");
    await setDoc(doc(db, basePath, "treino_A"), TREINO_A);

    console.log("💪 Gravando Treino B...");
    await setDoc(doc(db, basePath, "treino_B"), TREINO_B);

    console.log("💪 Gravando Treino C...");
    await setDoc(doc(db, basePath, "treino_C"), TREINO_C);

    console.log("💪 Gravando Treino D...");
    await setDoc(doc(db, basePath, "treino_D"), TREINO_D);

    console.log("🏃 Gravando Cardio & HIIT...");
    await setDoc(doc(db, basePath, "cardio"), CARDIO);

    console.log("🧘 Gravando Protocolo Abdominal...");
    await setDoc(doc(db, basePath, "abdomen"), ABDOMEN);

    console.log("🥗 Gravando Nutrição & Suplementação...");
    await setDoc(doc(db, basePath, "nutricao"), NUTRICAO);

    console.log("📈 Gravando Periodização 8 Semanas...");
    await setDoc(doc(db, basePath, "periodizacao"), PERIODIZACAO);

    // Coleção de progresso semanal (inicializada vazia para cada semana)
    console.log("\n📊 Inicializando coleção de progresso semanal...");
    const batch = writeBatch(db);
    for (let sem = 1; sem <= 8; sem++) {
      const semRef = doc(db, `users/${uid}/progresso`, `semana_${sem}`);
      batch.set(semRef, {
        semana: sem,
        concluido: false,
        treinos_realizados: [],
        observacoes: "",
        peso_kg: null,
        fotos_tiradas: false,
        createdAt: new Date().toISOString(),
      });
    }
    await batch.commit();

    console.log("\n✅ SEED COMPLETO! Todos os dados foram enviados ao Firebase.");
    console.log(`\n📂 Estrutura criada em: users/${uid}/protocolo/`);
    console.log("   ├── meta");
    console.log("   ├── grade_semanal");
    console.log("   ├── treino_A");
    console.log("   ├── treino_B");
    console.log("   ├── treino_C");
    console.log("   ├── treino_D");
    console.log("   ├── cardio");
    console.log("   ├── abdomen");
    console.log("   ├── nutricao");
    console.log("   └── periodizacao");
    console.log(`\n📂 Progresso em: users/${uid}/progresso/`);
    console.log("   └── semana_1 ... semana_8");

  } catch (err) {
    console.error("❌ Erro ao gravar dados:", err);
    process.exit(1);
  }

  process.exit(0);
}

runSeed();
