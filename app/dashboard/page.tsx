'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, PlusCircle, Users, Edit, UserPlus, Trash2, CheckCircle2, XCircle, Calendar, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Menu, User } from "lucide-react"

// Definiera types
type Team = {
  id: string
  name: string
  description: string | null
  created_at: string
  thumbnail_url?: string
}

type Event = {
  id: string
  title: string
  team: string
  team_id: string
  date: string
  start_time: string
  end_time: string
  type: "training" | "match"
  location: string
  confirmed: number
  total: number
  inviteStatus?: 'pending' | 'accepted' | 'declined' | null
  inviteId?: string
  canRespond: boolean
  formattedDate: string
  fullTime: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responseStatus, setResponseStatus] = useState<{ eventId: string, status: string } | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userPlayers, setUserPlayers] = useState<{id: string, team_id: string}[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [responseMessages, setResponseMessages] = useState<Record<string, string>>({})
  const [showAllEvents, setShowAllEvents] = useState(false)

  // Hämta teams när komponenten laddas
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        if (session.user.email) {
          setUserEmail(session.user.email)
        }

        // Hämta användarens roll från profiles-tabellen
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          if (profileData) {
            setUserRole(profileData.role)
          }
        } catch (error) {
          console.error('Kunde inte hämta användarroll:', error)
        }

        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('created_at', { ascending: false })

        if (teamsError) {
          throw teamsError
        }

        console.log('Fetched teams:', teamsData)
        setTeams(teamsData || [])
      } catch (error) {
        console.error('Error fetching teams:', error)
        setError('Failed to load teams')
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [router])

  // Lägg till hämtning av användarens spelare
  useEffect(() => {
    const fetchUserPlayers = async () => {
      if (!userEmail) return

      try {
        // Hämta alla spelare för den inloggade användaren
        const { data: players, error } = await supabase
          .from('players')
          .select('id, team_id')
          .eq('email', userEmail)
        
        if (error) throw error

        if (players) {
          setUserPlayers(players)
        }
      } catch (error) {
        console.error('Error fetching user players:', error)
      }
    }

    if (userEmail) {
      fetchUserPlayers()
    }
  }, [userEmail])

  // Hämta kommande händelser
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setEventsLoading(true)
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date()
        const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
        
        // Get one week from today's date
        const nextWeek = new Date(today)
        nextWeek.setDate(today.getDate() + 7)
        const formattedNextWeek = `${nextWeek.getFullYear()}-${(nextWeek.getMonth() + 1).toString().padStart(2, '0')}-${nextWeek.getDate().toString().padStart(2, '0')}`
        
        // Använd session för att hämta spelardata
        if (!userEmail || userPlayers.length === 0) {
          // Om användaren inte har några spelare, hämta bara evenemangen utan invite-status
          // Fetch events from today to 7 days ahead
          const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select(`
              id, 
              team_id, 
              title, 
              date, 
              start_time,
              end_time,
              description,
              location,
              type
            `)
            .gte('date', formattedDate) // Events from today and forward
            .lte('date', formattedNextWeek) // Events only up to next week
            .order('date')
            .order('start_time')
            .limit(10) // Visa fler events
          
          if (eventsError) {
            throw eventsError
          }
          
          // Convert events to our Event type
          const formattedEvents: Event[] = await Promise.all((eventsData || []).map(async (event) => {
            // Get team name based on team_id
            const { data: teamData } = await supabase
              .from('teams')
              .select('name')
              .eq('id', event.team_id)
              .single()
            
            const teamName = teamData?.name || 'Unknown team'
            
            // Get number of players in the team
            const { count } = await supabase
              .from('players')
              .select('*', { count: 'exact', head: true })
              .eq('team_id', event.team_id)
            
            // Get number of confirmed players
            const { count: confirmedCount } = await supabase
              .from('invites')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id)
              .eq('status', 'accepted')
            
            // Format the date for display
            const eventDate = new Date(event.date)
            let formattedDisplayDate = ""
            
            const today = new Date()
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            
            if (eventDate.toDateString() === today.toDateString()) {
              formattedDisplayDate = `Today, ${event.start_time.substring(0, 5)}`
            } else if (eventDate.toDateString() === tomorrow.toDateString()) {
              formattedDisplayDate = `Tomorrow, ${event.start_time.substring(0, 5)}`
            } else {
              // Get abbreviated weekday
              const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
              formattedDisplayDate = `${dayNames[eventDate.getDay()]}, ${event.start_time.substring(0, 5)}`
            }
            
            return {
              id: event.id,
              title: event.title,
              team: teamName,
              team_id: event.team_id,
              date: formattedDisplayDate,
              start_time: event.start_time,
              end_time: event.end_time,
              type: event.type as "training" | "match",
              location: event.location,
              confirmed: confirmedCount || 0,
              total: count || 0,
              inviteStatus: null,
              inviteId: undefined,
              canRespond: false, // Användare utan spelare kan inte svara
              formattedDate: formattedDisplayDate,
              fullTime: `${event.start_time.substring(0, 5)} - ${event.end_time.substring(0, 5)}`
            }
          }))
          
          console.log('Fetched upcoming events:', formattedEvents)
          setEvents(formattedEvents)
        } else {
          // Hämta evenemangen med invite-status
          // Fetch events from today to 7 days ahead
          const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select(`
              id, 
              team_id, 
              title, 
              date, 
              start_time,
              end_time,
              description,
              location,
              type
            `)
            .gte('date', formattedDate) // Events from today and forward
            .lte('date', formattedNextWeek) // Events only up to next week
            .order('date')
            .order('start_time')
            .limit(10) // Visa fler events
          
          if (eventsError) {
            throw eventsError
          }
          
          // Hämta inbjudningsstatus för alla evenemang
          const playerIds = userPlayers.map(player => player.id)
          
          // Säkerställ att vi har eventsData innan vi fortsätter
          if (!eventsData || eventsData.length === 0) {
            setEvents([])
            setEventsLoading(false)
            return
          }

          const { data: invitesData, error: invitesError } = await supabase
            .from('invites')
            .select('id, event_id, player_id, status')
            .in('player_id', playerIds)
            .in('event_id', eventsData.map(event => event.id))
          
          if (invitesError) throw invitesError
          
          // Convert events to our Event type
          const formattedEvents: Event[] = await Promise.all((eventsData || []).map(async (event) => {
            // Get team name based on team_id
            const { data: teamData } = await supabase
              .from('teams')
              .select('name')
              .eq('id', event.team_id)
              .single()
            
            const teamName = teamData?.name || 'Unknown team'
            
            // Get number of players in the team
            const { count } = await supabase
              .from('players')
              .select('*', { count: 'exact', head: true })
              .eq('team_id', event.team_id)
            
            // Get number of confirmed players
            const { count: confirmedCount } = await supabase
              .from('invites')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id)
              .eq('status', 'accepted')
            
            // Format the date for display
            const eventDate = new Date(event.date)
            let formattedDisplayDate = ""
            
            const today = new Date()
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            
            if (eventDate.toDateString() === today.toDateString()) {
              formattedDisplayDate = `Today, ${event.start_time.substring(0, 5)}`
            } else if (eventDate.toDateString() === tomorrow.toDateString()) {
              formattedDisplayDate = `Tomorrow, ${event.start_time.substring(0, 5)}`
            } else {
              // Get abbreviated weekday
              const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
              formattedDisplayDate = `${dayNames[eventDate.getDay()]}, ${event.start_time.substring(0, 5)}`
            }
            
            // Kontrollera om användaren är medlem i laget och kan svara på eventet
            const isTeamMember = userPlayers.some(player => player.team_id === event.team_id)
            
            // Hitta en eventuell inbjudan för detta event
            // Vi prioriterar inbjudningar där spelaren tillhör samma lag
            let bestInvite = null
            const matchingPlayerIds = userPlayers
              .filter(player => player.team_id === event.team_id)
              .map(player => player.id)
            
            // Först, försök hitta en inbjudan för en spelare som är i samma lag
            if (invitesData) {
              bestInvite = invitesData.find(invite => 
                invite.event_id === event.id && 
                matchingPlayerIds.includes(invite.player_id)
              )
              
              // Om vi inte hittar en sådan, ta den första inbjudan för eventet
              if (!bestInvite) {
                bestInvite = invitesData.find(invite => invite.event_id === event.id)
              }
            }
            
            return {
              id: event.id,
              title: event.title,
              team: teamName,
              team_id: event.team_id,
              date: formattedDisplayDate,
              start_time: event.start_time,
              end_time: event.end_time,
              type: event.type as "training" | "match",
              location: event.location,
              confirmed: confirmedCount || 0,
              total: count || 0,
              inviteStatus: bestInvite ? bestInvite.status : null,
              inviteId: bestInvite ? bestInvite.id : undefined,
              canRespond: isTeamMember,
              formattedDate: formattedDisplayDate,
              fullTime: `${event.start_time.substring(0, 5)} - ${event.end_time.substring(0, 5)}`
            }
          }))
          
          console.log('Fetched upcoming events:', formattedEvents)
          setEvents(formattedEvents)
        }
      } catch (error) {
        console.error('Error fetching upcoming events:', error)
      } finally {
        setEventsLoading(false)
      }
    }
    
    // Only fetch events if teams have been loaded and we have user players
    if (!loading && userPlayers.length > 0) {
      fetchUpcomingEvents()
    } else if (!loading) {
      // Om det inte finns några userPlayers, hämta ändå evenemangen utan invite-status
      fetchUpcomingEvents()
    }
  }, [loading, userPlayers, userEmail])

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    // Första bekräftelsedialogen
    if (!confirm(`Are you sure you want to delete the team "${teamName}"?\n\nThis will:\n- Remove all players in the team\n- Remove all events associated with the team\n- This cannot be undone!`)) {
      return
    }

    // Andra bekräftelsedialogen
    if (!confirm(`Do you REALLY want to delete the team "${teamName}"?\n\nThis is your last chance to cancel!\n\nType "DELETE" to confirm:`)) {
      return
    }

    try {
      // Kontrollera användarens behörighet
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('You must be logged in to delete a team')
        return
      }

      // Kontrollera att användaren är admin för laget
      const { data: teamData, error: teamCheckError } = await supabase
        .from('teams')
        .select('admin_id')
        .eq('id', teamId)
        .single()

      if (teamCheckError) {
        throw new Error('Could not verify team owner')
      }

      if (teamData.admin_id !== session.user.id) {
        throw new Error('You do not have permission to delete this team')
      }

      // Ta bort alla invites för lagets events
      const { error: invitesError } = await supabase
        .from('invites')
        .delete()
        .eq('event_id', teamId)

      if (invitesError) {
        console.error('Error deleting invites:', invitesError)
        throw new Error('Could not delete invitations')
      }

      // Ta bort alla events för laget
      const { error: eventsError } = await supabase
        .from('events')
        .delete()
        .eq('team_id', teamId)

      if (eventsError) {
        console.error('Error deleting events:', eventsError)
        throw new Error('Could not delete events')
      }

      // Ta bort alla spelare i laget
      const { error: playersError } = await supabase
        .from('players')
        .delete()
        .eq('team_id', teamId)

      if (playersError) {
        console.error('Error deleting players:', playersError)
        throw new Error('Could not delete players')
      }

      // Ta bort själva laget
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (teamError) {
        console.error('Error deleting team:', teamError)
        throw new Error('Could not delete the team')
      }

      // Uppdatera UI:t endast om alla operationer lyckades
      setTeams(teams.filter(team => team.id !== teamId))
      
      // Visa bekräftelsemeddelande
      alert('The team has been successfully deleted!')
      
      // Ladda om sidan för att säkerställa att allt är uppdaterat
      window.location.reload()
    } catch (error) {
      console.error('Error in delete operation:', error)
      setError(error instanceof Error ? error.message : 'Could not delete the team. Check that you have permission.')
    }
  }

  const handleEventResponse = async (eventId: string, status: 'accepted' | 'declined') => {
    try {
      if (!userEmail) return
      
      // 1. Hitta användarens spelar-ID
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('email', userEmail)
        .limit(1)
        .single()
      
      if (playerError) throw playerError
      
      // 2. Kolla om det finns en befintlig inbjudan
      const { data: existingInvite, error: inviteError } = await supabase
        .from('invites')
        .select('id')
        .eq('event_id', eventId)
        .eq('player_id', playerData.id)
        .limit(1)
      
      if (inviteError && inviteError.code !== 'PGRST116') throw inviteError
      
      // 3. Uppdatera eller skapa ny inbjudan med svar
      let result
      
      if (existingInvite && existingInvite.length > 0) {
        result = await supabase
          .from('invites')
          .update({ status })
          .eq('id', existingInvite[0].id)
      } else {
        result = await supabase
          .from('invites')
          .insert([{
            event_id: eventId,
            player_id: playerData.id,
            status
          }])
      }
      
      if (result.error) throw result.error
      
      // Hämta uppdaterat antal deltagare för eventet
      const { count: confirmedCount, error: confirmedCountError } = await supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'accepted')
      
      if (confirmedCountError) {
        console.error('Error fetching confirmed count:', confirmedCountError)
      }
      
      // 4. Uppdatera UI med både status och uppdaterat antal deltagare
      setEvents(prevEvents =>
        prevEvents.map(event => 
          event.id === eventId
            ? { 
                ...event, 
                inviteStatus: status,
                confirmed: status === 'accepted' 
                  ? (confirmedCount || event.confirmed + 1) // Om vi inte kan hämta count, öka med 1
                  : (confirmedCount || Math.max(0, event.confirmed - 1)) // Om vi inte kan hämta count, minska med 1
              }
            : event
        )
      )
      
      // 5. Visa bekräftelsemeddelande tillfälligt (översätt meddelanden till engelska)
      setResponseMessages(prev => ({
        ...prev,
        [eventId]: status === 'accepted' 
          ? 'You are attending this event!' 
          : 'You have declined this event.'
      }))
      
      setTimeout(() => {
        setResponseMessages(prev => {
          const newMessages = { ...prev }
          delete newMessages[eventId]
          return newMessages
        })
      }, 3000)
      
    } catch (error) {
      console.error('Error responding to invitation:', error)
    }
  }

  // Lägg till funktion för att hämta alla events (50 istället för 10)
  const fetchAllEvents = async () => {
    try {
      setEventsLoading(true)
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date()
      const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
      
      // Använd session för att hämta spelardata
      if (!userEmail || userPlayers.length === 0) {
        // ... baserat på befintlig kod för användare utan spelare, men hämta 50 events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id, 
            team_id, 
            title, 
            date, 
            start_time,
            end_time,
            description,
            location,
            type
          `)
          .gte('date', formattedDate) // Events from today and forward
          .order('date')
          .order('start_time')
          .limit(50) // Hämta upp till 50 events
        
        if (eventsError) {
          throw eventsError
        }
        
        // Convert events to our Event type
        const formattedEvents: Event[] = await Promise.all((eventsData || []).map(async (event) => {
          // ... koden för att formattera events (samma som för fetchUpcomingEvents)
          // Get team name based on team_id
          const { data: teamData } = await supabase
            .from('teams')
            .select('name')
            .eq('id', event.team_id)
            .single()
          
          const teamName = teamData?.name || 'Unknown team'
          
          // Get number of players in the team
          const { count } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', event.team_id)
          
          // Get number of confirmed players
          const { count: confirmedCount } = await supabase
            .from('invites')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('status', 'accepted')
          
          // Format the date for display
          const eventDate = new Date(event.date)
          let formattedDisplayDate = ""
          
          const today = new Date()
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          
          if (eventDate.toDateString() === today.toDateString()) {
            formattedDisplayDate = `Today, ${event.start_time.substring(0, 5)}`
          } else if (eventDate.toDateString() === tomorrow.toDateString()) {
            formattedDisplayDate = `Tomorrow, ${event.start_time.substring(0, 5)}`
          } else {
            // Get abbreviated weekday
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            formattedDisplayDate = `${dayNames[eventDate.getDay()]}, ${event.start_time.substring(0, 5)}`
          }
          
          return {
            id: event.id,
            title: event.title,
            team: teamName,
            team_id: event.team_id,
            date: formattedDisplayDate,
            start_time: event.start_time,
            end_time: event.end_time,
            type: event.type as "training" | "match",
            location: event.location,
            confirmed: confirmedCount || 0,
            total: count || 0,
            inviteStatus: null,
            inviteId: undefined,
            canRespond: false, // Användare utan spelare kan inte svara
            formattedDate: formattedDisplayDate,
            fullTime: `${event.start_time.substring(0, 5)} - ${event.end_time.substring(0, 5)}`
          }
        }))
        
        console.log('Fetched all upcoming events:', formattedEvents)
        setEvents(formattedEvents)
      } else {
        // ... baserat på befintlig kod för användare med spelare, men hämta 50 events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id, 
            team_id, 
            title, 
            date, 
            start_time,
            end_time,
            description,
            location,
            type
          `)
          .gte('date', formattedDate) // Events from today and forward
          .order('date')
          .order('start_time')
          .limit(50) // Hämta upp till 50 events
        
        if (eventsError) {
          throw eventsError
        }
        
        // Hämta inbjudningsstatus för alla evenemang
        const playerIds = userPlayers.map(player => player.id)
        
        // Säkerställ att vi har eventsData innan vi fortsätter
        if (!eventsData || eventsData.length === 0) {
          setEvents([])
          setEventsLoading(false)
          return
        }

        const { data: invitesData, error: invitesError } = await supabase
          .from('invites')
          .select('id, event_id, player_id, status')
          .in('player_id', playerIds)
          .in('event_id', eventsData.map(event => event.id))
        
        if (invitesError) throw invitesError
        
        // Convert events to our Event type
        const formattedEvents: Event[] = await Promise.all((eventsData || []).map(async (event) => {
          // ... koden för att formattera events (samma som för fetchUpcomingEvents)
          // Get team name based on team_id
          const { data: teamData } = await supabase
            .from('teams')
            .select('name')
            .eq('id', event.team_id)
            .single()
          
          const teamName = teamData?.name || 'Unknown team'
          
          // Get number of players in the team
          const { count } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', event.team_id)
          
          // Get number of confirmed players
          const { count: confirmedCount } = await supabase
            .from('invites')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('status', 'accepted')
          
          // Format the date for display
          const eventDate = new Date(event.date)
          let formattedDisplayDate = ""
          
          const today = new Date()
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          
          if (eventDate.toDateString() === today.toDateString()) {
            formattedDisplayDate = `Today, ${event.start_time.substring(0, 5)}`
          } else if (eventDate.toDateString() === tomorrow.toDateString()) {
            formattedDisplayDate = `Tomorrow, ${event.start_time.substring(0, 5)}`
          } else {
            // Get abbreviated weekday
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            formattedDisplayDate = `${dayNames[eventDate.getDay()]}, ${event.start_time.substring(0, 5)}`
          }
          
          // Kontrollera om användaren är medlem i laget och kan svara på eventet
          const isTeamMember = userPlayers.some(player => player.team_id === event.team_id)
          
          // Hitta en eventuell inbjudan för detta event
          // Vi prioriterar inbjudningar där spelaren tillhör samma lag
          let bestInvite = null
          const matchingPlayerIds = userPlayers
            .filter(player => player.team_id === event.team_id)
            .map(player => player.id)
          
          // Först, försök hitta en inbjudan för en spelare som är i samma lag
          if (invitesData) {
            bestInvite = invitesData.find(invite => 
              invite.event_id === event.id && 
              matchingPlayerIds.includes(invite.player_id)
            )
            
            // Om vi inte hittar en sådan, ta den första inbjudan för eventet
            if (!bestInvite) {
              bestInvite = invitesData.find(invite => invite.event_id === event.id)
            }
          }
          
          return {
            id: event.id,
            title: event.title,
            team: teamName,
            team_id: event.team_id,
            date: formattedDisplayDate,
            start_time: event.start_time,
            end_time: event.end_time,
            type: event.type as "training" | "match",
            location: event.location,
            confirmed: confirmedCount || 0,
            total: count || 0,
            inviteStatus: bestInvite ? bestInvite.status : null,
            inviteId: bestInvite ? bestInvite.id : undefined,
            canRespond: isTeamMember,
            formattedDate: formattedDisplayDate,
            fullTime: `${event.start_time.substring(0, 5)} - ${event.end_time.substring(0, 5)}`
          }
        }))
        
        console.log('Fetched all upcoming events:', formattedEvents)
        setEvents(formattedEvents)
      }
    } catch (error) {
      console.error('Error fetching all upcoming events:', error)
    } finally {
      setEventsLoading(false)
    }
  }

  // Uppdatera Hantera klick på "Show all events"-funktionen
  const handleShowAllEvents = () => {
    setShowAllEvents(true);
    fetchAllEvents();
  }

  // Lägg till en funktion för att gå tillbaka till veckovy
  const handleShowWeekEvents = () => {
    setShowAllEvents(false);
    // Hämta bara events för kommande vecka
    try {
      setEventsLoading(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      
      // Get one week from today's date
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const formattedNextWeek = `${nextWeek.getFullYear()}-${(nextWeek.getMonth() + 1).toString().padStart(2, '0')}-${nextWeek.getDate().toString().padStart(2, '0')}`;
      
      // Fetch events from today to 7 days ahead
      const fetchThisWeekEvents = async () => {
        if (!userEmail || userPlayers.length === 0) {
          // Koden för användare utan spelare
          const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select(`
              id, 
              team_id, 
              title, 
              date, 
              start_time,
              end_time,
              description,
              location,
              type
            `)
            .gte('date', formattedDate) // Events from today and forward
            .lte('date', formattedNextWeek) // Events only up to next week
            .order('date')
            .order('start_time')
            .limit(10);
            
          // Resten av koden för att formatera och sätta events
          // ...samma som i useEffect
          if (eventsError) {
            throw eventsError;
          }
          
          // Convert events to our Event type
          const formattedEvents: Event[] = await Promise.all((eventsData || []).map(async (event) => {
            // Get team name based on team_id
            const { data: teamData } = await supabase
              .from('teams')
              .select('name')
              .eq('id', event.team_id)
              .single();
            
            const teamName = teamData?.name || 'Unknown team';
            
            // Get number of players in the team
            const { count } = await supabase
              .from('players')
              .select('*', { count: 'exact', head: true })
              .eq('team_id', event.team_id);
            
            // Get number of confirmed players
            const { count: confirmedCount } = await supabase
              .from('invites')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id)
              .eq('status', 'accepted');
            
            // Format the date for display
            const eventDate = new Date(event.date);
            let formattedDisplayDate = "";
            
            const displayToday = new Date();
            const tomorrow = new Date(displayToday);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (eventDate.toDateString() === displayToday.toDateString()) {
              formattedDisplayDate = `Today, ${event.start_time.substring(0, 5)}`;
            } else if (eventDate.toDateString() === tomorrow.toDateString()) {
              formattedDisplayDate = `Tomorrow, ${event.start_time.substring(0, 5)}`;
            } else {
              // Get abbreviated weekday
              const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              formattedDisplayDate = `${dayNames[eventDate.getDay()]}, ${event.start_time.substring(0, 5)}`;
            }
            
            return {
              id: event.id,
              title: event.title,
              team: teamName,
              team_id: event.team_id,
              date: formattedDisplayDate,
              start_time: event.start_time,
              end_time: event.end_time,
              type: event.type as "training" | "match",
              location: event.location,
              confirmed: confirmedCount || 0,
              total: count || 0,
              inviteStatus: null,
              inviteId: undefined,
              canRespond: false, // Användare utan spelare kan inte svara
              formattedDate: formattedDisplayDate,
              fullTime: `${event.start_time.substring(0, 5)} - ${event.end_time.substring(0, 5)}`
            };
          }));
          
          setEvents(formattedEvents);
          
        } else {
          // Koden för användare med spelare
          // Fetch events from today to 7 days ahead
          const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select(`
              id, 
              team_id, 
              title, 
              date, 
              start_time,
              end_time,
              description,
              location,
              type
            `)
            .gte('date', formattedDate) // Events from today and forward
            .lte('date', formattedNextWeek) // Events only up to next week
            .order('date')
            .order('start_time')
            .limit(10);
            
          if (eventsError) {
            throw eventsError;
          }
          
          // Hämta inbjudningsstatus för alla evenemang
          const playerIds = userPlayers.map(player => player.id);
          
          // Säkerställ att vi har eventsData innan vi fortsätter
          if (!eventsData || eventsData.length === 0) {
            setEvents([]);
            setEventsLoading(false);
            return;
          }

          const { data: invitesData, error: invitesError } = await supabase
            .from('invites')
            .select('id, event_id, player_id, status')
            .in('player_id', playerIds)
            .in('event_id', eventsData.map(event => event.id));
          
          if (invitesError) throw invitesError;
          
          // Convert events to our Event type
          const formattedEvents: Event[] = await Promise.all((eventsData || []).map(async (event) => {
            // Get team name based on team_id
            const { data: teamData } = await supabase
              .from('teams')
              .select('name')
              .eq('id', event.team_id)
              .single();
            
            const teamName = teamData?.name || 'Unknown team';
            
            // Get number of players in the team
            const { count } = await supabase
              .from('players')
              .select('*', { count: 'exact', head: true })
              .eq('team_id', event.team_id);
            
            // Get number of confirmed players
            const { count: confirmedCount } = await supabase
              .from('invites')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id)
              .eq('status', 'accepted');
            
            // Format the date for display
            const eventDate = new Date(event.date);
            let formattedDisplayDate = "";
            
            const displayToday = new Date();
            const tomorrow = new Date(displayToday);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (eventDate.toDateString() === displayToday.toDateString()) {
              formattedDisplayDate = `Today, ${event.start_time.substring(0, 5)}`;
            } else if (eventDate.toDateString() === tomorrow.toDateString()) {
              formattedDisplayDate = `Tomorrow, ${event.start_time.substring(0, 5)}`;
            } else {
              // Get abbreviated weekday
              const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              formattedDisplayDate = `${dayNames[eventDate.getDay()]}, ${event.start_time.substring(0, 5)}`;
            }
            
            // Kontrollera om användaren är medlem i laget och kan svara på eventet
            const isTeamMember = userPlayers.some(player => player.team_id === event.team_id);
            
            // Hitta en eventuell inbjudan för detta event
            // Vi prioriterar inbjudningar där spelaren tillhör samma lag
            let bestInvite = null;
            const matchingPlayerIds = userPlayers
              .filter(player => player.team_id === event.team_id)
              .map(player => player.id);
            
            // Först, försök hitta en inbjudan för en spelare som är i samma lag
            if (invitesData) {
              bestInvite = invitesData.find(invite => 
                invite.event_id === event.id && 
                matchingPlayerIds.includes(invite.player_id)
              );
              
              // Om vi inte hittar en sådan, ta den första inbjudan för eventet
              if (!bestInvite) {
                bestInvite = invitesData.find(invite => invite.event_id === event.id);
              }
            }
            
            return {
              id: event.id,
              title: event.title,
              team: teamName,
              team_id: event.team_id,
              date: formattedDisplayDate,
              start_time: event.start_time,
              end_time: event.end_time,
              type: event.type as "training" | "match",
              location: event.location,
              confirmed: confirmedCount || 0,
              total: count || 0,
              inviteStatus: bestInvite ? bestInvite.status : null,
              inviteId: bestInvite ? bestInvite.id : undefined,
              canRespond: isTeamMember,
              formattedDate: formattedDisplayDate,
              fullTime: `${event.start_time.substring(0, 5)} - ${event.end_time.substring(0, 5)}`
            };
          }));
          
          setEvents(formattedEvents);
        }
        
        setEventsLoading(false);
      };
      
      fetchThisWeekEvents();
      
    } catch (error) {
      console.error('Error fetching week events:', error);
      setEventsLoading(false);
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push("/login")
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2">Loading teams...</p>
      </div>
    </div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Team Manager</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Teams</h2>
            <Link href="/teams/create">
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Create Team
              </Button>
            </Link>
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <div className="grid gap-4">
            {teams.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No teams created yet. Create your first team to get started!
                </CardContent>
              </Card>
            ) : (
              teams.map((team) => (
                <Card key={team.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                        {team.thumbnail_url ? (
                          <img 
                            src={team.thumbnail_url} 
                            alt={team.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{team.name}</h3>
                        {team.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {team.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/teams/${team.id}/players`}>
                          <Button variant="default" size="sm">
                            <Users className="h-4 w-4 mr-1" />
                            Players
                          </Button>
                        </Link>
                        <Link href={`/teams/${team.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{showAllEvents ? "All Upcoming Events" : "This Week's Events"}</CardTitle>
                <CardDescription>
                  {showAllEvents 
                    ? "All your upcoming events" 
                    : "Events scheduled for the next 7 days"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No upcoming events scheduled</p>
                    <Link href="/calendar" className="mt-2 inline-block">
                      <Button size="sm" variant="outline" className="gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        Schedule an event
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div 
                        key={event.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          event.type === 'training' 
                            ? 'border-l-primary bg-primary/5' 
                            : 'border-l-blue-500 bg-blue-50'
                        } relative`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground">{event.team}</div>
                            <div className="flex mt-2 gap-4 text-sm">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>{event.formattedDate}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>{event.fullTime}</span>
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>{event.confirmed}/{event.total}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Visa alltid inbjudningsstatus om tillgänglig */}
                          <div className="flex flex-col items-end gap-2">
                            {event.inviteStatus && (
                              <div className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-md ${
                                event.inviteStatus === 'accepted'
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-red-100 text-red-600'
                              }`}>
                                {event.inviteStatus === 'accepted' ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Accepted
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Declined
                                  </>
                                )}
                              </div>
                            )}
                            
                            {/* Visa svarsknappar om användaren har en spelare i laget och inte redan svarat */}
                            {event.canRespond && !event.inviteStatus && (
                              <div className="flex gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleEventResponse(event.id, 'accepted')}
                                  disabled={!!responseMessages[event.id]}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Attend
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleEventResponse(event.id, 'declined')}
                                  disabled={!!responseMessages[event.id]}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            )}
                            
                            {/* Visa förklarande meddelande om användaren inte kan svara */}
                            {!event.canRespond && !event.inviteStatus && (
                              <div className="text-xs text-muted-foreground px-2 py-1 bg-gray-50 rounded-md">
                                Join the team to participate
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Visa bekräftelsemeddelande tillfälligt */}
                        {responseMessages[event.id] && (
                          <div className={`absolute bottom-0 left-0 right-0 p-2 text-center text-xs font-medium rounded-b-lg ${
                            event.inviteStatus === 'accepted' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {responseMessages[event.id]}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="text-center pt-3">
                      {!showAllEvents ? (
                        <Button variant="link" onClick={handleShowAllEvents}>
                          Show all upcoming events
                        </Button>
                      ) : (
                        <Button variant="link" onClick={handleShowWeekEvents}>
                          Show only this week
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <nav className="sticky bottom-0 z-10 border-t bg-background">
        <div className="grid grid-cols-3 divide-x">
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
            <span className="mt-1 text-xs">Home</span>
          </Link>
          <Link href="/teams" className="flex flex-col items-center justify-center py-3 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span className="mt-1 text-xs">Teams</span>
          </Link>
          <Link href="/calendar" className="flex flex-col items-center justify-center py-3 text-muted-foreground">
            <CalendarIcon className="h-5 w-5" />
            <span className="mt-1 text-xs">Calendar</span>
          </Link>
        </div>
      </nav>
    </div>
  )
} 