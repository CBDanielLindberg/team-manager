export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          admin_id: string
          created_at?: string
        }
        Insert: {
          id?: string
          name: string
          admin_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          admin_id?: string
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          team_id: string
          name: string
          email: string
          phone: string
          created_at?: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          email: string
          phone: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          email?: string
          phone?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          team_id: string
          title: string
          date: string
          time: string
          description: string
          created_at?: string
        }
        Insert: {
          id?: string
          team_id: string
          title: string
          date: string
          time: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          title?: string
          date?: string
          time?: string
          description?: string
          created_at?: string
        }
      }
      invites: {
        Row: {
          id: string
          event_id: string
          player_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
        Insert: {
          id?: string
          event_id: string
          player_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          player_id?: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
      }
    }
  }
} 