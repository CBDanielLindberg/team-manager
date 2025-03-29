# Changelog

## [0.1.0] - 2024-03-19

### Tillagt
- Implementerat Create Team funktionalitet
- Formulär för att skapa nya team med namn och beskrivning
- Validering för unika team-namn
- Visning av team i dashboard

### Förbättringar
- Förbättrad visning av team-beskrivningar i dashboard
- Lagt till laddningsindikator vid team-skapande
- Responsiv design för team-kort

### Tekniska ändringar
- Lagt till unique constraint för team-namn i databasen
- Implementerat felhantering för duplicerade team-namn
- Uppdaterat Supabase schema och policies för teams-tabellen

### Buggfixar
- Åtgärdat problem med description-kolumnen i Supabase
- Fixat cache-problem med schema-uppdateringar

## [0.2.0] - 2024-03-19

### Tillagt
- Ny Teams-sida med expanderbara team-kort
- Sökfunktion för spelare över alla team
- Automatisk expansion av team när sökning matchar spelare
- Redigeringsfunktion för spelare
- Birth Year-fält för spelare
- Förbättrad spelarhantering i teams

### Förbättringar
- Omdesignad players-vy med bättre översikt
- Uppdaterad navigation med aktiv team-sektion
- Förbättrad användarupplevelse vid sökning
- Responsiv design för alla nya vyer

### Tekniska ändringar
- Lagt till birth_year i players-tabellen
- Uppdaterade Supabase policies för spelarhantering
- Implementerat automatisk team-expansion vid sökning
- Förbättrad state-hantering för team-expansion

### Databasändringar
- Ny kolumn birth_year i players-tabellen
- Uppdaterade RLS-policies för player-hantering 

## [0.3.0] - 2024-03-19

### Förbättringar
- Lagt till dubbel bekräftelse vid radering av lag för att förhindra oavsiktliga raderingar
- Förbättrad felhantering och användarfeedback vid radering av lag
- Säkerställer att alla relaterade data (spelare, händelser, inbjudningar) raderas korrekt

### Säkerhet
- Förbättrad behörighetskontroll vid radering av lag
- Verifierar att användaren är admin för laget innan radering tillåts
- Implementerad sekventiell radering av relaterad data för att säkerställa dataintegritet 