# Deploy IterMed su Vercel – Guida passo passo

Questa guida ti porta da zero al deploy completo su Vercel (hosting + database).

---

## Prerequisiti

- Account GitHub (per il repository)
- Account Vercel (gratuito): https://vercel.com/signup
- Chiave API OpenAI (per chat e valutazioni)
- (Opzionale) Account Pinecone (per retrieval nella valutazione)

---

## Passo 1: Prepara il repository Git

Se il progetto non è ancora su GitHub:

```bash
cd /Users/patrickuguzzoni/Desktop/itermed/itermed

# Inizializza git se necessario
git init

# Crea .gitignore se non c’è (verifica che includa .env, node_modules, .next)
# Aggiungi e committa
git add .
git commit -m "Prepare for Vercel deployment"

# Crea repo su GitHub, poi:
git remote add origin https://github.com/TUO_USERNAME/itermed.git
git branch -M main
git push -u origin main
```

**Importante:** Il file `.env` non deve essere committato (deve essere in `.gitignore`). Le variabili andranno configurate direttamente su Vercel.

---

## Passo 2: Crea il progetto su Vercel

1. Vai su **https://vercel.com** e accedi.
2. Clicca **Add New…** → **Project**.
3. **Import** del repository `itermed` da GitHub (collega l’account GitHub se richiesto).
4. Vercel rileva Next.js; mantieni:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (o la cartella del progetto se è in un monorepo)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** (default)

5. **Non fare ancora Deploy.** Prima configuriamo database e variabili.

---

## Passo 3: Crea il database (Vercel Postgres)

1. Nel tuo progetto Vercel, vai alla scheda **Storage**.
2. Clicca **Create Database**.
3. Scegli **Postgres** (Vercel Postgres).
4. Nome database: es. `itermed-db`.
5. Regione: scegli quella più vicina agli utenti (es. Frankfurt per Europa).
6. Clicca **Create**.
7. Quando è pronto, clicca **Connect** (o **.env.local**) e copia le variabili.
   - Dovresti avere `POSTGRES_URL` (o simile) come connection string.

8. Vai su **Settings** → **Environment Variables** del progetto e aggiungi:
   - `DATABASE_URL` = la connection string del Postgres (es. `postgresql://...?sslmode=require`).

---

## Passo 4: Configura tutte le variabili d’ambiente

In **Settings** → **Environment Variables** del progetto aggiungi:

| Nome              | Valore                        | Note                                      |
|-------------------|-------------------------------|-------------------------------------------|
| `DATABASE_URL`    | `postgresql://...`            | Da Vercel Postgres (Passo 3)              |
| `NEXTAUTH_SECRET` | Stringa casuale lunga         | Vedi sotto                                |
| `NEXTAUTH_URL`    | `https://TUO-DOMAIN.vercel.app` | Aggiorna dopo il primo deploy            |
| `OPENAI_API_KEY`  | `sk-...`                      | La tua chiave OpenAI                      |
| `PINECONE_API_KEY`| (opzionale)                   | Se usi Pinecone                           |
| `PINECONE_INDEX`  | (opzionale)                   | Nome dell’indice Pinecone                 |

**Generare NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```
Copia l’output e usalo come valore di `NEXTAUTH_SECRET`.

**Nota:** All’inizio puoi usare un placeholder per `NEXTAUTH_URL` (es. `https://itermed.vercel.app`). Dopo il primo deploy verrà assegnato un URL tipo `https://itermed-xxx.vercel.app`: aggiorna `NEXTAUTH_URL` con quell’URL e rifai il deploy.

---

## Passo 5: Esegui le migrazioni sul database di produzione

Prima di fare il deploy, crea le tabelle nel database di produzione:

```bash
# Nel terminale, dalla cartella del progetto
# Imposta temporaneamente DATABASE_URL con la connection string di Vercel Postgres
export DATABASE_URL="postgresql://default:xxx@xxx.pooler.vercel-storage.com:5432/verceldb?sslmode=require"

# Esegui le migrazioni
npx prisma migrate deploy
```

Se preferisci, puoi creare un file `.env.production` locale (non committarlo) con `DATABASE_URL` e poi:

```bash
npx dotenv -e .env.production -- npx prisma migrate deploy
```

oppure incolla la connection string al posto di `$DATABASE_URL`:

```bash
DATABASE_URL="la_tua_connection_string" npx prisma migrate deploy
```

---

## Passo 6: Primo deploy

1. Torna su Vercel e clicca **Deploy** (se non l’hai già fatto).
2. Attendi la fine del build.
3. Se va a buon fine, avrai un URL tipo `https://itermed-abc123.vercel.app`.

---

## Passo 7: Aggiorna NEXTAUTH_URL e ridistribuisci

1. Copia l’URL effettivo del deploy (es. `https://itermed-abc123.vercel.app`).
2. Vai su **Settings** → **Environment Variables**.
3. Modifica `NEXTAUTH_URL` e imposta esattamente quell’URL (senza slash finale).
4. Vai su **Deployments**, apri l’ultimo deploy e clicca **Redeploy** (o fai un nuovo push su `main`).

---

## Passo 8: Crea il primo utente

1. Apri l’URL della tua app (es. `https://itermed-abc123.vercel.app`).
2. Clicca **Registrati** (o vai su `/signup`).
3. Crea un account con email e password.

Per renderlo **admin** (accesso a Knowledge base):

- Apri **Vercel** → **Storage** → il tuo Postgres → **Query** (o usa un client come TablePlus).
- Esegui:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'tua@email.com';
```

---

## Riepilogo comandi utili

```bash
# Build locale (test prima del deploy)
npm run build

# Migrazioni su DB di produzione (dopo aver impostato DATABASE_URL)
npx prisma migrate deploy

# Apri Prisma Studio sul DB di produzione (con DATABASE_URL settato)
npx prisma studio
```

---

## Dominio personalizzato (opzionale)

1. In Vercel: **Settings** → **Domains**.
2. Aggiungi il tuo dominio (es. `itermed.it`).
3. Segui le istruzioni per i record DNS.
4. Aggiorna `NEXTAUTH_URL` con il nuovo dominio e ridistribuisci.

---

## Troubleshooting

- **Errore Prisma / "Cannot find module @prisma/client"**  
  Verifica che `package.json` abbia uno script `postinstall: "prisma generate"` e che il build usi `npm run build`.

- **Errore "Configuration" di NextAuth**  
  Controlla che `NEXTAUTH_SECRET` e `NEXTAUTH_URL` siano impostati correttamente su Vercel.

- **Database connection failed**  
  Verifica che `DATABASE_URL` sia corretto e che il database accetti connessioni esterne (es. `?sslmode=require` per Vercel Postgres).
