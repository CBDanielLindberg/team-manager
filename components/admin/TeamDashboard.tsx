"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, PlusCircle, Users } from "lucide-react"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { Pencil, Trash2, Calendar } from 'lucide-react';

// Sample data
const teams = [
  { id: "1", name: "FC Barcelona Youth", members: 18 },
  { id: "2", name: "Madrid United", members: 22 },
  { id: "3", name: "Liverpool Juniors", members: 16 },
]

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

interface Team {
  id: string;
  name: string;
  description?: string;
  thumbnail_url: string | null;
  created_at: string;
  player_count?: number;
}

export default function TeamDashboard() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      // Hämta antal spelare för varje lag
      const teamsWithPlayerCount = await Promise.all(
        teamsData.map(async (team) => {
          const { count, error: countError } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);

          if (countError) throw countError;

          return {
            ...team,
            player_count: count || 0
          };
        })
      );

      setTeams(teamsWithPlayerCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid hämtning av lag');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta lag?')) return;

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      setTeams(teams.filter(team => team.id !== teamId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid borttagning av lag');
    }
  };

  const handleUpdateTeam = async (teamId: string, updates: Partial<Team>) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId);

      if (error) throw error;

      setTeams(teams.map(team => 
        team.id === teamId ? { ...team, ...updates } : team
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid uppdatering av lag');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Laddar...</div>;
  }

  // Beräkna totalt antal spelare
  const totalPlayers = teams.reduce((sum, team) => sum + (team.player_count || 0), 0);

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
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Mina lag</h1>
            <Button onClick={() => router.push('/teams/create')}>
              Skapa nytt lag
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex flex-col items-center justify-center p-4 bg-background rounded-md">
              <h3 className="text-lg font-semibold">Antal lag</h3>
              <p className="text-3xl font-bold text-primary">{teams.length}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-background rounded-md">
              <h3 className="text-lg font-semibold">Totalt antal spelare</h3>
              <p className="text-3xl font-bold text-primary">{totalPlayers}</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      {team.thumbnail_url ? (
                        <Image
                          src={team.thumbnail_url}
                          alt={team.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{team.name}</CardTitle>
                      <CardDescription>
                        {team.player_count} spelare • Skapat {new Date(team.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Bild</Label>
                      <ImageUpload
                        value={team.thumbnail_url}
                        onChange={(url) => handleUpdateTeam(team.id, { thumbnail_url: url })}
                        teamId={team.id}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Beskrivning</Label>
                      <Textarea
                        value={team.description || ''}
                        onChange={(e) => handleUpdateTeam(team.id, { description: e.target.value })}
                        placeholder="Lägg till en beskrivning"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/teams/${team.id}/players`)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Spelare
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/teams/${team.id}/events`)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Events
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTeam(team.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
            <span className="mt-1 text-xs">Hem</span>
          </Link>
          <Link href="/teams" className="flex flex-col items-center justify-center py-3 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span className="mt-1 text-xs">Lag</span>
          </Link>
          <Link href="/events" className="flex flex-col items-center justify-center py-3 text-muted-foreground">
            <CalendarIcon className="h-5 w-5" />
            <span className="mt-1 text-xs">Kalender</span>
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
            <span className="mt-1 text-xs">Profil</span>
          </Link>
        </div>
      </nav>
    </div>
  )
} 