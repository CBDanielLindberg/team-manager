'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"

type TeamData = {
  id: string
  name: string
  description: string | null
}

export default function EditTeamPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamData, setTeamData] = useState<TeamData | null>(null)

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data: team, error } = await supabase
          .from('teams')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error
        setTeamData(team)
      } catch (error) {
        console.error('Error:', error)
        setError('Failed to load team')
      } finally {
        setLoading(false)
      }
    }

    fetchTeam()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamData) return

    try {
      setLoading(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('teams')
        .update({
          name: teamData.name,
          description: teamData.description
        })
        .eq('id', params.id)

      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error('Ett team med detta namn finns redan')
        }
        throw updateError
      }

      router.push('/dashboard')
      router.refresh()

    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update team')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2">Loading team...</p>
      </div>
    </div>
  }

  if (!teamData) {
    return <div>Team not found</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Edit Team</h1>
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
            <CardTitle>Edit Team Information</CardTitle>
            <CardDescription>Update your team&apos;s details</CardDescription>
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
                  value={teamData.description || ''}
                  onChange={(e) => setTeamData({...teamData, description: e.target.value})}
                  placeholder="Enter team description"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 