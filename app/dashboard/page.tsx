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
  date: string
  confirmed: number
  total: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
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

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    // Första bekräftelsedialogen
    if (!confirm(`Är du säker på att du vill radera laget "${teamName}"?\n\nDetta kommer att:\n- Ta bort alla spelare i laget\n- Ta bort alla händelser kopplade till laget\n- Detta kan inte ångras!`)) {
      return
    }

    // Andra bekräftelsedialogen
    if (!confirm(`Vill du VERKLIGEN radera laget "${teamName}"?\n\nDetta är din sista chans att avbryta!\n\nSkriv "RADERA" för att bekräfta:`)) {
      return
    }

    try {
      // Kontrollera användarens behörighet
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Du måste vara inloggad för att radera ett lag')
        return
      }

      // Kontrollera att användaren är admin för laget
      const { data: teamData, error: teamCheckError } = await supabase
        .from('teams')
        .select('admin_id')
        .eq('id', teamId)
        .single()

      if (teamCheckError) {
        throw new Error('Kunde inte verifiera lagets ägare')
      }

      if (teamData.admin_id !== session.user.id) {
        throw new Error('Du har inte behörighet att radera detta lag')
      }

      // Ta bort alla invites för lagets events
      const { error: invitesError } = await supabase
        .from('invites')
        .delete()
        .eq('event_id', teamId)

      if (invitesError) {
        console.error('Error deleting invites:', invitesError)
        throw new Error('Kunde inte ta bort inbjudningar')
      }

      // Ta bort alla events för laget
      const { error: eventsError } = await supabase
        .from('events')
        .delete()
        .eq('team_id', teamId)

      if (eventsError) {
        console.error('Error deleting events:', eventsError)
        throw new Error('Kunde inte ta bort händelser')
      }

      // Ta bort alla spelare i laget
      const { error: playersError } = await supabase
        .from('players')
        .delete()
        .eq('team_id', teamId)

      if (playersError) {
        console.error('Error deleting players:', playersError)
        throw new Error('Kunde inte ta bort spelare')
      }

      // Ta bort själva laget
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (teamError) {
        console.error('Error deleting team:', teamError)
        throw new Error('Kunde inte ta bort laget')
      }

      // Uppdatera UI:t endast om alla operationer lyckades
      setTeams(teams.filter(team => team.id !== teamId))
      
      // Visa bekräftelsemeddelande
      alert('Laget har raderats framgångsrikt!')
      
      // Ladda om sidan för att säkerställa att allt är uppdaterat
      window.location.reload()
    } catch (error) {
      console.error('Error in delete operation:', error)
      setError(error instanceof Error ? error.message : 'Kunde inte radera laget. Kontrollera att du har behörighet.')
    }
  }

  // Sample events data (kan uppdateras senare med riktiga events)
  const events = [
    {
      id: "1",
      title: "Training Session",
      team: "FC Barcelona Youth",
      date: "Today, 6:00 PM",
      confirmed: 15,
      total: 18,
    },
    {
      id: "2",
      title: "Friendly Match",
      team: "Madrid United",
      date: "Tomorrow, 3:00 PM",
      confirmed: 18,
      total: 22,
    },
    {
      id: "3",
      title: "Fitness Training",
      team: "Liverpool Juniors",
      date: "Wed, 5:30 PM",
      confirmed: 12,
      total: 16,
    },
  ]

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
                <CardTitle className="text-base">This Week</CardTitle>
                <CardDescription>Your scheduled events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 rounded-lg border p-3">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                        <CalendarIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium leading-none">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.team} • {event.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-medium">
                          {event.confirmed}/{event.total}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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