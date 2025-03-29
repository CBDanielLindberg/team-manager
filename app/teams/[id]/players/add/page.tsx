'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Player = {
  id?: string
  name: string
  email: string
  phone: string
  birth_year: number | null
}

export default function AddPlayersPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([
    { name: '', email: '', phone: '', birth_year: null }
  ])

  const addPlayerRow = () => {
    setPlayers([...players, { name: '', email: '', phone: '', birth_year: null }])
  }

  const removePlayerRow = (index: number) => {
    const newPlayers = players.filter((_, i) => i !== index)
    setPlayers(newPlayers)
  }

  const updatePlayer = (index: number, field: keyof Player, value: string) => {
    const newPlayers = [...players]
    newPlayers[index] = { ...newPlayers[index], [field]: value }
    setPlayers(newPlayers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      // Validera att minst en spelare har namn
      if (!players.some(player => player.name.trim())) {
        throw new Error('Minst en spelare måste ha ett namn')
      }

      // Filtrera bort tomma rader
      const validPlayers = players.filter(player => player.name.trim())

      // Lägg till team_id för varje spelare
      const playersWithTeamId = validPlayers.map(player => ({
        ...player,
        team_id: params.id
      }))

      const { error: insertError } = await supabase
        .from('players')
        .insert(playersWithTeamId)

      if (insertError) throw insertError

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
          <h1 className="text-xl font-bold">Add Players</h1>
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
                          onChange={(e) => updatePlayer(index, 'birth_year', 
                            e.target.value ? parseInt(e.target.value) : null
                          )}
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