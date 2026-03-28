// ─────────────────────────────────────────────────────────────────
// environment.prod.ts — Produção
//
// Como preencher:
//   1. Crie um segundo projeto Firebase (ex: fittracker-prod)
//   2. Clique em "Adicionar app" → Web (</>)
//   3. Copie o firebaseConfig gerado e cole abaixo
//
// Este arquivo é usado automaticamente pelo Angular quando:
//   ng build --configuration=production
//   ionic build --prod
// ─────────────────────────────────────────────────────────────────

export const environment = {
  production: true,

  firebase: {
    apiKey: "AIzaSyBz6pYeHqznd8IhLmkerLVkVLFFsc6GLwE",
    authDomain: "fittracker-14d2d.firebaseapp.com",
    projectId: "fittracker-14d2d",
    storageBucket: "fittracker-14d2d.firebasestorage.app",
    messagingSenderId: "450802094210",
    appId: "1:450802094210:web:f84ee52073223a56e3e49b",
    measurementId: "G-K0CLJ55HR1"
  },
}
