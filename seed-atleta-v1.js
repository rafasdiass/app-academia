/**
 * seed-completo.js
 * Cria o usuário e envia o WorkoutPlan como UM ÚNICO documento.
 *
 * Estrutura Firestore:
 *   workoutPlans/{planId}   ← documento completo (WorkoutPlan)
 *   users/{uid}             ← UserProfile (planId aponta para cima)
 *
 * Dependências: npm install firebase
 * Uso:          node seed-completo.js
 */

const { initializeApp }                          = require('firebase/app')
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth')
const { getFirestore, doc, setDoc }              = require('firebase/firestore')
const fs   = require('fs')
const path = require('path')

// ── Lê firebaseConfig do environment.ts ─────────────────────────
const envPath = path.resolve(__dirname, 'src/environments/environment.ts')
const envText = fs.readFileSync(envPath, 'utf8')
const match   = envText.match(/firebase\s*:\s*(\{[\s\S]*?\})/)
if (!match) { console.error('Bloco firebase nao encontrado no environment.ts'); process.exit(1) }

const firebaseConfig = JSON.parse(
  match[1]
    .replace(/(\/\/[^\n]*)/g, '')
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
    .replace(/'/g, '"')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
)

const app  = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db   = getFirestore(app)

// ── Credenciais ──────────────────────────────────────────────────
const EMAIL   = 'laracri1706@gmail.com'
const SENHA   = 'meurafa123'
const PLAN_ID = 'plano-atleta-v1'

// ════════════════════════════════════════════════════════════════
// WORKOUT PLAN — espelho exato de WorkoutPlan interface
// ════════════════════════════════════════════════════════════════
const WORKOUT_PLAN = {

  id:            PLAN_ID,
  name:          '8 Semanas - Hipertrofia Inferiores + Corpo Total',
  subtitle:      'RPT + Myo-reps + Piramide Dupla - Cardio HIIT - Abdomen Diastase - Nutricao de precisao',
  durationWeeks: 8,
  createdBy:     'admin',

  athlete: { weightKg: 60, heightCm: 165, ageYears: 30 },

  kpis: [
    { value: '50', label: 'min forca',   sub: "+ 12-15' HIIT"   },
    { value: '4x', label: 'dias/sem',    sub: 'A - B - C - D'   },
    { value: '2x', label: 'gluteos/sem', sub: 'frequencia ideal' },
  ],

  tags: [
    { key: 'peso',     label: '60 kg - 1,65 m',           cssClass: 'tr'  },
    { key: 'proto',    label: 'RPT + Myo-reps',            cssClass: 'tt'  },
    { key: 'diastase', label: 'Diastase confirmada',       cssClass: 'ta'  },
    { key: 'joelho',   label: 'Joelho protegido',          cssClass: 'trd' },
    { key: 'lombar',   label: 'Lombar sensivel',           cssClass: 'to'  },
    { key: 'piramide', label: 'Piramide Reversa',          cssClass: 'tp'  },
    { key: 'hiit',     label: 'HIIT - Corda - Sprints',    cssClass: 'tg'  },
    { key: 'hidrat',   label: 'Hiperhidratacao 2 sem',     cssClass: 'tpk' },
    { key: 'supl',     label: 'Creatina - Malto - Gatorade', cssClass: 'tb' },
  ],

  restrictions: [
    { key: 'joelho',   label: 'Joelho',   description: 'Amplitude max. 90 graus em todos exercicios. Sem saltos de alto impacto. Passada reversa no lugar da frontal.' },
    { key: 'lombar',   label: 'Lombar',   description: 'RDL amplitude parcial. Desenvolvimento sentada. Core ativo antes de todo hip hinge.' },
    { key: 'diastase', label: 'Diastase', description: 'Sem crunch/sit-up. Sem buchamento na linha alba. Saltos condicionais a fase 3 (sem. 5+).' },
  ],

  weekSchedule: [
    { day: 'Seg', treinoType: 'A',  cardio: 'Sprint HIIT',   rest: false },
    { day: 'Ter', treinoType: 'B',  cardio: 'Sprint HIIT',   rest: false },
    { day: 'Qua', treinoType: null, cardio: null,             rest: true,  restNote: 'Mobilidade leve' },
    { day: 'Qui', treinoType: 'C',  cardio: "Eliptico 15'",  rest: false },
    { day: 'Sex', treinoType: null, cardio: null,             rest: true,  restNote: "Caminhada 30'" },
    { day: 'Sab', treinoType: 'D',  cardio: 'Sprint HIIT',   rest: false },
    { day: 'Dom', treinoType: null, cardio: null,             rest: true,  restNote: 'Descanso total' },
  ],

  periodization: [
    { week:1, phase:'Adaptacao',      protocol:'RPT',        loadTopSetPct:65, isoTopSetSec:3, myoRounds:2, sprintKmh:'8-9',   sprintTiros:5, sprintSec:20, walkSec:70, hiperhidration:true,  creatine:'Carga 20g',     malto:'25-35g/treino', abdPhase:'F1 - TVA'         },
    { week:2, phase:'Adaptacao',      protocol:'RPT',        loadTopSetPct:68, isoTopSetSec:3, myoRounds:2, sprintKmh:'9',     sprintTiros:5, sprintSec:20, walkSec:70, hiperhidration:true,  creatine:'Manutencao 5g', malto:'25-35g/treino', abdPhase:'F1 - TVA'         },
    { week:3, phase:'Consolidacao',   protocol:'RPT',        loadTopSetPct:70, isoTopSetSec:4, myoRounds:2, sprintKmh:'9-10',  sprintTiros:6, sprintSec:25, walkSec:60, hiperhidration:false, creatine:'Manutencao 5g', malto:'25-35g/treino', abdPhase:'F2 - Prancha'     },
    { week:4, phase:'Consolidacao',   protocol:'RPT',        loadTopSetPct:72, isoTopSetSec:4, myoRounds:2, sprintKmh:'10',    sprintTiros:6, sprintSec:25, walkSec:60, hiperhidration:false, creatine:'Manutencao 5g', malto:'25-35g/treino', abdPhase:'F2 - Prancha'     },
    { week:5, phase:'Hipertrofia',    protocol:'PiramDupla', loadTopSetPct:73, isoTopSetSec:4, myoRounds:2, sprintKmh:'10-11', sprintTiros:7, sprintSec:30, walkSec:50, hiperhidration:false, creatine:'Manutencao 5g', malto:'25-35g/treino', abdPhase:'F3 - Low-impact'  },
    { week:6, phase:'Hipertrofia',    protocol:'PiramDupla', loadTopSetPct:75, isoTopSetSec:5, myoRounds:3, sprintKmh:'11',    sprintTiros:7, sprintSec:30, walkSec:50, hiperhidration:false, creatine:'Manutencao 5g', malto:'25-35g/treino', abdPhase:'F3 - Low-impact'  },
    { week:7, phase:'Intensificacao', protocol:'PiramDupla', loadTopSetPct:75, isoTopSetSec:5, myoRounds:3, sprintKmh:'11-12', sprintTiros:8, sprintSec:35, walkSec:40, hiperhidration:false, creatine:'Manutencao 5g', malto:'25-35g/treino', abdPhase:'F4 - Condicional' },
    { week:8, phase:'Intensificacao', protocol:'PiramDupla', loadTopSetPct:78, isoTopSetSec:5, myoRounds:3, sprintKmh:'12',    sprintTiros:8, sprintSec:35, walkSec:40, hiperhidration:false, creatine:'Manutencao 5g', malto:'25-35g/treino', abdPhase:'F4 - Condicional' },
  ],

  nutrition: {
    tmb: 1390, tdee: 2100, hiitBonus: 350, targetKcal: 1950, deficit: 300,
    proteinG:     { min: 132, max: 144 },
    carbsG:       210,
    fatG:         60,
    proteinPerKg: { min: 2.2, max: 2.4 },
    distribution: {
      preTreino:   { kcal: '400-450', note: '1-2h antes - CHO + proteina' },
      intraTreino: { kcal: '120-150', note: 'maltodextrina + Gatorade'    },
      posTreino:   { kcal: 400,       note: 'ate 45 min - CHO + 30g prot.' },
      restDay:     'Retire intra e reduza CHO em ~60g',
    },
    scienceNotes: [
      'Wilson et al. (2012): deficit max. seguro 300-400 kcal para preservar massa com HIIT.',
      'Phillips & Van Loon (2011): 2,2-2,4 g/kg/dia de proteina com treino concorrente.',
      'Haff et al. (2003): 40-60g CHO intra-treino reduz cortisol ~20%.',
      'Candow et al. (2011): creatina com treino concorrente preserva massa magra.',
    ],
  },

  hydration: {
    protocol:        'hiperhidratacao',
    durationWeeks:   2,
    totalLitersDay:  6.65,
    dosesMl:         350,
    dosesCount:      19,
    scheduleStart:   '08:00',
    scheduleEnd:     '17:00',
    intervalMin:     30,
    gatoradeIntraMl: 400,
    saltPerDose:     '1/8 colher de cha a cada 2a dose',
    warning:         'Hiperhidratacao sem sodio pode causar hiponatremia. Use Gatorade e sal. Max. 2 semanas.',
    mechanism:       'Expansao plasmatica aumenta perfusao e mobilizacao de AGL. 350ml gelados elevam TMB ~30 kcal/dia.',
  },

  supplements: [
    {
      name: 'Creatina Monohidratada', icon: '💊', color: 'purple',
      evidence: 'Nivel A - Segura - Preserva massa com cardio',
      phases: [
        { label: 'Fase Carga (Sem 1)',   color: 'rose', body: '20g/dia divididos em 4x 5g - cafe manha, almoco, pre-treino, pos-treino. Duracao: 7 dias.' },
        { label: 'Manutencao (Sem 2-8)', color: 'teal', body: '5g/dia misturado no shake pos-treino. Dias sem treino: com qualquer refeicao com carboidrato.' },
      ],
      dosages: [
        { value: '20g',   label: 'carga diaria (7 dias)'    },
        { value: '5g',    label: 'manutencao/dia'           },
        { value: '+2 kg', label: 'retencao hidrica 1a sem.' },
      ],
      note: 'Creatina + hiperhidratacao: sinergia - musculo melhor hidratado. Retencao de 1-2 kg na 1a semana NAO e gordura.',
    },
    {
      name: 'Maltodextrina - Intra-Treino Apenas', icon: '⚡', color: 'amber',
      evidence: 'CHO rapido - Glicogenio sparing - Reduz cortisol durante esforco',
      phases: [
        { label: 'Quando usar', color: 'amber', body: 'SOMENTE durante o treino (inicio ate fim do HIIT). Beber em goles ao longo dos 60-65 min.' },
        { label: 'Dose',        color: 'amber', body: '25-35g por treino dissolvidos em 350-400ml de agua fria. Pode misturar com Gatorade. Nao usar em dias de descanso.' },
      ],
      dosages: [
        { value: '25-35g',   label: 'por treino'          },
        { value: '~100-140', label: 'kcal intra-treino'   },
        { value: '-20%',     label: 'cortisol (Haff 2003)' },
      ],
      note: 'Malto + Gatorade: 25g malto + 200ml Gatorade + 200ml agua = bebida intra-treino completa com CHO + sodio + potassio.',
    },
    {
      name: 'Gatorade / Repositor de Eletrolitos', icon: '🥤', color: 'green',
      evidence: 'Sodio - Potassio - Hidratacao durante esforco - obrigatorio com hiperhidratacao',
      phases: [
        { label: 'Quando usar', color: 'green', body: 'Exclusivamente durante o treino, especialmente nos dias de HIIT/sprints. Com hiperhidratacao ativa e ESSENCIAL.' },
        { label: 'Dose',        color: 'green', body: '350-500ml de Gatorade durante a sessao. Adicionar pitada de sal a cada 2a dose de agua ao longo do dia.' },
      ],
      dosages: [],
      note: 'Pitada de sal nas doses de agua: ~1/8 col. cha em metade das 19 doses diarias previne diluicao excessiva do sodio plasmatico.',
    },
  ],

  cardio: {
    principle: 'Aquecimento funcional -> forca -> HIIT. Forca antes do cardio preserva hipertrofia (Wilson 2012, Robineau 2016).',
    sprintPhases: [
      { weeks: '1-2', phase: 'Adaptacao',      kmh: '8-9',   tiros: 5, sprintSec: 20, walkSec: 70, ratio: '1:3,5', totalMin: 12, note: 'Se dor >= 4/10 no joelho, esteira inclinada 8-12 graus 6 km/h por 2 semanas.' },
      { weeks: '3-4', phase: 'Desenvolvimento', kmh: '9-10',  tiros: 6, sprintSec: 25, walkSec: 60, ratio: '1:2,4', totalMin: 12, note: null },
      { weeks: '5-6', phase: 'Intensificacao',  kmh: '10-11', tiros: 7, sprintSec: 30, walkSec: 50, ratio: '1:1,7', totalMin: 13, note: null },
      { weeks: '7-8', phase: 'Pico',            kmh: '11-12', tiros: 8, sprintSec: 35, walkSec: 40, ratio: '1:1,1', totalMin: 14, note: null },
    ],
    hiitCircuit: {
      name: 'Circuito HIIT Pos-Treino A/B/D - 12 min (sem. 3+)',
      steps: [
        { num: '1', name: 'Corda basica (2 pes)',                           note: 'Core ativo - assoalho pelvico - substitua por marcha alta se joelho doer', time: '30s ON / 20s OFF' },
        { num: '2', name: 'Sprint esteira',                                 note: 'Velocidade da fase atual do protocolo',                                    time: 'ver protocolo'    },
        { num: '3', name: 'Corda ou marcha alta',                           note: 'Segundo bloco - manter frequencia cardiaca',                               time: '30s ON / 20s OFF' },
        { num: '4', name: 'Jumping jack com bracos (sem pulo F1-F2)',        note: 'Sem. 1-4: sem sair do chao. Sem. 5+: pode pular',                         time: '20s ON / 20s OFF' },
        { num: '5', name: 'Step box 15cm (sem. 1-4) ou Box jump (sem. 7-8)', note: 'Aterrissar com joelhos semiflexos',                                      time: '30s ON / 20s OFF' },
        { num: '6', name: 'Sprint esteira - tiro final',                     note: 'Maximo esforco do dia',                                                   time: 'ver protocolo'    },
        { num: '7', name: 'Desaceleracao - caminhada',                       note: '4 km/h - FC abaixo de 120 bpm',                                          time: '2 min'            },
      ],
    },
    dayC:     'Eliptico 15 min - estado estavel 65-70% FC max. Sem sprints. Zero impacto articular.',
    kneeNote: 'Sprints ate 25s a velocidade moderada sao tolerados. Alternativa: esteira inclinada 8-12 graus a 6-7 km/h = gasto calorico equivalente.',
  },

  abdomen: {
    warning: 'Diastase confirmada: crunch, sit-up e qualquer exercicio que crie buchamento na linha alba estao PROIBIDOS. Objetivo: restaurar tensao funcional da linha alba via TVA + obliquo interno.',
    stopIf:  'Buchamento visual na linha alba. Dor ou pressao no assoalho pelvico. Dor lombar que piora. Consulte fisioterapeuta especializado em saude pelvica.',
    phases: [
      {
        weeks: '1-2', phase: 'Fase 1 - Ativacao Profunda e Respiracao', duration: '~7 min - zero impacto - zero pressao',
        exercises: [
          { num: '01', name: 'Respiracao Diafragmatica + TVA',           desc: 'Inspire expandindo costelas laterais. Expire: umbigo para lombar, ative assoalho pelvico. Sem mover pelve.',                                sets: '3 x 10 resp.' },
          { num: '02', name: 'Dead Bug - Braco Apenas (versao inicial)', desc: 'Pernas em 90 graus, apenas o braco se estende. Lombar SEMPRE no chao. Progredir para versao completa na sem. 3 se sem buchamento.',         sets: '3 x 8 cada'   },
          { num: '03', name: 'Bird Dog em 4 Apoios - Hold 3s',           desc: 'Braco + perna opostos paralelos ao chao. Hold 3s. Fortalece multifidos sem extensao ativa da lombar.',                                       sets: '3 x 8 cada'   },
          { num: '04', name: 'Glute Bridge Isometrico (foco TVA)',        desc: 'Nao e por gluteo - e por coordenacao TVA + quadril. Ative o abdome profundo antes de elevar.',                                              sets: '3 x 25s'      },
        ],
      },
      {
        weeks: '3-4', phase: 'Fase 2 - Estabilizacao e Prancha', duration: '~8 min - sem impacto - baixa pressao',
        exercises: [
          { num: '01', name: 'Dead Bug Completo (condic. sem buchamento)', desc: 'Braco + perna opostos simultaneos. Expiracao total ao estender. Lombar colada.',                                                           sets: '3 x 10 cada'  },
          { num: '02', name: 'Prancha Frontal Antebraco - Estatica',       desc: 'Pelve neutra, respiracao continua. NAO prender respiracao (aumenta PIA). Meta: sem. 3 = 20s, sem. 4 = 30s.',                              sets: '3 x 20-30s'   },
          { num: '03', name: 'Side Plank Modificado (joelho no chao)',      desc: 'Apoio no joelho, nao no pe. Obliquo interno. Progressao: sem. 4 -> apoio no pe.',                                                         sets: '3 x 20s cada' },
          { num: '04', name: 'Prancha Alta - Toque de Ombro',              desc: 'Anti-rotacao - treina obliquo externo sem crunch. Pelve nao rota. Respiracao continua.',                                                   sets: '3 x 8 cada'   },
        ],
      },
      {
        weeks: '5-6', phase: 'Fase 3 - Forca + Impacto Baixo (condicional)', duration: '~9 min - impacto baixo - condicional',
        exercises: [
          { num: '01', name: 'Prancha Frontal Progressiva',              desc: 'Sem. 5 = 40s, sem. 6 = 50s. Respiracao continua obrigatoria.',                                                                               sets: '3 x 40-50s'   },
          { num: '02', name: 'Side Plank No Pe - Estatico',             desc: 'Versao completa. Quadril elevado. Foco total no obliquo interno.',                                                                            sets: '3 x 25s cada' },
          { num: '03', name: 'Corda - Simulacao sem Salto',             desc: 'Movimentos de braco de corda, pes alternando levemente sem sair do chao. Introduz ritmo sem impacto.',                                       sets: '3 x 30s'      },
          { num: '04', name: 'Jumping Jack Modificado - Sem Salto',     desc: 'Abertura lateral de pernas sem pular. Ative assoalho pelvico antes. Condicional: sem buchamento nas fases anteriores.',                      sets: '3 x 20'       },
        ],
      },
      {
        weeks: '7-8', phase: 'Fase 4 - Funcional + Saltos (condicional IR menor 2,5 cm)', duration: '~10 min - impacto moderado',
        exercises: [
          { num: '01', name: 'Side Plank Dinamico - Elevacao de Quadril', desc: 'Desce o quadril ao chao e sobe. Ataque maximo ao obliquo interno/externo.',                                                                sets: '3 x 10 cada'   },
          { num: '02', name: 'Corda Basica - 2 Pes (condicional)',        desc: 'SOMENTE se: sem buchamento na linha alba, DIR < 2,5 cm. Ative assoalho pelvico ANTES.',                                                     sets: '3 x 30s'       },
          { num: '03', name: 'Step Box Ritmico 15-20 cm',                 desc: 'Subida e descida alternada no step. Seguro para joelho. Aterrissar com joelho semiflexo.',                                                  sets: '3 x 20 passos' },
          { num: '04', name: 'Jumping Jack Completo (condicional)',        desc: 'Somente se joelho tolerou step box SEM dor e DIR ok. Ative assoalho pelvico a cada salto.',                                                 sets: '3 x 15'        },
        ],
      },
    ],
  },

  advancedProtocols: {
    duplaPiramide: {
      name:      'Piramide Dupla - Semanas 5-8',
      exercises: ['Hip Thrust barra (A)', 'Leg Press 45 graus (B)'],
      steps: [
        { num: 1, pct: '65%', reps: '12-15', note: 'Aquecimento neural - nao conta volume'   },
        { num: 2, pct: '75%', reps: '8-10',  note: 'Top set ascendente - objetivo principal' },
        { num: 3, pct: '80%', reps: '6-8',   note: 'Pico - maxima intensidade'               },
        { num: 4, pct: '70%', reps: '10-12', note: 'Descida - acumula volume'                },
        { num: 5, pct: '55%', reps: '16-20', note: 'Myo-reps final: + 3 mini-series'         },
      ],
      note: 'Aplicar nas semanas 5-8 do Hip Thrust e Leg Press apenas. Treino mais longo (~58 min).',
    },
  },

  // ── treinos: TreinoBlock[] ────────────────────────────────────
  treinos: [

    // TREINO A
    {
      type: 'A', title: 'Treino A - Gluteos & Posterior de Coxa',
      subtitle: 'Exercicios compostos em RPT - Isolacoes em Myo-reps - Zero estresse de joelho/lombar',
      color: 'rose',
      stats: [
        { label: 'Duracao',         value: '~50 min', sub: '+ 12 min HIIT'           },
        { label: 'Protocolo',       value: 'RPT',     sub: '+ Myo-reps isolacoes', color: 'rose'  },
        { label: 'Series efetivas', value: '18-20',   sub: '6 exercicios'            },
        { label: 'Joelho',          value: 'Seguro',  sub: 'Hip-dominante',         color: 'green' },
      ],
      infoNote: 'Esquema RPT: Hip Thrust e RDL usam Reverse Pyramid (comecam pesado). Abdutora e Glute Bridge usam Myo-reps.',
      progressionNote: 'Regra RPT: ao conseguir o limite superior da faixa, aumente 2,5 kg e recomece no limite inferior.',
      warmup: ['Clamshell com elastico 2x12 cada','Dead bug respiratorio 1x8','Glute bridge bilateral lento 2x10','Ativacao gluteo 4 apoios + elastico 2x10','Mobilizacao quadril em circulo 1x8 cada'],
      exercises: [
        {
          id: 'a-01', name: 'Hip Thrust - Barra', muscle: 'Gluteo Maximo',
          color: 'rose', protocol: 'RPT', flag: null, totalRounds: 3,
          subtitle: 'Intervalo: 90s - Aquec. obrigatorio antes do top set',
          scienceNote: 'Aquecimento: serie A: 40% 1RM x 15 reps - serie B: 60% 1RM x 8 reps. Nao contam como series de trabalho.',
          sets: [
            { index: 1, label: 'TOP SET', loadPct: '~75%', reps: '6-8',   repsNote: 'AMRAP controlado - pes quadril, joelhos para fora', isoNote: 'ISO 4s topo',        restSec: 90, restNote: null, techBadges: ['RPT S1','ISO']      },
            { index: 2, label: 'SERIE 2', loadPct: '-10%', reps: '10-12', repsNote: 'descida 2s controlada',                              isoNote: 'ISO 3s topo',        restSec: 90, restNote: null, techBadges: ['EXC','ISO']         },
            { index: 3, label: 'SERIE 3', loadPct: '-20%', reps: '14-16', repsNote: 'falha isometrica 12s ao final',                      isoNote: 'ISO 2s + 12s final', restSec: 0,  restNote: null, techBadges: ['DROP ISO']          },
          ],
        },
        {
          id: 'a-02', name: 'RDL Halteres - Amplitude Parcial', muscle: 'Isquiotibiais / Gluteo',
          color: 'rose', protocol: 'RPT', flag: 'LOMBAR', totalRounds: 3,
          subtitle: 'Intervalo: 90s - Descida max. 55cm - Core ativo',
          scienceNote: null,
          sets: [
            { index: 1, label: 'TOP SET', loadPct: '~70%', reps: '8-10',  repsNote: 'descida 3s - pausa 2s no estiramento max.', isoNote: 'PAUSE 2s', restSec: 90, restNote: null, techBadges: ['RPT S1','PAUSE','SAFE'] },
            { index: 2, label: 'SERIE 2', loadPct: '-10%', reps: '12-14', repsNote: 'descida 2s',                                isoNote: 'PAUSE 1s', restSec: 90, restNote: null, techBadges: ['EXC']                  },
            { index: 3, label: 'SERIE 3', loadPct: '-20%', reps: '16-18', repsNote: 'ritmo moderado',                            isoNote: null,       restSec: 0,  restNote: null, techBadges: ['EXC']                  },
          ],
        },
        {
          id: 'a-03', name: 'Cadeira Abdutora', muscle: 'Gluteo Medio',
          color: 'purple', protocol: 'MYO', flag: null, totalRounds: 2,
          subtitle: 'Intervalo ativacao para mini: 5 respiracoes - 2 series Myo completas',
          scienceNote: 'Prestes et al. (2019): 11% maior hipertrofia com rest-pause vs. series tradicionais.',
          sets: [
            { index: 1, label: 'ATIVACAO', loadPct: '~60%', reps: '15-18', repsNote: 'RPE 8-9 - inclinacao +15 graus para frente', isoNote: 'ISO 2s fechado', restSec: 0, restNote: '5 respiracoes', techBadges: ['MYO ACT','ISO'] },
            { index: 2, label: 'MINI x1',  loadPct: 'mesma', reps: '4-5', repsNote: null, isoNote: 'ISO 2s', restSec: 0, restNote: '5 respiracoes', techBadges: ['MYO MINI'] },
            { index: 3, label: 'MINI x2',  loadPct: 'mesma', reps: '4-5', repsNote: null, isoNote: 'ISO 2s', restSec: 0, restNote: '5 respiracoes', techBadges: ['MYO MINI'] },
            { index: 4, label: 'MINI x3',  loadPct: 'mesma', reps: '4-5', repsNote: null, isoNote: 'ISO 2s', restSec: 0, restNote: '5 respiracoes', techBadges: ['MYO MINI'] },
            { index: 5, label: 'MINI x4',  loadPct: 'mesma', reps: '4-5', repsNote: null, isoNote: 'ISO 2s', restSec: 0, restNote: null,             techBadges: ['MYO MINI'] },
          ],
        },
        {
          id: 'a-04', name: 'Cadeira Flexora - 0-90 graus', muscle: 'Isquiotibiais',
          color: 'purple', protocol: 'MYO', flag: 'JOELHO', totalRounds: 2,
          subtitle: 'Ativacao 15r -> 4 mini x 4r',
          scienceNote: null,
          sets: [
            { index: 1, label: 'ATIVACAO', loadPct: '~60%', reps: '15', repsNote: 'RPE 8', isoNote: '2s no pico', restSec: 0, restNote: '5 resp.', techBadges: ['MYO ACT','ISO'] },
            { index: 2, label: 'MINI x1',  loadPct: 'mesma', reps: '4', repsNote: null, isoNote: '2s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 3, label: 'MINI x2',  loadPct: 'mesma', reps: '4', repsNote: null, isoNote: '2s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 4, label: 'MINI x3',  loadPct: 'mesma', reps: '4', repsNote: null, isoNote: '2s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 5, label: 'MINI x4',  loadPct: 'mesma', reps: '4', repsNote: null, isoNote: '2s', restSec: 0, restNote: null,      techBadges: ['MYO MINI'] },
          ],
        },
        {
          id: 'a-05', name: 'Kick Back Polia Baixa', muscle: 'Gluteo Maximo',
          color: 'rose', protocol: 'STRAIGHT', flag: 'LOMBAR', totalRounds: 3,
          subtitle: '3x15 cada - extensao sem hiper-ext. lombar',
          scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '15', repsNote: 'extensao sem hiperextensao lombar', isoNote: '2s extensao', restSec: 60, restNote: null, techBadges: ['UNI','ISO'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '15', repsNote: null, isoNote: '2s extensao', restSec: 60, restNote: null, techBadges: ['UNI','ISO'] },
            { index: 3, label: 'SERIE 3', loadPct: null, reps: '15', repsNote: null, isoNote: '2s extensao', restSec: 60, restNote: null, techBadges: ['UNI','ISO'] },
          ],
        },
        {
          id: 'a-06', name: 'Glute Bridge Unilateral', muscle: 'Gluteo Maximo',
          color: 'purple', protocol: 'MYO', flag: null, totalRounds: 2,
          subtitle: 'Ativacao 15r -> 4 mini x 4r - hold 3s no topo',
          scienceNote: null,
          sets: [
            { index: 1, label: 'ATIVACAO', loadPct: null, reps: '15', repsNote: 'hold 3s no topo', isoNote: '3s no topo', restSec: 0, restNote: '5 resp.', techBadges: ['MYO ACT','UNI','ISO'] },
            { index: 2, label: 'MINI x1',  loadPct: null, reps: '4',  repsNote: null, isoNote: '3s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 3, label: 'MINI x2',  loadPct: null, reps: '4',  repsNote: null, isoNote: '3s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 4, label: 'MINI x3',  loadPct: null, reps: '4',  repsNote: null, isoNote: '3s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 5, label: 'MINI x4',  loadPct: null, reps: '4',  repsNote: null, isoNote: '3s', restSec: 0, restNote: null,      techBadges: ['MYO MINI'] },
          ],
        },
      ],
    },

    // TREINO B
    {
      type: 'B', title: 'Treino B - Quadriceps, Adutores & Panturrilha',
      subtitle: 'Leg press com 1,5 rep em RPT - Extensora em Myo-reps - Amplitude max. 90 graus joelho',
      color: 'teal',
      stats: [
        { label: 'Duracao',   value: '~50 min',   sub: '+ 12 min HIIT'            },
        { label: 'Protocolo', value: 'RPT+1,5r',  sub: 'Leg press principal',  color: 'teal'  },
        { label: 'Joelho',    value: '90 MÁX',    sub: 'Regra absoluta',       color: 'amber' },
      ],
      infoNote: 'Tecnica 1,5 rep no Leg Press: desce 100% (90 graus) -> sobe ate 50% -> volta ao fundo -> sobe 100% = 1 rep.',
      progressionNote: null,
      warmup: ['Esteira 4 min (5 km/h plano)','Agachamento sumo corporal 2x10 (so ate 90 graus)','Extensao quadril em 4 apoios 1x10 cada'],
      exercises: [
        {
          id: 'b-01', name: 'Leg Press 45 graus - Pes Medios', muscle: 'Quadriceps',
          color: 'teal', protocol: 'RPT', flag: 'JOELHO', totalRounds: 3,
          subtitle: 'Intervalo: 2 min - carga mais elevada desta ficha',
          scienceNote: null,
          sets: [
            { index: 1, label: 'TOP SET', loadPct: '~75%', reps: '6-8 reps 1,5x',   repsNote: 'cada 1,5 rep = 2 movimentos', isoNote: null, restSec: 120, restNote: null, techBadges: ['RPT S1','1,5 REP'] },
            { index: 2, label: 'SERIE 2', loadPct: '-10%', reps: '10-12 reps 1,5x', repsNote: null,                           isoNote: null, restSec: 120, restNote: null, techBadges: ['1,5 REP']         },
            { index: 3, label: 'SERIE 3', loadPct: '-20%', reps: '14-16',            repsNote: 'reps normais + Myo final: 5 resp -> 3r x 3 mini', isoNote: null, restSec: 0, restNote: null, techBadges: ['+MYO'] },
          ],
        },
        {
          id: 'b-02', name: 'Cadeira Extensora', muscle: 'Quadriceps',
          color: 'purple', protocol: 'MYO', flag: 'JOELHO', totalRounds: 2,
          subtitle: 'Ativacao 18-20r -> 4 mini x 4r. 2 rodadas Myo',
          scienceNote: null,
          sets: [
            { index: 1, label: 'ATIVACAO', loadPct: '~60%', reps: '18-20', repsNote: '2 reps da falha', isoNote: '2s no topo', restSec: 0, restNote: '5 resp.', techBadges: ['MYO ACT'] },
            { index: 2, label: 'MINI x1',  loadPct: 'mesma', reps: '4', repsNote: null, isoNote: '2s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 3, label: 'MINI x2',  loadPct: 'mesma', reps: '4', repsNote: null, isoNote: '2s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 4, label: 'MINI x3',  loadPct: 'mesma', reps: '4', repsNote: null, isoNote: '2s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 5, label: 'MINI x4',  loadPct: 'mesma', reps: '4', repsNote: null, isoNote: '2s', restSec: 0, restNote: null,      techBadges: ['MYO MINI'] },
          ],
        },
        {
          id: 'b-03', name: 'Agachamento Sumo - Haltere', muscle: 'Quadriceps/Adutor',
          color: 'teal', protocol: 'PAUSE', flag: 'JOELHO', totalRounds: 3,
          subtitle: '3x15 - pes 45 graus - pausa 2s no fundo',
          scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '15', repsNote: 'pes 45 graus - joelhos seguem os pes', isoNote: '2s fundo', restSec: 75, restNote: null, techBadges: ['PAUSE','SAFE'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '15', repsNote: null, isoNote: '2s fundo', restSec: 75, restNote: null, techBadges: ['PAUSE','SAFE'] },
            { index: 3, label: 'SERIE 3', loadPct: null, reps: '15', repsNote: null, isoNote: '2s fundo', restSec: 75, restNote: null, techBadges: ['PAUSE','SAFE'] },
          ],
        },
        {
          id: 'b-04', name: 'Cadeira Adutora', muscle: 'Adutor Longo',
          color: 'purple', protocol: 'MYO', flag: null, totalRounds: 2,
          subtitle: 'Ativacao 20r -> 4 mini x 4r - perna a 45 graus',
          scienceNote: null,
          sets: [
            { index: 1, label: 'ATIVACAO', loadPct: '~60%', reps: '20', repsNote: 'perna a 45 graus para adutor longo', isoNote: '3s fechado', restSec: 0, restNote: '5 resp.', techBadges: ['MYO ACT','ISO'] },
            { index: 2, label: 'MINI x1',  loadPct: 'mesma', reps: '4', repsNote: null, isoNote: '3s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 3, label: 'MINI x2',  loadPct: 'mesma', reps: '4', repsNote: null, isoNote: '3s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 4, label: 'MINI x3',  loadPct: 'mesma', reps: '4', repsNote: null, isoNote: '3s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 5, label: 'MINI x4',  loadPct: 'mesma', reps: '4', repsNote: null, isoNote: '3s', restSec: 0, restNote: null,      techBadges: ['MYO MINI'] },
          ],
        },
        {
          id: 'b-05', name: 'Step Lateral Baixo 10-15cm', muscle: 'VMO',
          color: 'teal', protocol: 'STRAIGHT', flag: 'JOELHO', totalRounds: 3,
          subtitle: '3x12 cada - subida lenta 2s - joelho sobre 2o dedo',
          scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '12', repsNote: 'subida lenta 2s - joelho sobre 2o dedo', isoNote: '1s no topo', restSec: 60, restNote: null, techBadges: ['UNI','SAFE'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '12', repsNote: null, isoNote: '1s no topo', restSec: 60, restNote: null, techBadges: ['UNI','SAFE'] },
            { index: 3, label: 'SERIE 3', loadPct: null, reps: '12', repsNote: null, isoNote: '1s no topo', restSec: 60, restNote: null, techBadges: ['UNI','SAFE'] },
          ],
        },
        {
          id: 'b-06', name: 'Panturrilha em Pe', muscle: 'Gastrocnemio/Soleo',
          color: 'teal', protocol: 'STRAIGHT', flag: null, totalRounds: 4,
          subtitle: '4x20-25 reps (peso leve, volume alto)',
          scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '20-25', repsNote: 'excentrica controlada', isoNote: '2s topo', restSec: 45, restNote: null, techBadges: ['ISO','EXC'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '20-25', repsNote: null, isoNote: '2s topo', restSec: 45, restNote: null, techBadges: ['ISO','EXC'] },
            { index: 3, label: 'SERIE 3', loadPct: null, reps: '20-25', repsNote: null, isoNote: '2s topo', restSec: 45, restNote: null, techBadges: ['ISO','EXC'] },
            { index: 4, label: 'SERIE 3', loadPct: null, reps: '20-25', repsNote: null, isoNote: '2s topo', restSec: 45, restNote: null, techBadges: ['ISO','EXC'] },
          ],
        },
      ],
    },

    // TREINO C
    {
      type: 'C', title: 'Treino C - Superior Completo',
      subtitle: 'Series retas para manutencao - Eliptico pos-treino - Core ativo em todos os movimentos',
      color: 'blue',
      stats: [
        { label: 'Duracao',       value: '~46 min',  sub: '+ 15 min eliptico'                  },
        { label: 'Protocolo',     value: 'Straight', sub: 'Series retas (vol. moderado)', color: 'blue'  },
        { label: 'Cardio pos',    value: 'Eliptico', sub: '65-70% FC - 15 min'                 },
        { label: 'Joelho/Lombar', value: 'Seguro',   sub: 'Membros superiores',           color: 'green' },
      ],
      infoNote: 'Por que series retas no dia C? Volume moderado de manutencao - RPT e Myo-reps tornariam o dia muito longo.',
      progressionNote: 'Eliptico 15 min apos o treino: estado estavel 65-70% FC max. Sem sprints - inferiores precisam recuperar.',
      warmup: ['Rotacao ombro com elastico 2x15','Remada elastico 2x12','Mobilizacao toracica rolo 1x10'],
      exercises: [
        {
          id: 'c-01', name: 'Supino Halteres', muscle: 'Peitoral',
          color: 'blue', protocol: 'STRAIGHT', flag: null, totalRounds: 3,
          subtitle: 'Series retas - cotovelos 45 graus', scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '12-15', repsNote: 'cotovelos 45 graus', isoNote: null, restSec: 60, restNote: null, techBadges: ['EXC'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '12-15', repsNote: null, isoNote: null, restSec: 60, restNote: null, techBadges: ['EXC'] },
            { index: 3, label: 'SERIE 3', loadPct: null, reps: '12-15', repsNote: null, isoNote: null, restSec: 60, restNote: null, techBadges: ['EXC'] },
          ],
        },
        {
          id: 'c-02', name: 'Remada Curvada Haltere', muscle: 'Dorsal',
          color: 'blue', protocol: 'STRAIGHT', flag: null, totalRounds: 3,
          subtitle: 'Series retas - lombar neutra', scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '12-15', repsNote: 'lombar neutra', isoNote: '1s', restSec: 60, restNote: null, techBadges: ['ISO'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '12-15', repsNote: null, isoNote: '1s', restSec: 60, restNote: null, techBadges: ['ISO'] },
            { index: 3, label: 'SERIE 3', loadPct: null, reps: '12-15', repsNote: null, isoNote: '1s', restSec: 60, restNote: null, techBadges: ['ISO'] },
          ],
        },
        {
          id: 'c-03', name: 'Puxada Frente Polia', muscle: 'Dorsal/Biceps',
          color: 'blue', protocol: 'STRAIGHT', flag: null, totalRounds: 3,
          subtitle: 'Series retas - retracao escapula', scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '12-15', repsNote: 'retracao escapula', isoNote: '1s', restSec: 60, restNote: null, techBadges: ['ISO'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '12-15', repsNote: null, isoNote: '1s', restSec: 60, restNote: null, techBadges: ['ISO'] },
            { index: 3, label: 'SERIE 3', loadPct: null, reps: '12-15', repsNote: null, isoNote: '1s', restSec: 60, restNote: null, techBadges: ['ISO'] },
          ],
        },
        {
          id: 'c-04', name: 'Desenvolvimento Halteres - Sentada', muscle: 'Deltoide',
          color: 'blue', protocol: 'STRAIGHT', flag: 'LOMBAR', totalRounds: 3,
          subtitle: 'Series retas - sem ext. lombar', scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '12-15', repsNote: 'sem extensao lombar', isoNote: null, restSec: 60, restNote: null, techBadges: ['EXC'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '12-15', repsNote: null, isoNote: null, restSec: 60, restNote: null, techBadges: ['EXC'] },
            { index: 3, label: 'SERIE 3', loadPct: null, reps: '12-15', repsNote: null, isoNote: null, restSec: 60, restNote: null, techBadges: ['EXC'] },
          ],
        },
        {
          id: 'c-05', name: 'Elevacao Lateral', muscle: 'Deltoide Lateral',
          color: 'purple', protocol: 'MYO', flag: null, totalRounds: 2,
          subtitle: 'Ativacao 15r -> 4 mini x 4r', scienceNote: null,
          sets: [
            { index: 1, label: 'ATIVACAO', loadPct: null, reps: '15', repsNote: null, isoNote: null, restSec: 0, restNote: '5 resp.', techBadges: ['MYO ACT'] },
            { index: 2, label: 'MINI x1',  loadPct: null, reps: '4',  repsNote: null, isoNote: null, restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 3, label: 'MINI x2',  loadPct: null, reps: '4',  repsNote: null, isoNote: null, restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 4, label: 'MINI x3',  loadPct: null, reps: '4',  repsNote: null, isoNote: null, restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 5, label: 'MINI x4',  loadPct: null, reps: '4',  repsNote: null, isoNote: null, restSec: 0, restNote: null,      techBadges: ['MYO MINI'] },
          ],
        },
        {
          id: 'c-06', name: 'Remada Unilateral Haltere', muscle: 'Dorsal',
          color: 'blue', protocol: 'STRAIGHT', flag: null, totalRounds: 2,
          subtitle: '2x12 cada - apoio no banco', scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '12', repsNote: 'apoio no banco', isoNote: '1s', restSec: 45, restNote: null, techBadges: ['ISO','UNI'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '12', repsNote: null, isoNote: '1s', restSec: 45, restNote: null, techBadges: ['ISO','UNI'] },
          ],
        },
        {
          id: 'c-07', name: 'Rosca Direta Halteres', muscle: 'Biceps',
          color: 'blue', protocol: 'STRAIGHT', flag: null, totalRounds: 2,
          subtitle: 'Series retas - excentrica 3s', scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '12-15', repsNote: 'excentrica 3s', isoNote: null, restSec: 45, restNote: null, techBadges: ['EXC'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '12-15', repsNote: null, isoNote: null, restSec: 45, restNote: null, techBadges: ['EXC'] },
          ],
        },
        {
          id: 'c-08', name: 'Triceps Corda Polia Alta', muscle: 'Triceps',
          color: 'blue', protocol: 'STRAIGHT', flag: null, totalRounds: 2,
          subtitle: 'Series retas - separar corda', scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '12-15', repsNote: 'separar corda na extensao', isoNote: '1s', restSec: 45, restNote: null, techBadges: ['ISO'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '12-15', repsNote: null, isoNote: '1s', restSec: 45, restNote: null, techBadges: ['ISO'] },
          ],
        },
      ],
    },

    // TREINO D
    {
      type: 'D', title: 'Treino D - Gluteos & Inferiores (Variante A2)',
      subtitle: 'Segunda sessao semanal de gluteos - Exercicios diferentes do Treino A - RPT + Myo-reps',
      color: 'orange',
      stats: [
        { label: 'Duracao',     value: '~48 min',    sub: '+ 12 min HIIT'               },
        { label: 'Protocolo',   value: 'RPT',        sub: '+ Myo isolacoes', color: 'orange' },
        { label: 'Diferencial', value: 'Unilateral', sub: 'Hip thrust + passada rev.'    },
      ],
      infoNote: null,
      progressionNote: null,
      warmup: ['Glute bridge + elastico 2x15','Donkey kick 4 apoios 2x12 cada','Fire hydrant elastico 1x12 cada','Mobilidade quadril passada baixa 1x8 cada'],
      exercises: [
        {
          id: 'd-01', name: 'Hip Thrust Unilateral - Barra Leve', muscle: 'Gluteo Maximo',
          color: 'orange', protocol: 'RPT', flag: null, totalRounds: 3,
          subtitle: 'Intervalo: 75s - cada lado independente', scienceNote: null,
          sets: [
            { index: 1, label: 'TOP SET', loadPct: '~65%', reps: '8-10',  repsNote: 'perna livre estendida - squeeze 3s topo', isoNote: 'ISO 3s',       restSec: 75, restNote: null, techBadges: ['RPT S1','UNI']  },
            { index: 2, label: 'SERIE 2', loadPct: '-10%', reps: '12-15', repsNote: null,                                      isoNote: 'ISO 2s',       restSec: 75, restNote: null, techBadges: ['EXC']           },
            { index: 3, label: 'SERIE 3', loadPct: '-20%', reps: '18-20', repsNote: 'bilateral - finaliza com 15s ISO',         isoNote: 'ISO 15s final', restSec: 0,  restNote: null, techBadges: ['DROP ISO']     },
          ],
        },
        {
          id: 'd-02', name: 'Elevacao Pelvica - Haltere No Quadril', muscle: 'Gluteo Maximo',
          color: 'purple', protocol: 'MYO', flag: null, totalRounds: 2,
          subtitle: 'Intervalo ativacao para mini: 5 respiracoes - 2 rodadas', scienceNote: null,
          sets: [
            { index: 1, label: 'ATIVACAO', loadPct: '~60%', reps: '20', repsNote: 'RPE 8-9', isoNote: '2s topo', restSec: 0, restNote: '5 resp.', techBadges: ['MYO ACT'] },
            { index: 2, label: 'MINI x1',  loadPct: 'mesma', reps: '5', repsNote: null, isoNote: '2s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 3, label: 'MINI x2',  loadPct: 'mesma', reps: '5', repsNote: null, isoNote: '2s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 4, label: 'MINI x3',  loadPct: 'mesma', reps: '5', repsNote: null, isoNote: '2s', restSec: 0, restNote: '5 resp.', techBadges: ['MYO MINI'] },
            { index: 5, label: 'MINI x4',  loadPct: 'mesma', reps: '5', repsNote: null, isoNote: '2s', restSec: 0, restNote: null,      techBadges: ['MYO MINI'] },
          ],
        },
        {
          id: 'd-03', name: 'Abdutora Polia - Tornozeleira Em Pe', muscle: 'Gluteo Medio',
          color: 'orange', protocol: 'STRAIGHT', flag: null, totalRounds: 3,
          subtitle: '3x15 por lado com ISO 2s na extensao', scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '15', repsNote: null, isoNote: '2s lateral', restSec: 60, restNote: null, techBadges: ['UNI','ISO'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '15', repsNote: null, isoNote: '2s lateral', restSec: 60, restNote: null, techBadges: ['UNI','ISO'] },
            { index: 3, label: 'SERIE 3', loadPct: null, reps: '15', repsNote: null, isoNote: '2s lateral', restSec: 60, restNote: null, techBadges: ['UNI','ISO'] },
          ],
        },
        {
          id: 'd-04', name: 'Extensao Quadril 45 graus - Maquina', muscle: 'Gluteo Maximo',
          color: 'orange', protocol: 'RPT', flag: 'LOMBAR', totalRounds: 3,
          subtitle: 'RPT: 3 series descendentes (15->18->20 reps)', scienceNote: null,
          sets: [
            { index: 1, label: 'TOP SET', loadPct: '~65%', reps: '15', repsNote: null, isoNote: '2s extensao', restSec: 60, restNote: null, techBadges: ['ISO','SAFE'] },
            { index: 2, label: 'SERIE 2', loadPct: '-10%', reps: '18', repsNote: null, isoNote: '2s extensao', restSec: 60, restNote: null, techBadges: ['ISO']        },
            { index: 3, label: 'SERIE 3', loadPct: '-20%', reps: '20', repsNote: null, isoNote: '2s extensao', restSec: 60, restNote: null, techBadges: ['ISO']        },
          ],
        },
        {
          id: 'd-05', name: 'Passada Reversa - Halteres Leves', muscle: 'Gluteo/Quad',
          color: 'orange', protocol: 'PAUSE', flag: 'JOELHO', totalRounds: 3,
          subtitle: '3x10 - pausa 2s fundo - 40% menos carga patelofemoral', scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '10', repsNote: 'pausa 2s fundo - passada para tras', isoNote: '2s fundo', restSec: 75, restNote: null, techBadges: ['UNI','PAUSE','SAFE'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '10', repsNote: null, isoNote: '2s fundo', restSec: 75, restNote: null, techBadges: ['UNI','PAUSE','SAFE'] },
            { index: 3, label: 'SERIE 3', loadPct: null, reps: '10', repsNote: null, isoNote: '2s fundo', restSec: 75, restNote: null, techBadges: ['UNI','PAUSE','SAFE'] },
          ],
        },
        {
          id: 'd-06', name: 'Panturrilha Sentada', muscle: 'Soleo',
          color: 'orange', protocol: 'STRAIGHT', flag: null, totalRounds: 3,
          subtitle: 'Soleo ativado com joelho 90 graus. 3x20 com halteres nas coxas', scienceNote: null,
          sets: [
            { index: 1, label: 'SERIE 1', loadPct: null, reps: '20', repsNote: 'joelho 90 graus - halteres nas coxas', isoNote: '2s topo', restSec: 45, restNote: null, techBadges: ['ISO','EXC'] },
            { index: 2, label: 'SERIE 2', loadPct: null, reps: '20', repsNote: null, isoNote: '2s topo', restSec: 45, restNote: null, techBadges: ['ISO','EXC'] },
            { index: 3, label: 'SERIE 3', loadPct: null, reps: '20', repsNote: null, isoNote: '2s topo', restSec: 45, restNote: null, techBadges: ['ISO','EXC'] },
          ],
        },
      ],
    },

  ], // fim treinos[]
}

