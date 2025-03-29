# Football Team Manager

En webbapplikation för hantering av fotbollslag, utvecklad med Next.js och Supabase.

## Översikt

Football Team Manager är en modern webbapplikation som hjälper tränare och administratörer att hantera sina fotbollslag effektivt. Appen erbjuder funktioner för:

- Laghantering
- Spelarhantering
- Eventplanering
- Inbjudningssystem
- Kalenderintegration

## Huvudfunktioner

### Laghantering
- Skapa och hantera flera lag
- Lägga till och ta bort spelare
- Hantera laginformation och beskrivningar
- Säker radering av lag med dubbel bekräftelse

### Spelarhantering
- Lägga till spelare med kontaktinformation
- Hantera spelarprofiler
- Sökfunktion över alla spelare
- Redigering av spelarinformation

### Eventhantering
- Skapa träningar och matcher
- Hantera närvaro
- Skicka inbjudningar till spelare
- Kalenderintegration

## Teknisk Stack

- **Frontend**: Next.js med TypeScript
- **UI**: Tailwind CSS och shadcn/ui
- **Backend**: Supabase
- **Autentisering**: Supabase Auth
- **Databas**: PostgreSQL via Supabase

## Säkerhet

- Row Level Security (RLS) för alla databastabeller
- Säker autentisering via Supabase
- Behörighetskontroll för alla operationer
- Dubbel bekräftelse för kritiska operationer

## Installation

1. Klona repositoryt
2. Installera beroenden: `npm install`
3. Konfigurera miljövariabler
4. Starta utvecklingsservern: `npm run dev`

## Miljövariabler

Skapa en `.env.local` fil med följande variabler:

```env
NEXT_PUBLIC_SUPABASE_URL=din_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din_supabase_anon_key
```

## Utveckling

- Använd `npm run dev` för utveckling
- Använd `npm run build` för produktionsbyggen
- Följ konventionella commits för commit-meddelanden

## Bidra

1. Forka repositoryt
2. Skapa en feature branch
3. Commita dina ändringar
4. Pusha till branchen
5. Skapa en Pull Request

## Licens

MIT License 