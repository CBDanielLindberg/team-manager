'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Users, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react'

type Event = {
  id: string
  title: string
  team: string
  team_id: string
  date: string
  start_time: string
  end_time: string
  type: 'training' | 'match'
  location: string
  description?: string
  inviteStatus?: 'pending' | 'accepted' | 'declined' | null
  inviteId?: string
}

export default function EventPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [responseStatus, setResponseStatus] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [confirmedPlayers, setConfirmedPlayers] = useState<number>(0)
  const [totalPlayers, setTotalPlayers] = useState<number>(0)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Kontrollera om användaren är inloggad och hämta e-postadressen
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      
      if (!data.session?.user) {
        router.push('/login')
        return
      }
      
      if (data.session.user.email) {
        setUserEmail(data.session.user.email)
      }

      // Hämta användarens roll från profiles-tabellen
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single()
        
        if (profileData) {
          setUserRole(profileData.role)
        }
      } catch (error) {
        console.error('Kunde inte hämta användarroll:', error)
      }
    }
    
    checkAuth()
  }, [router])

  useEffect(() => {
    if (userEmail) {
      fetchEventDetails()
    }
  }, [userEmail, params.id])

  const fetchEventDetails = async () => {
    try {
      setLoading(true)
      
      if (!userEmail) return
      
      // 1. Hämta evenemangsinformation
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*, teams(name)')
        .eq('id', params.id)
        .single()
      
      if (eventError) throw eventError
      
      if (!eventData) {
        setError('Evenemanget hittades inte')
        setLoading(false)
        return
      }
      
      // 2. Hitta spelar-ID baserat på e-post
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('email', userEmail)
        .limit(1)
        .single()
      
      if (playerError && playerError.code !== 'PGRST116') {
        // PGRST116 betyder att ingen rad hittades, vi ignorerar det och fortsätter
        throw playerError
      }
      
      // 3. Om spelaren finns, hämta deras inbjudningsstatus
      let inviteStatus = null
      let inviteId = undefined
      
      if (playerData) {
        const { data: inviteData, error: inviteError } = await supabase
          .from('invites')
          .select('id, status')
          .eq('event_id', params.id)
          .eq('player_id', playerData.id)
          .limit(1)
          .single()
        
        if (inviteError && inviteError.code !== 'PGRST116') {
          throw inviteError
        }
        
        if (inviteData) {
          inviteStatus = inviteData.status
          inviteId = inviteData.id
        }
      }
      
      // 4. Hämta antal bekräftade spelare för detta evenemang
      const { count: confirmedCount, error: confirmedError } = await supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', params.id)
        .eq('status', 'accepted')
      
      if (confirmedError) throw confirmedError
      
      // 5. Hämta totalt antal spelare i laget
      const { count: teamCount, error: teamCountError } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', eventData.team_id)
      
      if (teamCountError) throw teamCountError
      
      // 6. Formatera datumet för visning
      const eventDate = new Date(eventData.date)
      const formattedDate = eventDate.toLocaleDateString('sv-SE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      // 7. Skapa evenemangsobjekt med all information
      const formattedEvent: Event = {
        id: eventData.id,
        title: eventData.title,
        team: eventData.teams?.name || 'Okänt lag',
        team_id: eventData.team_id,
        date: formattedDate,
        start_time: eventData.start_time,
        end_time: eventData.end_time,
        type: eventData.type,
        location: eventData.location || '',
        description: eventData.description || '',
        inviteStatus,
        inviteId
      }
      
      setEvent(formattedEvent)
      setConfirmedPlayers(confirmedCount || 0)
      setTotalPlayers(teamCount || 0)
      
    } catch (error) {
      console.error('Fel vid hämtning av evenemangsdetaljer:', error)
      setError('Kunde inte hämta evenemangsdetaljer')
    } finally {
      setLoading(false)
    }
  }

  const handleEventResponse = async (status: 'accepted' | 'declined') => {
    try {
      if (!userEmail || !event) return
      
      // Kontrollera om användaren har rollen "player"
      if (userRole !== 'player') {
        setError('Endast spelare kan svara på evenemangsinbjudningar')
        return
      }
      
      // 1. Hitta spelarens ID
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('email', userEmail)
        .limit(1)
        .single()
      
      if (playerError) throw playerError
      
      const playerId = playerData.id
      
      // 2. Hitta om det redan finns en inbjudan
      const { data: existingInvite, error: inviteError } = await supabase
        .from('invites')
        .select('id')
        .eq('event_id', event.id)
        .eq('player_id', playerId)
        .limit(1)
      
      if (inviteError && inviteError.code !== 'PGRST116') throw inviteError
      
      let result
      
      // 3. Uppdatera eller skapa inbjudningssvar
      if (existingInvite && existingInvite.length > 0) {
        // Uppdatera existerande inbjudan
        result = await supabase
          .from('invites')
          .update({ status })
          .eq('id', existingInvite[0].id)
      } else {
        // Skapa ny inbjudan med status
        result = await supabase
          .from('invites')
          .insert([
            {
              event_id: event.id,
              player_id: playerId,
              status
            }
          ])
      }
      
      if (result.error) throw result.error
      
      // 4. Visa statusbekräftelse
      setResponseStatus(status)
      
      // 5. Uppdatera event-objektet med ny status
      setEvent({
        ...event,
        inviteStatus: status
      })
      
      // 6. Uppdatera antal bekräftade spelare
      if (status === 'accepted') {
        // Om tidigare status var 'declined', öka med 1
        if (event.inviteStatus === 'declined') {
          setConfirmedPlayers(prev => prev + 1)
        } 
        // Om tidigare status var null (ingen svar), öka med 1
        else if (event.inviteStatus !== 'accepted') {
          setConfirmedPlayers(prev => prev + 1)
        }
      } else if (status === 'declined') {
        // Om tidigare status var 'accepted', minska med 1
        if (event.inviteStatus === 'accepted') {
          setConfirmedPlayers(prev => prev - 1)
        }
      }
      
      // Visa statusbekräftelse tillfälligt
      setTimeout(() => {
        setResponseStatus(null)
      }, 3000)
      
    } catch (error) {
      console.error('Fel vid svar på inbjudan:', error)
      setError('Kunde inte svara på inbjudan')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Laddar evenemang...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className="text-lg font-semibold">Evenemanget hittades inte</p>
          <Button 
            variant="link" 
            className="mt-4"
            onClick={() => router.push('/events')}
          >
            Tillbaka till evenemang
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/events')}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Evenemangsdetaljer</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 container max-w-4xl mx-auto">
        <div className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`inline-block text-sm font-medium px-2 py-0.5 rounded-md mb-2 ${
                    event.type === 'training'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {event.type === 'training' ? 'Träning' : 'Match'}
                  </div>
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  <CardDescription>{event.team}</CardDescription>
                </div>
                
                <div className="text-center">
                  <div className="text-sm font-medium">Deltagare</div>
                  <div className="text-2xl font-bold text-primary">{confirmedPlayers}/{totalPlayers}</div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Datum</span>
                  </div>
                  <div className="font-medium">{event.date}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Tid</span>
                  </div>
                  <div className="font-medium">{event.start_time.substring(0, 5)} - {event.end_time.substring(0, 5)}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>Plats</span>
                  </div>
                  <div className="font-medium">{event.location}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users className="h-4 w-4" />
                    <span>Deltagandestatus</span>
                  </div>
                  <div>
                    {event.inviteStatus === 'accepted' ? (
                      <div className="inline-flex items-center text-green-600 text-sm font-medium px-2 py-1 bg-green-50 rounded-md">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Accepterad
                      </div>
                    ) : event.inviteStatus === 'declined' ? (
                      <div className="inline-flex items-center text-red-600 text-sm font-medium px-2 py-1 bg-red-50 rounded-md">
                        <XCircle className="h-4 w-4 mr-1" />
                        Avböjd
                      </div>
                    ) : (
                      <div className="italic text-muted-foreground">Ej svarat</div>
                    )}
                  </div>
                </div>
              </div>
              
              {event.description && (
                <div className="space-y-2 border-t pt-4">
                  <div className="font-medium">Beskrivning</div>
                  <div className="text-muted-foreground">
                    {event.description}
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                {responseStatus && (
                  <div className={`mb-4 p-3 text-sm font-medium rounded-md text-center ${
                    responseStatus === 'accepted' 
                      ? 'bg-green-50 text-green-600'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {responseStatus === 'accepted'
                      ? 'Du har accepterat inbjudan!'
                      : 'Du har avböjt inbjudan.'}
                  </div>
                )}
                
                <div className="grid gap-3">
                  {userRole !== 'player' ? (
                    <div className="text-center p-3 bg-gray-50 rounded-md text-muted-foreground">
                      <p>Endast spelare i laget kan delta</p>
                    </div>
                  ) : (
                    <>
                      {event.inviteStatus !== 'accepted' && (
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => handleEventResponse('accepted')}
                          disabled={responseStatus !== null}
                        >
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          {event.inviteStatus === 'declined' ? 'Ändra till accepterad' : 'Ja, jag deltar'}
                        </Button>
                      )}
                      
                      {event.inviteStatus !== 'declined' && (
                        <Button
                          variant={event.inviteStatus === 'accepted' ? 'destructive' : 'outline'}
                          className="w-full"
                          onClick={() => handleEventResponse('declined')}
                          disabled={responseStatus !== null}
                        >
                          <XCircle className="h-5 w-5 mr-2" />
                          {event.inviteStatus === 'accepted' ? 'Ändra till avböjd' : 'Nej, jag kan inte delta'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t px-6 py-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/events')}
              >
                Tillbaka till evenemangslistan
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
} 