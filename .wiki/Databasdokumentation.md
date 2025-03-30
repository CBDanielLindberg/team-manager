# Databasdokumentation

## Översikt

Databasen är implementerad med Supabase och använder PostgreSQL som underliggande databashanterare. Alla tabeller använder UUID som primärnycklar och har automatisk tidsstämpel för skapande.

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

**Index:**
- `idx_teams_admin_id` på `admin_id` för snabb uppslagning av användarens lag

### Players
```sql
CREATE TABLE players (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    birth_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(email)
);
```

**Index:**
- `idx_players_team_id` på `team_id` för snabb uppslagning av lags spelare
- `idx_players_email` på `email` för unikhetskontroll

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

**Index:**
- `idx_events_team_id` på `team_id` för snabb uppslagning av lags events
- `idx_events_date` på `date` för effektiv datumfiltrering

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

**Index:**
- `idx_invites_event_id` på `event_id` för snabb uppslagning av events inbjudningar
- `idx_invites_player_id` på `player_id` för snabb uppslagning av spelarens inbjudningar
- `idx_invites_status` på `status` för effektiv filtrering av inbjudningsstatus

## Prestandaoptimering

### Indexering
- Alla främmande nycklar är indexerade för snabb uppslagning
- Sökfält som används i WHERE-satser är indexerade
- Unikhetsindex på email för spelare

### CASCADE
- Alla relaterade tabeller använder ON DELETE CASCADE för att säkerställa dataintegritet
- Detta säkerställer att när ett lag raderas, raderas alla relaterade spelare och events automatiskt

### Datatyper
- UUID för alla ID-fält för global unikhet
- VARCHAR med lämplig längd för textfält
- TIMESTAMP WITH TIME ZONE för alla tidsstämplar
- CHECK constraints för att säkerställa giltiga värden

## Säkerhet

### Row Level Security (RLS)
Alla tabeller har RLS aktiverat med följande policies:

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

## Backup och Återställning

### Automatisk Backup
- Supabase utför dagliga backups av databasen
- Backups sparas i 7 dagar
- Point-in-time recovery är tillgängligt

### Återställningsprocedur
1. Logga in på Supabase Dashboard
2. Gå till Database > Backups
3. Välj önskad backup
4. Klicka på "Restore"

## Underhåll

### Vakuum
- PostgreSQL utför automatiskt VACUUM på tabeller
- Manuell VACUUM kan köras vid behov via Supabase Dashboard

### Statistik
- PostgreSQL uppdaterar automatiskt statistik för query planering
- Manuell ANALYZE kan köras vid behov via Supabase Dashboard 