// ════════════════════════════════════════════════════════════════
// FUNCAO PRINCIPAL
// ════════════════════════════════════════════════════════════════
async function runSeed() {
  console.log('\nCriando usuario ' + EMAIL + '...')

  let userCredential
  try {
    userCredential = await createUserWithEmailAndPassword(auth, EMAIL, SENHA)
    console.log('Usuario criado com sucesso!\n')
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.error('ERRO: Usuario ja existe com este email.')
      console.error('Delete o usuario no Firebase Console (Authentication) e rode novamente.')
    } else {
      console.error('ERRO ao criar usuario:', err.message)
    }
    process.exit(1)
  }

  const uid = userCredential.user.uid
  console.log('UID: ' + uid + '\n')

  try {
    // 1. Grava o plano completo como UM UNICO documento
    console.log('Gravando workoutPlans/' + PLAN_ID + ' ...')
    await setDoc(doc(db, 'workoutPlans', PLAN_ID), WORKOUT_PLAN)
    console.log('   Plano completo gravado (treinos A/B/C/D embutidos em treinos[])')

    // 2. Grava o perfil do usuario (UserProfile)
    console.log('\nGravando users/' + uid + ' ...')
    await setDoc(doc(db, 'users', uid), {
      uid,
      email:       EMAIL,
      displayName: 'Lara',
      role:        'athlete',
      planId:      PLAN_ID,
      createdAt:   new Date().toISOString(),
    })
    console.log('   Perfil gravado com planId: ' + PLAN_ID)

    console.log('\nSEED COMPLETO!')
    console.log('\nEstrutura no Firestore:')
    console.log('   workoutPlans/' + PLAN_ID + '  <- plano completo com treinos[]')
    console.log('   users/' + uid + '  <- planId aponta para o plano acima')

  } catch (err) {
    console.error('ERRO ao gravar dados:', err)
    process.exit(1)
  }

  process.exit(0)
}

runSeed()
