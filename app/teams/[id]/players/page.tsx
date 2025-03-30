'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Trash2, Mail, Phone, Edit, Pencil, RefreshCcw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Player = {
  id: string
  name: string
  email: string | null
  phone: string | null
  birth_year: number | null
  created_at: string
}

type Team = {
  id: string
  name: string
}

export default function TeamPlayersPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resendingPlayerId, setResendingPlayerId] = useState<string | null>(null)
  const [resendSuccess, setResendSuccess] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    const fetchTeamAndPlayers = async () => {
      try {
        // Hämta team info
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', params.id)
          .single()

        if (teamError) throw teamError
        setTeam(teamData)

        // Hämta players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', params.id)
          .order('name')

        if (playersError) throw playersError
        setPlayers(playersData || [])

      } catch (error) {
        console.error('Error:', error)
        setError('Failed to load team data')
      } finally {
        setLoading(false)
      }
    }

    fetchTeamAndPlayers()
  }, [params.id])

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Are you sure you want to remove this player?')) return

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)

      if (error) throw error

      // Uppdatera listan
      setPlayers(players.filter(player => player.id !== playerId))

    } catch (error) {
      console.error('Error:', error)
      setError('Failed to delete player')
    }
  }

  const handleResendInvite = async (player: Player) => {
    if (!player.email) return
    
    try {
      setResendingPlayerId(player.id)
      setResendSuccess({...resendSuccess, [player.id]: false})
      
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'player-invite',
          data: {
            to: player.email,
            playerName: player.name,
            teamName: team?.name || 'Your Team',
          },
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        console.log('Inbjudan skickad igen:', data)
        setResendSuccess({...resendSuccess, [player.id]: true})
        
        // Rensa framgångsstatusen efter 3 sekunder
        setTimeout(() => {
          setResendSuccess((prev) => {
            const updated = {...prev}
            delete updated[player.id]
            return updated
          })
        }, 3000)
      } else {
        throw new Error(data.error || 'Kunde inte skicka inbjudan')
      }
    } catch (error) {
      console.error('Error resending invite:', error)
      setError('Failed to resend invitation')
    } finally {
      setResendingPlayerId(null)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2">Loading players...</p>
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
            <h1 className="text-xl font-bold">Players - {team?.name}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <span className="sr-only">Back</span>
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
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Players</CardTitle>
                <CardDescription>Manage players in {team?.name}</CardDescription>
              </div>
              <Button onClick={() => router.push(`/teams/${params.id}/players/add`)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Players
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-sm text-red-500 text-center mb-4">
                {error}
              </div>
            )}
            
            {players.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No players added yet. Click &quot;Add Players&quot; to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Birth Year</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>{player.birth_year || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {player.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                              {player.email}
                            </div>
                          )}
                          {player.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                              {player.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {player.email && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleResendInvite(player)}
                                    disabled={resendingPlayerId === player.id}
                                    className={resendSuccess[player.id] ? "text-green-500" : ""}
                                  >
                                    {resendingPlayerId === player.id ? (
                                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                                    ) : resendSuccess[player.id] ? (
                                      <div className="h-4 w-4 text-green-500">✓</div>
                                    ) : (
                                      <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Skicka inbjudan igen</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/teams/${params.id}/players/${player.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePlayer(player.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 