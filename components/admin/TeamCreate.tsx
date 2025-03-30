"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Plus, Trash2, User } from "lucide-react"

interface Player {
  id: number
  name: string
  email: string
  phone: string
}

export default function TeamCreate() {
  const router = useRouter()
  const [teamName, setTeamName] = useState("")
  const [players, setPlayers] = useState<Player[]>([{ id: 1, name: "", email: "", phone: "" }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const addPlayer = () => {
    const newId = players.length > 0 ? Math.max(...players.map((p) => p.id)) + 1 : 1
    setPlayers([...players, { id: newId, name: "", email: "", phone: "" }])
  }

  const removePlayer = (id: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((player) => player.id !== id))
    }
  }

  const updatePlayer = (id: number, field: keyof Player, value: string) => {
    setPlayers(players.map((player) => (player.id === id ? { ...player, [field]: value } : player)))
  }

  const validateForm = (): boolean => {
    if (!teamName.trim()) {
      setErrorMessage("Teamnamn är obligatoriskt")
      return false
    }

    // Kontrollera att alla spelare har åtminstone ett namn
    for (const player of players) {
      if (!player.name.trim()) {
        setErrorMessage("Alla spelare måste ha ett namn")
        return false
      }
    }

    setErrorMessage(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      
      // Här skulle API-anrop för att spara team och spelare göras
      // Till exempel:
      // const response = await fetch('/api/teams', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name: teamName, players })
      // })
      
      // if (!response.ok) {
      //   throw new Error('Kunde inte skapa laget')
      // }

      // Simulera framgångsrikt API-anrop
      router.push("/admin/dashboard")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kunde inte skapa laget")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center">
          <Link href="/admin/dashboard" className="mr-3">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Create New Team</h1>
        </div>
      </header>
      <main className="flex-1 p-4">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Team Details</CardTitle>
              <CardDescription>Enter your team information and add players</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {errorMessage && (
                <div className="p-3 text-sm border border-destructive text-destructive bg-destructive/10 rounded-md">
                  {errorMessage}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input 
                  id="team-name" 
                  placeholder="e.g. FC Barcelona Youth" 
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Players</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addPlayer} className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add Player
                  </Button>
                </div>

                <div className="space-y-4">
                  {players.map((player) => (
                    <Card key={player.id}>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <User className="h-4 w-4" />
                            </div>
                            <h4 className="font-medium">Player {player.id}</h4>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePlayer(player.id)}
                            disabled={players.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Remove player</span>
                          </Button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${player.id}`}>Name</Label>
                            <Input
                              id={`name-${player.id}`}
                              value={player.name}
                              onChange={(e) => updatePlayer(player.id, "name", e.target.value)}
                              placeholder="John Doe"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`email-${player.id}`}>Email</Label>
                            <Input
                              id={`email-${player.id}`}
                              type="email"
                              value={player.email}
                              onChange={(e) => updatePlayer(player.id, "email", e.target.value)}
                              placeholder="john@example.com"
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor={`phone-${player.id}`}>Phone Number</Label>
                            <Input
                              id={`phone-${player.id}`}
                              type="tel"
                              value={player.phone}
                              onChange={(e) => updatePlayer(player.id, "phone", e.target.value)}
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/dashboard">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Team"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </main>
    </div>
  )
} 