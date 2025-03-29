'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"

export default function CreateTeamPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamData, setTeamData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Please log in to create a team')
      }

      // Skapa team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([{
          name: teamData.name,
          description: teamData.description || null,
          admin_id: session.user.id
        }])
        .select()
        .single()

      if (teamError) {
        // Kolla om det är ett duplicate error
        if (teamError.code === '23505') {
          throw new Error('Ett team med detta namn finns redan')
        }
        throw teamError
      }

      router.push('/dashboard')
      router.refresh()

    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Create New Team</h1>
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
            <CardTitle>Team Information</CardTitle>
            <CardDescription>Create a new team to manage players and events</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-red-500 text-center">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  value={teamData.name}
                  onChange={(e) => setTeamData({...teamData, name: e.target.value})}
                  placeholder="Enter team name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={teamData.description}
                  onChange={(e) => setTeamData({...teamData, description: e.target.value})}
                  placeholder="Enter team description"
                  rows={4}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creating Team...' : 'Create Team'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 