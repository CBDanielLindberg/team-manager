# Football Team Manager

En omfattande laghanterings-applikation för idrottslag, byggd med Next.js, React och Supabase.

## Funktioner

- **Laghantering**: Skapa och hantera flera lag
- **Spelar-databas**: Håll reda på alla lagmedlemmar
- **Kalender & Schemaläggning**: Organisera träningspass och matcher
- **Närvarohantering**: Spåra spelarnärvaro för händelser
- **Återkommande händelser**: Skapa händelser som upprepas veckovis
- **Inbjudningshantering**: Skicka och skicka om inbjudningar till spelare

## Kalender-funktioner

Kalenderkomponenten ger en omfattande översikt över alla schemalagda händelser:

### Senaste uppdateringar

- **Förbättrat kalendergränssnitt**: Omdesignat kalender med en mer kompakt och effektiv layout
- **Visning av flera händelser**: Kalenderceller visar nu upp till 6 händelser per dag med lag- och tidsinformation
- **Visuella händelsetyper**: Färgkodade händelser (blå för matcher, primärfärg för träning)
- **Tidsintervall-visning**: Varje händelse visar både start- och sluttid
- **Lagprioritering**: Lagnamnet visas framträdande högst upp på varje händelse
- **Supabase-integration**: Fullständig persistens av händelsedata med stöd för start/sluttid
- **Återkommande händelser**: Möjlighet att skapa händelser som upprepas veckovis

### Använda kalendern

1. **Navigera**: Använd månadsnavigatorn för att flytta mellan månader
2. **Visa händelser**: Klicka på vilken dag som helst för att se detaljerade händelser för den dagen
3. **Skapa händelser**: Klicka på "Ny händelse" för att lägga till ett nytt träningspass eller match:
   - Välj lag
   - Ställ in datum och tidsintervall
   - Välj händelsetyp (träning/match)
   - Lägg till plats och beskrivning
   - Spara till databas
4. **Återkommande händelser**: Välj "Återkommande" för att skapa händelser som upprepas veckovis

### Databasschema

Händelser lagras i Supabase med följande struktur:

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id),
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  time TIME NOT NULL, -- Legacy field, now using start_time value
  description TEXT,
  location TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('training', 'match')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern TEXT,
  recurring_end_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Spelarhantering

Spelarhanteringen innehåller följande funktioner:

- **Lägg till spelare**: Bjud in nya spelare till laget via e-post
- **Skicka om inbjudningar**: Skicka om inbjudningar till spelare som inte har registrerat sig
- **Redigera spelarinformation**: Uppdatera spelares information och kontaktuppgifter
- **Ta bort spelare**: Ta bort spelare från laget

## Installation och konfiguration

1. Klona repositoryt
2. Installera beroenden: `npm install`
3. Konfigurera Supabase-anslutning i `.env`-filen:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Kör utvecklingsservern: `npm run dev`

## Teknikstack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Autentisering**: Supabase Auth
- **Styling**: Tailwind CSS med Shadcn UI-komponenter
- **UI-komponenter**: Radix UI för dropdownmenyer och tooltips

## Licens

MIT License
