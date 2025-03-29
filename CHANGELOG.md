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