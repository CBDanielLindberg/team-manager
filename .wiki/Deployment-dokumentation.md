# Deployment-dokumentation

## Översikt

Applikationen deployas på följande plattformar:
- Frontend: Vercel
- Backend: Supabase
- CI/CD: GitHub Actions

## Miljöer

### Utvecklingsmiljö
- URL: `http://localhost:3001`
- Branch: `develop`
- Automatisk deployment vid push

### Staging-miljö
- URL: `https://staging.team-manager.app`
- Branch: `staging`
- Automatisk deployment vid merge till staging

### Produktionsmiljö
- URL: `https://team-manager.app`
- Branch: `main`
- Manuell deployment via GitHub Actions

## Deployment-process

### Frontend (Vercel)
1. Bygg process:
```bash
npm run build
```

2. Miljövariabler:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
```

3. Build-konfiguration:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Backend (Supabase)
1. Databas-migrationer:
```sql
-- Exempel på migration
ALTER TABLE teams ADD COLUMN description TEXT;
```

2. RLS-policies:
```sql
-- Exempel på policy
CREATE POLICY "Users can read their own teams" ON teams
FOR SELECT USING (auth.uid() = admin_id);
```

3. Funktioner:
```sql
-- Exempel på funktion
CREATE FUNCTION notify_new_player()
RETURNS trigger AS $$
BEGIN
  -- Notifieringslogik här
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## CI/CD-pipeline

### GitHub Actions Workflow
```yaml
name: Deploy
on:
  push:
    branches: [main, staging, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test
      - uses: vercel/action@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
```

## Miljökonfiguration

### Utvecklingsmiljö
```env
# .env.development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Staging-miljö
```env
# .env.staging
NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
NEXT_PUBLIC_APP_URL=https://staging.team-manager.app
```

### Produktionsmiljö
```env
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://app.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NEXT_PUBLIC_APP_URL=https://team-manager.app
```

## Monitoring

### Loggning
- Vercel Logs för frontend
- Supabase Logs för backend
- GitHub Actions Logs för CI/CD

### Övervakning
- Vercel Analytics
- Supabase Dashboard
- GitHub Insights

### Alerting
- Email-notifieringar för deployment-fel
- Slack-notifieringar för kritiska händelser
- GitHub Issues för deployment-problem

## Backup och Återställning

### Databas
- Dagliga automatiska backups
- Point-in-time recovery
- Backup-verifiering

### Kod
- GitHub repository backup
- Vercel deployment history
- Supabase schema backup

## Säkerhet

### SSL/TLS
- Automatisk SSL-certifikathantering
- HSTS-konfiguration
- CORS-inställningar

### Miljövariabler
- Säker hantering av secrets
- Rotering av API-nycklar
- Åtkomstkontroll för miljövariabler

## Prestandaoptimering

### Frontend
- Bildoptimering
- Code splitting
- Caching-strategier

### Backend
- Query-optimering
- Connection pooling
- Caching

## Felsökning

### Vanliga problem
1. Deployment-fel
   - Kontrollera build-loggarna
   - Verifiera miljövariabler
   - Kontrollera dependencies

2. Databas-problem
   - Kontrollera migrations
   - Verifiera RLS-policies
   - Analysera query-performance

3. Miljö-problem
   - Kontrollera miljövariabler
   - Verifiera nätverksinställningar
   - Kontrollera SSL-certifikat

### Loggning
- Deployment-loggarna
- Build-loggarna
- Runtime-loggarna
- Error tracking 