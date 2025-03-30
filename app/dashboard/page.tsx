'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, PlusCircle, Users, Edit, UserPlus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Definiera types
type Team = {
  id: string
  name: string
  description: string | null
  created_at: string
  thumbnail_url?: string
}

type Event = {
  id: string
  title: string
  team: string
  team_id: string
  date: string
  start_time: string
  end_time: string
  type: "training" | "match"
  location: string
  confirmed: number
  total: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hämta teams när komponenten laddas
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('created_at', { ascending: false })

        if (teamsError) {
          throw teamsError
        }

        console.log('Fetched teams:', teamsData)
        setTeams(teamsData || [])
      } catch (error) {
        console.error('Error fetching teams:', error)
        setError('Failed to load teams')
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [router])

  // Hämta kommande händelser
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setEventsLoading(true)
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date()
        const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
        
        // Fetch events from the next 7 days
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id, 
            team_id, 
            title, 
            date, 
            start_time,
            end_time,
            description,
            location,
            type
          `)
          .gte('date', formattedDate) // Events from today and forward
          .order('date')
          .order('start_time')
          .limit(5) // Limit to 5 events
        
        if (eventsError) {
          throw eventsError
        }
        
        // Convert events to our Event type
        const formattedEvents: Event[] = await Promise.all((eventsData || []).map(async (event) => {
          // Get team name based on team_id
          const { data: teamData } = await supabase
            .from('teams')
            .select('name')
            .eq('id', event.team_id)
            .single()
          
          const teamName = teamData?.name || 'Unknown team'
          
          // Get number of players in the team
          const { count } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', event.team_id)
          
          // Get number of confirmed players
          const { count: confirmedCount } = await supabase
            .from('invites')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('status', 'accepted')
          
          // Format the date for display
          const eventDate = new Date(event.date)
          let formattedDisplayDate = ""
          
          const today = new Date()
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          
          if (eventDate.toDateString() === today.toDateString()) {
            formattedDisplayDate = `Today, ${event.start_time.substring(0, 5)}`
          } else if (eventDate.toDateString() === tomorrow.toDateString()) {
            formattedDisplayDate = `Tomorrow, ${event.start_time.substring(0, 5)}`
          } else {
            // Get abbreviated weekday
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            formattedDisplayDate = `${dayNames[eventDate.getDay()]}, ${event.start_time.substring(0, 5)}`
          }
          
          return {
            id: event.id,
            title: event.title,
            team: teamName,
            team_id: event.team_id,
            date: formattedDisplayDate,
            start_time: event.start_time,
            end_time: event.end_time,
            type: event.type as "training" | "match",
            location: event.location,
            confirmed: confirmedCount || 0,
            total: count || 0
          }
        }))
        
        console.log('Fetched upcoming events:', formattedEvents)
        setEvents(formattedEvents)
      } catch (error) {
        console.error('Error fetching upcoming events:', error)
      } finally {
        setEventsLoading(false)
      }
    }
    
    // Only fetch events if teams have been loaded
    if (!loading) {
      fetchUpcomingEvents()
    }
  }, [loading])

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    // Första bekräftelsedialogen
    if (!confirm(`Are you sure you want to delete the team "${teamName}"?\n\nThis will:\n- Remove all players in the team\n- Remove all events associated with the team\n- This cannot be undone!`)) {
      return
    }

    // Andra bekräftelsedialogen
    if (!confirm(`Do you REALLY want to delete the team "${teamName}"?\n\nThis is your last chance to cancel!\n\nType "DELETE" to confirm:`)) {
      return
    }

    try {
      // Kontrollera användarens behörighet
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('You must be logged in to delete a team')
        return
      }

      // Kontrollera att användaren är admin för laget
      const { data: teamData, error: teamCheckError } = await supabase
        .from('teams')
        .select('admin_id')
        .eq('id', teamId)
        .single()

      if (teamCheckError) {
        throw new Error('Could not verify team owner')
      }

      if (teamData.admin_id !== session.user.id) {
        throw new Error('You do not have permission to delete this team')
      }

      // Ta bort alla invites för lagets events
      const { error: invitesError } = await supabase
        .from('invites')
        .delete()
        .eq('event_id', teamId)

      if (invitesError) {
        console.error('Error deleting invites:', invitesError)
        throw new Error('Could not delete invitations')
      }

      // Ta bort alla events för laget
      const { error: eventsError } = await supabase
        .from('events')
        .delete()
        .eq('team_id', teamId)

      if (eventsError) {
        console.error('Error deleting events:', eventsError)
        throw new Error('Could not delete events')
      }

      // Ta bort alla spelare i laget
      const { error: playersError } = await supabase
        .from('players')
        .delete()
        .eq('team_id', teamId)

      if (playersError) {
        console.error('Error deleting players:', playersError)
        throw new Error('Could not delete players')
      }

      // Ta bort själva laget
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (teamError) {
        console.error('Error deleting team:', teamError)
        throw new Error('Could not delete the team')
      }

      // Uppdatera UI:t endast om alla operationer lyckades
      setTeams(teams.filter(team => team.id !== teamId))
      
      // Visa bekräftelsemeddelande
      alert('The team has been successfully deleted!')
      
      // Ladda om sidan för att säkerställa att allt är uppdaterat
      window.location.reload()
    } catch (error) {
      console.error('Error in delete operation:', error)
      setError(error instanceof Error ? error.message : 'Could not delete the team. Check that you have permission.')
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2">Loading teams...</p>
      </div>
    </div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Team Manager</h1>
          <Button variant="ghost" size="icon">
            <span className="sr-only">Menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Teams</h2>
            <Link href="/teams/create">
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Create Team
              </Button>
            </Link>
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <div className="grid gap-4">
            {teams.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No teams created yet. Create your first team to get started!
                </CardContent>
              </Card>
            ) : (
              teams.map((team) => (
                <Card key={team.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                        {team.thumbnail_url ? (
                          <img 
                            src={team.thumbnail_url} 
                            alt={team.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{team.name}</h3>
                        {team.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {team.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/teams/${team.id}/players`}>
                          <Button variant="default" size="sm">
                            <Users className="h-4 w-4 mr-1" />
                            Players
                          </Button>
                        </Link>
                        <Link href={`/teams/${team.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Next Events</CardTitle>
                <CardDescription>Your scheduled events</CardDescription>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No upcoming events scheduled</p>
                    <Link href="/calendar" className="mt-2 inline-block">
                      <Button size="sm" variant="outline" className="gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        Schedule an event
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center gap-4 rounded-lg border p-3">
                        <div className={`flex h-10 w-10 flex-col items-center justify-center rounded-md ${
                          event.type === 'training' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-700'
                        }`}>
                          <CalendarIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium leading-none">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.team} • {event.date}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {event.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-medium">
                            {event.confirmed}/{event.total}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 text-center">
                      <Link href="/calendar">
                        <Button size="sm" variant="link" className="gap-1">
                          View all events
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <nav className="sticky bottom-0 z-10 border-t bg-background">
        <div className="grid grid-cols-4 divide-x">
          <Link href="/dashboard" className="flex flex-col items-center justify-center py-3 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="mt-1 text-xs">Home</span>
          </Link>
          <Link href="/teams" className="flex flex-col items-center justify-center py-3 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span className="mt-1 text-xs">Teams</span>
          </Link>
          <Link href="/calendar" className="flex flex-col items-center justify-center py-3 text-muted-foreground">
            <CalendarIcon className="h-5 w-5" />
            <span className="mt-1 text-xs">Calendar</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center justify-center py-3 text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="10" r="3" />
              <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
            </svg>
            <span className="mt-1 text-xs">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
} 