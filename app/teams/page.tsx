'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Search, Users, Calendar as CalendarIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

type Team = {
  id: string
  name: string
  description: string | null
}

type Player = {
  id: string
  name: string
  birth_year: number | null
  email: string | null
  phone: string | null
}

type TeamWithPlayers = Team & {
  players: Player[]
  isExpanded: boolean
}

export default function TeamsPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<TeamWithPlayers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('name')

        if (teamsError) throw teamsError

        const teamsWithPlayers = await Promise.all(
          (teamsData || []).map(async (team) => {
            const { data: playersData } = await supabase
              .from('players')
              .select('*')
              .eq('team_id', team.id)
              .order('name')

            return {
              ...team,
              players: playersData || [],
              isExpanded: false
            }
          })
        )

        setTeams(teamsWithPlayers)
      } catch (error) {
        console.error('Error:', error)
        setError('Failed to load teams')
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [])

  const toggleTeamExpansion = (teamId: string) => {
    setTeams(teams.map(team => 
      team.id === teamId 
        ? { ...team, isExpanded: !team.isExpanded }
        : team
    ))
  }

  const filteredTeams = teams.map(team => {
    const matchingPlayers = team.players.filter(player =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (player.email && player.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (player.phone && player.phone.includes(searchQuery))
    )

    return {
      ...team,
      players: matchingPlayers,
      isExpanded: searchQuery === '' ? team.isExpanded : matchingPlayers.length > 0
    }
  })

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
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/dashboard')}
            >
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
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </Button>
            <h1 className="text-xl font-bold">Teams</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          <div className="grid gap-4">
            {filteredTeams.map((team) => (
              <Card key={team.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>{team.name}</CardTitle>
                        {team.description && (
                          <p className="text-sm text-muted-foreground">
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleTeamExpansion(team.id)}
                    >
                      {team.isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {team.isExpanded && (
                  <CardContent className="border-t bg-muted/50">
                    {team.players.length === 0 ? (
                      <div className="py-4 text-center text-muted-foreground">
                        {searchQuery 
                          ? 'No players match your search'
                          : 'No players in this team'}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {team.players.map((player) => (
                          <div key={player.id} className="py-3 px-2">
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {player.birth_year && (
                                <div>Birth Year: {player.birth_year}</div>
                              )}
                              {player.email && (
                                <div>Email: {player.email}</div>
                              )}
                              {player.phone && (
                                <div>Phone: {player.phone}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </main>

      <nav className="sticky bottom-0 z-10 border-t bg-background">
        <div className="grid grid-cols-4 divide-x">
          <Link href="/dashboard" className="flex flex-col items-center justify-center py-3 text-muted-foreground">
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
          <Link href="/teams" className="flex flex-col items-center justify-center py-3 text-primary">
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