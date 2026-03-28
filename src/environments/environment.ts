// ─────────────────────────────────────────────────────────────────
// environment.ts — Desenvolvimento
//
// Como preencher:
//   1. Acesse console.firebase.google.com
//   2. Crie um projeto (ex: fittracker-dev)
//   3. Clique em "Adicionar app" → Web (</>)
//   4. Copie o firebaseConfig gerado e cole abaixo
//
// IMPORTANTE:
//   Estas credenciais não são segredo — ficam expostas no bundle JS.
//   A segurança real vem das Firestore Security Rules no console.
//   Use um projeto Firebase separado para dev e outro para prod.
// ─────────────────────────────────────────────────────────────────

export const environment = {
  production: false,


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
