'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Checkbox } from "@/components/ui/checkbox"
import { Resend } from 'resend'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

type Player = {
  id?: string
  name: string
  email: string
  phone: string
  birth_year: number | null
  sendInvite?: boolean
}

type Team = {
  id: string
  name: string
}

// Function to send player invitation email
async function sendPlayerInvite({
  to,
  playerName,
  teamName,
}: {
  to: string
  playerName: string
  teamName: string
}) {
  try {
    await resend.emails.send({
      from: 'Team Manager <noreply@yourapp.com>',
      to,
      subject: `You've been added to ${teamName}`,
      html: `
        <h2>Welcome to ${teamName}!</h2>
        <p>Hi ${playerName},</p>
        <p>You have been added as a player to the team "${teamName}" in Team Manager.</p>
        <p>You'll receive notifications about upcoming games, trainings, and other team events.</p>
        <p>If you haven't set up your account yet, you can do so by clicking the link below:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/register?email=${encodeURIComponent(to)}">Set up your account</a>
      `
    })
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    throw error
  }
}

export default function AddPlayersPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([
    { name: '', email: '', phone: '', birth_year: null, sendInvite: false }
  ])

  // Fetch team info when component loads
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('name')
          .eq('id', params.id)
          .single()

        if (error) throw error
        if (data) setTeam({ id: params.id, name: data.name })
      } catch (err) {
        console.error('Error fetching team:', err)
      }
    }

    fetchTeam()
  }, [params.id])

  const addPlayerRow = () => {
    setPlayers([...players, { name: '', email: '', phone: '', birth_year: null, sendInvite: false }])
  }

  const removePlayerRow = (index: number) => {
    const newPlayers = players.filter((_, i) => i !== index)
    setPlayers(newPlayers)
  }

  const updatePlayer = (index: number, field: keyof Player, value: any) => {
    const newPlayers = [...players]
    newPlayers[index] = { ...newPlayers[index], [field]: value }
    setPlayers(newPlayers)
  }

  // Special update function for birth year that handles number | null
  const updateBirthYear = (index: number, value: string) => {
    const numberValue = value ? parseInt(value) : null
    const newPlayers = [...players]
    newPlayers[index] = { ...newPlayers[index], birth_year: numberValue }
    setPlayers(newPlayers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      // Validera att minst en spelare har namn
      if (!players.some(player => player.name.trim())) {
        throw new Error('At least one player must have a name')
      }

      // Filtrera bort tomma rader
      const validPlayers = players.filter(player => player.name.trim())

      // Lägg till team_id för varje spelare
      const playersWithTeamId = validPlayers.map(player => ({
        name: player.name,
        email: player.email,
        phone: player.phone,
        birth_year: player.birth_year,
        team_id: params.id
      }))

      // Insert players in database
      const { data: insertedPlayers, error: insertError } = await supabase
        .from('players')
        .insert(playersWithTeamId)
        .select()

      if (insertError) throw insertError

      // Send invitation emails to players with email and sendInvite checked
      const emailPromises = validPlayers
        .filter(player => player.email && player.sendInvite)
        .map(player => 
          sendPlayerInvite({
            to: player.email,
            playerName: player.name,
            teamName: team?.name || 'Your Team'
          }).catch(err => {
            console.error(`Failed to send invitation to ${player.email}:`, err)
            // Continue with other emails even if one fails
            return null
          })
        )

      // Wait for all emails to be sent
      await Promise.all(emailPromises)

      router.push(`/teams/${params.id}/players`)
      router.refresh()

    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to add players')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
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
            <h1 className="text-xl font-bold">Add Players</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Add Players</CardTitle>
            <CardDescription>Add one or more players to your team</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-red-500 text-center">
                  {error}
                </div>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Birth Year</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Invite</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={player.name}
                          onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                          placeholder="Player name"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1900"
                          max={new Date().getFullYear()}
                          value={player.birth_year || ''}
                          onChange={(e) => updateBirthYear(index, e.target.value)}
                          placeholder="YYYY"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="email"
                          value={player.email}
                          onChange={(e) => updatePlayer(index, 'email', e.target.value)}
                          placeholder="Email"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="tel"
                          value={player.phone}
                          onChange={(e) => updatePlayer(index, 'phone', e.target.value)}
                          placeholder="Phone"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Checkbox 
                            id={`invite-${index}`}
                            checked={player.sendInvite}
                            onCheckedChange={(checked) => 
                              updatePlayer(index, 'sendInvite', checked === true)
                            }
                            disabled={!player.email}
                          />
                          <Label
                            htmlFor={`invite-${index}`}
                            className="ml-2 text-sm font-normal"
                          >
                            Send invite
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePlayerRow(index)}
                          disabled={players.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPlayerRow}
                >
                  Add Another Player
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Players'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 