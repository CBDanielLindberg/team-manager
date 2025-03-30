'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, ChevronLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Checkbox } from "@/components/ui/checkbox"

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
      const { error: insertError } = await supabase
        .from('players')
        .insert(playersWithTeamId)

      if (insertError) throw insertError

      // Email functionality commented out for now
      // If sendInvite is true, we'd send emails here in the future

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
              <ChevronLeft className="h-6 w-6" />
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