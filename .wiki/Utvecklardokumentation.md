# Utvecklardokumentation

## Arkitektur

### Frontend
- Next.js med TypeScript
- Tailwind CSS för styling
- shadcn/ui för komponenter
- React Query för datahantering

### Backend
- Supabase för backend-tjänster
- PostgreSQL för databas
- Row Level Security (RLS) för säkerhet

## Databasstruktur

### Teams
```sql
CREATE TABLE teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### Players
```sql
CREATE TABLE players (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(email)
);
```

### Events
```sql
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### Invites
```sql
CREATE TABLE invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

## Säkerhet

### Row Level Security Policies

#### Teams
```sql
-- Läsning
CREATE POLICY "Users can read their own teams" ON teams
FOR SELECT USING (auth.uid() = admin_id);

-- Uppdatering
CREATE POLICY "Users can update their own teams" ON teams
FOR UPDATE USING (auth.uid() = admin_id);

-- Radering
CREATE POLICY "Users can delete their own teams" ON teams
FOR DELETE USING (auth.uid() = admin_id);
```

#### Players
```sql
-- Läsning
CREATE POLICY "Users can read their own player data" ON players
FOR SELECT USING (auth.uid() IS NOT NULL AND email = auth.jwt()->>'email');

-- Insättning
CREATE POLICY "Users can insert their own player data" ON players
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

## API Endpoints

### Teams
- `GET /api/teams` - Hämta alla lag
- `POST /api/teams` - Skapa nytt lag
- `PUT /api/teams/:id` - Uppdatera lag
- `DELETE /api/teams/:id` - Radera lag

### Players
- `GET /api/teams/:id/players` - Hämta spelare för ett lag
- `POST /api/teams/:id/players` - Lägg till spelare
- `PUT /api/players/:id` - Uppdatera spelare
- `DELETE /api/players/:id` - Radera spelare

### Events
- `GET /api/teams/:id/events` - Hämta events för ett lag
- `POST /api/teams/:id/events` - Skapa nytt event
- `PUT /api/events/:id` - Uppdatera event
- `DELETE /api/events/:id` - Radera event

## Utvecklingsmiljö

### Installation
1. Klona repositoryt
2. Installera beroenden: `npm install`
3. Kopiera `.env.example` till `.env.local`
4. Konfigurera miljövariabler
5. Starta utvecklingsservern: `npm run dev`

### Scripts
- `npm run dev` - Starta utvecklingsservern
- `npm run build` - Bygg för produktion
- `npm run start` - Starta produktionsservern
- `npm run lint` - Kör linting
- `npm run test` - Kör tester

### Kodkonventioner
- Använd TypeScript för all ny kod
- Följ ESLint-regler
- Använd konventionella commits
- Skriv tester för ny funktionalitet

## Deployment

### Produktionsmiljö
- Vercel för frontend
- Supabase för backend
- GitHub Actions för CI/CD

### Miljövariabler
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Felsökning

### Vanliga problem
1. CORS-fel
   - Kontrollera Supabase-inställningar
   - Verifiera miljövariabler

2. Autentiseringsfel
   - Kontrollera session
   - Verifiera RLS-policies

3. Databasfel
   - Kontrollera relationer
   - Verifiera CASCADE-inställningar

### Loggning
- Använd `console.error` för fel
- Använd `console.log` för debugging
- Kontrollera Supabase-loggarna 