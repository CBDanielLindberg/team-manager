# Säkerhetsdokumentation

## Översikt

Applikationen använder Supabase för autentisering och auktorisering, med följande säkerhetsåtgärder:

- Row Level Security (RLS) för databasåtkomst
- JWT-baserad autentisering
- Säker lösenordshantering
- HTTPS-kryptering
- XSS-skydd
- CSRF-skydd

## Autentisering

### Supabase Auth
- Användare autentiseras via Supabase Auth
- Stöd för email/lösenord och Google OAuth
- JWT-tokens för sessionhantering
- Automatisk token-uppdatering

### Sessionhantering
```typescript
// Exempel på sessionhantering
const { data: { session }, error } = await supabase.auth.getSession()

if (session) {
  // Användaren är inloggad
  const userId = session.user.id
} else {
  // Användaren är inte inloggad
  // Omdirigera till inloggningssidan
}
```

## Auktorisering

### Row Level Security (RLS)
Alla databastabeller är skyddade med RLS-policies:

#### Teams
```sql
-- Endast admin kan läsa, uppdatera och radera sina lag
CREATE POLICY "Users can manage their own teams" ON teams
FOR ALL USING (auth.uid() = admin_id);
```

#### Players
```sql
-- Spelare kan endast läsa sina egna data
CREATE POLICY "Players can read their own data" ON players
FOR SELECT USING (auth.uid() IS NOT NULL AND email = auth.jwt()->>'email');

-- Endast admin kan hantera spelare i sitt lag
CREATE POLICY "Admins can manage players in their teams" ON players
FOR ALL USING (
  auth.uid() IN (
    SELECT admin_id FROM teams WHERE id = team_id
  )
);
```

### API-säkerhet
- Alla API-endpoints kräver autentisering
- JWT-token valideras vid varje anrop
- Rate limiting på API-anrop
- CORS-konfiguration för säker domänåtkomst

## Säkerhetsåtgärder

### Frontend
- XSS-skydd via React och Next.js
- CSRF-skydd via Supabase
- Säker cookie-hantering
- Content Security Policy (CSP)

### Backend
- Input-validering
- SQL-injection-skydd via Supabase
- Säker filuppladdning
- Felhantering utan känslig information

### Databas
- Säker anslutning via SSL
- Krypterad data i vila
- Säker backup och återställning
- Automatisk loggning av säkerhetshändelser

## Säkerhetsrutiner

### Lösenordshantering
- Lösenord hashas med bcrypt
- Minst 8 tecken krävs
- Krav på komplexitet
- Lösenordshistorik

### Sessionhantering
- Korta sessionstider (24 timmar)
- Automatisk utloggning vid inaktivitet
- Möjlighet att logga ut från alla enheter

### Åtkomstkontroll
- Rollbaserad åtkomst (RBAC)
- Admin- och användarroller
- Granulär behörighetskontroll

## Incidenthantering

### Säkerhetsincidenter
1. Identifiera incidenten
2. Isolera påverkan
3. Analysera orsak
4. Åtgärda problem
5. Dokumentera incidenten
6. Förhindra återfall

### Loggning
- Säkerhetsloggar sparas i 90 dagar
- Automatisk varning vid misstänkt aktivitet
- Regelmässig logganalys

## Säkerhetsuppdateringar

### Rutiner
- Månatliga säkerhetsuppdateringar
- Automatisk uppdatering av beroenden
- Sårbarhetsscanning av kodbasen

### Beroenden
- Regelmässig uppdatering av npm-paket
- Säkerhetsvarningar via GitHub
- Automatisk CI/CD-integration

## Säkerhetskontroller

### Automatiserade tester
- Säkerhetstester i CI/CD-pipeline
- Statisk kodanalys
- Sårbarhetsscanning

### Manuella tester
- Penetrationstester
- Säkerhetsgranskning
- Användartester

## Compliance

### GDPR
- Dataminimering
- Användaråtkomst
- Dataportabilitet
- Rätt till radering

### Säkerhetsstandarder
- OWASP Top 10
- CWE/SANS Top 25
- ISO 27001 