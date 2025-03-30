'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Users, CheckCircle2, XCircle } from 'lucide-react'

type Event = {
  id: string
  title: string
  team: string
  team_id: string
  date: string // Format: YYYY-MM-DD
  start_time: string
  end_time: string
  type: 'training' | 'match'
  location: string
  description?: string
  inviteStatus?: 'pending' | 'accepted' | 'declined' | null
  inviteId?: string
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [responseStatus, setResponseStatus] = useState<{ [eventId: string]: string | null }>({})
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Kontrollera om användaren är inloggad och hämta e-postadressen
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      
      if (!data.session?.user) {
        router.push('/login')
        return
      }
      
      // Se till att e-postadressen finns innan vi sätter den
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
    // Hämta spelarens evenemang efter att vi har fått deras e-postadress
    if (userEmail) {
      fetchPlayerEvents()
    }
  }, [userEmail])

  const fetchPlayerEvents = async () => {
    try {
      setLoading(true)
      
      if (!userEmail) return
      
      // 1. Hitta spelar-ID baserat på e-postadress
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id, team_id')
        .eq('email', userEmail)
      
      if (playerError) throw playerError
      
      if (!playerData || playerData.length === 0) {
        setEvents([])
        setError('Inga spelare hittades för denna e-postadress')
        setLoading(false)
        return
      }
      
      // Hämta alla lag som spelaren är medlem i
      const teamIds = playerData.map(player => player.team_id)
      const playerIds = playerData.map(player => player.id)
      
      // 2. Hämta evenemang för dessa lag
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*, teams(name)')
        .in('team_id', teamIds)
        .gte('date', new Date().toISOString().split('T')[0]) // Filtrera endast kommande evenemang
        .order('date', { ascending: true })
      
      if (eventsError) throw eventsError
      
      // 3. Hämta inbjudningsstatus för varje evenemang
      const { data: invitesData, error: invitesError } = await supabase
        .from('invites')
        .select('id, event_id, status')
        .in('player_id', playerIds)
        .in('event_id', eventsData.map(event => event.id))
      
      if (invitesError) throw invitesError
      
      // 4. Kombinera evenemang med inbjudningsstatus
      const formattedEvents = eventsData.map(event => {
        // Hitta motsvarande inbjudan
        const invite = invitesData.find(invite => invite.event_id === event.id)
        
        // Formatera datumet för visning
        const eventDate = new Date(event.date)
        const formattedDate = eventDate.toLocaleDateString('sv-SE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        
        return {
          id: event.id,
          title: event.title,
          team: event.teams?.name || 'Okänt lag',
          team_id: event.team_id,
          date: formattedDate,
          rawDate: event.date, // För sortering
          start_time: event.start_time,
          end_time: event.end_time,
          type: event.type,
          location: event.location || '',
          description: event.description || '',
          inviteStatus: invite ? invite.status : null,
          inviteId: invite ? invite.id : undefined
        }
      })
      
      // Sortera evenemang efter datum
      formattedEvents.sort((a, b) => {
        // Jämför först datum
        const dateComparison = new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
        if (dateComparison !== 0) return dateComparison
        
        // Om samma datum, jämför starttid
        return a.start_time.localeCompare(b.start_time)
      })
      
      setEvents(formattedEvents)
      
    } catch (error) {
      console.error('Fel vid hämtning av evenemang:', error)
      setError('Kunde inte hämta evenemang')
    } finally {
      setLoading(false)
    }
  }

  const handleEventResponse = async (eventId: string, status: 'accepted' | 'declined') => {
    try {
      if (!userEmail) return
      
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
        .eq('event_id', eventId)
        .eq('player_id', playerId)
        .limit(1)
      
      if (inviteError) throw inviteError
      
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
              event_id: eventId,
              player_id: playerId,
              status
            }
          ])
      }
      
      if (result.error) throw result.error
      
      // 4. Uppdatera UI med den nya statusen
      setResponseStatus({ [eventId]: status })
      
      // 5. Uppdatera evenemangslistan efter svar
      setEvents(events.map(event => {
        if (event.id === eventId) {
          return { ...event, inviteStatus: status }
        }
        return event
      }))
      
      // Visa bekräftelse tillfälligt
      setTimeout(() => {
        setResponseStatus({ ...responseStatus, [eventId]: null })
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
            <h1 className="text-xl font-bold">Mina evenemang</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <span className="sr-only">Tillbaka</span>
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

      <main className="flex-1 p-4 container max-w-4xl mx-auto">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kommande evenemang</CardTitle>
              <CardDescription>Här kan du se dina kommande evenemang och svara på inbjudningar</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="rounded-md bg-red-50 p-4 mb-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Inga kommande evenemang hittades. Du kommer se evenemang här när ditt lag skapar dem.
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <Card key={event.id} className="min-w-0">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start mb-2">
                          <div className={`inline-block text-xs px-2 py-1 rounded-md ${
                            event.type === 'training'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {event.type === 'training' ? 'Träning' : 'Match'}
                          </div>
                          
                          {/* Visa alltid deltagarstatus om den finns, oavsett användarroll */}
                          {event.inviteStatus && (
                            <div className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-md ${
                              event.inviteStatus === 'accepted'
                                ? 'bg-green-50 text-green-600'
                                : 'bg-red-50 text-red-600'
                            }`}>
                              {event.inviteStatus === 'accepted' ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Accepterad
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Avböjd
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-lg truncate">{event.title}</CardTitle>
                        <CardDescription className="truncate">
                          {event.team}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="grid grid-cols-2 gap-1 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{event.start_time.substring(0, 5)} - {event.end_time.substring(0, 5)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground col-span-2 truncate">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex flex-col space-y-2">
                        <Button
                          variant="outline"
                          className="w-full text-sm"
                          onClick={() => router.push(`/events/${event.id}`)}
                        >
                          Visa detaljer
                        </Button>
                        
                        {/* Svarsalternativ - visa endast för användare med rollen "player" */}
                        {userRole === 'player' ? (
                          <div className="grid grid-cols-2 gap-2 w-full">
                            {/* Visa svarsknapparna endast om inte redan svarat */}
                            {!event.inviteStatus && (
                              <>
                                <Button
                                  variant="default"
                                  className="text-xs h-8"
                                  onClick={() => handleEventResponse(event.id, 'accepted')}
                                  disabled={!!responseStatus[event.id]}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                  Delta
                                </Button>
                                <Button
                                  variant="outline"
                                  className="text-xs h-8"
                                  onClick={() => handleEventResponse(event.id, 'declined')}
                                  disabled={!!responseStatus[event.id]}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                  Avböj
                                </Button>
                              </>
                            )}
                          </div>
                        ) : (
                          // Visa endast förklarande meddelande om användaren inte är spelare och status inte är satt
                          !event.inviteStatus && (
                            <div className="text-center px-2 py-1 bg-gray-50 rounded-md text-xs text-muted-foreground">
                              Endast spelare i laget kan delta
                            </div>
                          )
                        )}
                        
                        {/* Statusbekräftelse */}
                        {responseStatus[event.id] && (
                          <div className={`text-center p-2 text-xs font-medium rounded-md ${
                            responseStatus[event.id] === 'accepted'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {responseStatus[event.id] === 'accepted'
                              ? 'Du deltar i detta evenemang!'
                              : 'Du har avböjt detta evenemang.'}
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex justify-center w-full">
                <Button variant="outline" onClick={() => fetchPlayerEvents()}>
                  Uppdatera evenemang
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
} 