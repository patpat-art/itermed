IterMed – piattaforma di simulazione clinico–medico-legale basata su IA.

### Stack

- **Frontend**: Next.js App Router, React, Tailwind (utility classes)
- **UI**: componenti custom stile shadcn (card, dialog, tabs), Lucide Icons, Recharts
- **Backend**: Route Handlers Next.js / API routes
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Vercel AI SDK (`ai`, `@ai-sdk/openai`), OpenAI

### 1. Setup variabili d’ambiente

1. Copia il file di esempio:

```bash
cp .env.example .env
```

2. Modifica `.env` con i tuoi valori:

- `DATABASE_URL` → stringa di connessione PostgreSQL, ad es.  
  `postgresql://postgres:password@localhost:5432/itermed?schema=public`
- `OPENAI_API_KEY` → la tua API key OpenAI.

Assicurati che il db `itermed` esista nel tuo Postgres locale.

### 2. Installazione dipendenze

```bash
npm install
```

### 3. Migrazioni Prisma

Genera lo schema e le tabelle nel database:

```bash
npx prisma migrate dev --name init
```

Puoi anche ispezionare il db con:

```bash
npx prisma studio
```

### 4. Avvio in sviluppo

```bash
npm run dev
```

Poi apri `http://localhost:3000` nel browser.

- Dashboard: `http://localhost:3000/dashboard`
- Simulatore: scegli un caso da `http://localhost:3000/dashboard/cases`
  - Accetta il disclaimer.
  - Usa la chat anamnestica (LLM paziente).
  - Seleziona esami per vedere tempo/costo.
  - Compila il referto e clicca **“Concludi caso”**.
- Report risultati: dopo la conclusione verrai reindirizzato a  
  `http://localhost:3000/case/[id]/results?sessionId=...` con spider chart e feedback.

### 5. Note

- Il `userId` usato per ora nella valutazione è un placeholder (`"demo-user"`).  
  Quando integrerai l’autenticazione potrai collegarlo a `User` in Prisma.
- L’IA paziente e il giudice di valutazione richiedono una `OPENAI_API_KEY` valida.  
  Senza questa variabile le chiamate /api/chat e /api/evaluate falliranno.
