# API-dokumentation

## Översikt

API:et är byggt med Next.js API routes och använder Supabase för databasoperationer. Alla endpoints kräver autentisering via Supabase.

## Autentisering

Alla API-anrop måste inkludera en giltig Supabase-session i Authorization-headern:

```http
Authorization: Bearer <supabase-session-token>
```

## Endpoints

### Teams

#### Hämta alla lag
```http
GET /api/teams
```

**Response:**
```json
{
  "teams": [
    {
      "id": "uuid",
      "name": "string",
      "admin_id": "uuid",
      "created_at": "timestamp"
    }
  ]
}
```

#### Skapa nytt lag
```http
POST /api/teams
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "team": {
    "id": "uuid",
    "name": "string",
    "admin_id": "uuid",
    "created_at": "timestamp"
  }
}
```

#### Uppdatera lag
```http
PUT /api/teams/:id
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "team": {
    "id": "uuid",
    "name": "string",
    "admin_id": "uuid",
    "created_at": "timestamp"
  }
}
```

#### Radera lag
```http
DELETE /api/teams/:id
```

**Response:**
```json
{
  "success": true
}
```

### Players

#### Hämta spelare för ett lag
```http
GET /api/teams/:id/players
```

**Response:**
```json
{
  "players": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "phone": "string",
      "birth_year": "number",
      "created_at": "timestamp"
    }
  ]
}
```

#### Lägg till spelare
```http
POST /api/teams/:id/players
```

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string (optional)",
  "birth_year": "number (optional)"
}
```

**Response:**
```json
{
  "player": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "phone": "string",
    "birth_year": "number",
    "created_at": "timestamp"
  }
}
```

#### Uppdatera spelare
```http
PUT /api/players/:id
```

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string (optional)",
  "birth_year": "number (optional)"
}
```

**Response:**
```json
{
  "player": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "phone": "string",
    "birth_year": "number",
    "created_at": "timestamp"
  }
}
```

#### Radera spelare
```http
DELETE /api/players/:id
```

**Response:**
```json
{
  "success": true
}
```

### Events

#### Hämta events för ett lag
```http
GET /api/teams/:id/events
```

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "string",
      "date": "date",
      "time": "time",
      "description": "string",
      "created_at": "timestamp"
    }
  ]
}
```

#### Skapa nytt event
```http
POST /api/teams/:id/events
```

**Request Body:**
```json
{
  "title": "string",
  "date": "date",
  "time": "time",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "event": {
    "id": "uuid",
    "title": "string",
    "date": "date",
    "time": "time",
    "description": "string",
    "created_at": "timestamp"
  }
}
```

#### Uppdatera event
```http
PUT /api/events/:id
```

**Request Body:**
```json
{
  "title": "string",
  "date": "date",
  "time": "time",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "event": {
    "id": "uuid",
    "title": "string",
    "date": "date",
    "time": "time",
    "description": "string",
    "created_at": "timestamp"
  }
}
```

#### Radera event
```http
DELETE /api/events/:id
```

**Response:**
```json
{
  "success": true
}
```

## Felhantering

Alla endpoints returnerar följande felformat:

```json
{
  "error": {
    "message": "string",
    "code": "string"
  }
}
```

Vanliga felkoder:
- `401` - Oautentiserad
- `403` - Saknar behörighet
- `404` - Resurs hittades inte
- `409` - Konflikt (t.ex. duplicerat email)
- `500` - Serverfel 