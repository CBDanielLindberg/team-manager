'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

type Player = {
  id: string
  name: string
  email: string | null
  phone: string | null
  birth_year: number | null
}

export default function EditPlayerPage({ 
  params 
}: { 
  params: { id: string; playerId: string } 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('id', params.playerId)
          .single()

        if (error) throw error
        setPlayer(data)
      } catch (error) {
        console.error('Error:', error)
        setError('Failed to load player')
      } finally {
        setLoading(false)
      }
    }

    fetchPlayer()
  }, [params.playerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!player) return

    try {
      setSaving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('players')
        .update({
          name: player.name,
          email: player.email,
          phone: player.phone,
          birth_year: player.birth_year
        })
        .eq('id', player.id)

      if (updateError) throw updateError

      router.push(`/teams/${params.id}/players`)
      router.refresh()

    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update player')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2">Loading player...</p>
      </div>
    </div>
  }

  if (!player) {
    return <div>Player not found</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Edit Player</h1>
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
            <CardTitle>Edit Player Information</CardTitle>
            <CardDescription>Update player details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-red-500 text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={player.name}
                  onChange={(e) => setPlayer({...player, name: e.target.value})}
                  placeholder="Player name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_year">Birth Year</Label>
                <Input
                  id="birth_year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={player.birth_year || ''}
                  onChange={(e) => setPlayer({
                    ...player, 
                    birth_year: e.target.value ? parseInt(e.target.value) : null
                  })}
                  placeholder="YYYY"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={player.email || ''}
                  onChange={(e) => setPlayer({...player, email: e.target.value})}
                  placeholder="Email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={player.phone || ''}
                  onChange={(e) => setPlayer({...player, phone: e.target.value})}
                  placeholder="Phone"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 