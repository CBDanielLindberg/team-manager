# Football Team Manager

A comprehensive team management application for sports teams, built with Next.js, React, and Supabase.

## Features

- **Team Management**: Create and manage multiple teams
- **Player Database**: Keep track of all team members
- **Calendar & Scheduling**: Organize training sessions and matches
- **Event Attendance**: Track player attendance for events

## Calendar Features

The calendar component provides a comprehensive view of all scheduled events:

### Recent Updates

- **Enhanced Calendar UI**: Redesigned calendar with a more compact and efficient layout
- **Multi-event View**: Calendar cells now display up to 6 events per day with team and time information
- **Visual Event Types**: Color-coded events (blue for matches, primary color for training)
- **Time Range Display**: Each event shows both start and end times
- **Team Prioritization**: Team name is displayed prominently at the top of each event
- **Supabase Integration**: Full persistence of event data with proper start/end time support

### Using the Calendar

1. **Navigate**: Use the month navigator to move between months
2. **View Events**: Click on any day to see detailed events for that day
3. **Create Events**: Click "New Event" to add a new training session or match:
   - Select team
   - Set date and time range
   - Choose event type (training/match)
   - Add location and description
   - Save to database

### Database Schema

Events are stored in Supabase with the following structure:

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Setup and Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Supabase connection in `.env` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Run the development server: `npm run dev`

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with Shadcn UI components

## License

MIT License
