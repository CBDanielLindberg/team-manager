"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea" 
import { ChevronLeft, Clock, MapPin, PlusCircle, Users, X, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Types for events
interface Event {
  id: string;
  title: string;
  team: string;
  team_id: string;
  type: "training" | "match";
  date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  location: string;
  confirmed: number;
  total: number;
  description?: string;
}

// Team type from Supabase
interface Team {
  id: string;
  name: string;
  description?: string | null;
  admin_id?: string;
  created_at?: string;
}

// Event from Supabase structure
interface SupabaseEvent {
  id: string;
  team_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string | null;
  location: string;
  type: "training" | "match";
  created_at?: string;
}

// Simple calendar component
function SimpleCalendar({ selected, onChange, events }: { 
  selected: Date | null, 
  onChange: (date: Date) => void,
  events: Event[] 
}) {
  const today = new Date();
  const currentMonth = selected ? selected.getMonth() : today.getMonth();
  const currentYear = selected ? selected.getFullYear() : today.getFullYear();

  // Get first day of the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.
  
  // Number of days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Create an array of days
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null); // Empty spaces for days not in the month
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Weekday labels
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Format month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Function to get events for a specific day
  const getEventsForDay = (day: number) => {
    const dateToCheck = new Date(currentYear, currentMonth, day);
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === dateToCheck.getDate() &&
        eventDate.getMonth() === dateToCheck.getMonth() &&
        eventDate.getFullYear() === dateToCheck.getFullYear()
      );
    });
  };

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-medium">{monthNames[currentMonth]} {currentYear}</h3>
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onChange(new Date(currentYear, currentMonth - 1, 1))}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(new Date(currentYear, currentMonth + 1, 1))}
          >
            <ChevronLeft className="h-3 w-3 rotate-180" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {weekdays.map((day) => (
          <div key={day} className="text-center text-muted-foreground py-0.5">
            {day}
          </div>
        ))}
        
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-full" />;
          }

          const date = new Date(currentYear, currentMonth, day);
          const isSelected = selected && 
            date.getDate() === selected.getDate() && 
            date.getMonth() === selected.getMonth() && 
            date.getFullYear() === selected.getFullYear();
          
          const isToday = 
            date.getDate() === today.getDate() && 
            date.getMonth() === today.getMonth() && 
            date.getFullYear() === today.getFullYear();
            
          const dayEvents = getEventsForDay(day);
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={`day-${day}`}
              className={`border rounded-md overflow-hidden ${
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : isToday 
                    ? 'border-primary/50' 
                    : hasEvents 
                      ? 'border-slate-200 hover:border-primary/30' 
                      : 'border-transparent hover:border-slate-200'
              }`}
              onClick={() => onChange(date)}
              style={{ height: '110px' }}
            >
              <div className={`text-center py-0.5 ${
                isSelected 
                  ? 'bg-primary text-primary-foreground' 
                  : isToday 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-slate-50'
              }`}>
                {day}
              </div>
              <div className="p-0.5 overflow-y-auto" style={{ height: 'calc(100% - 19px)' }}>
                {dayEvents.slice(0, 6).map((event, idx) => (
                  <div 
                    key={`${event.id}-${idx}`} 
                    className={`text-[0.65rem] mb-0.5 px-1 py-0.5 rounded truncate ${
                      event.type === 'training' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-blue-50 text-blue-700'
                    }`}
                    title={`${event.title} - ${event.team} (${event.start_time}-${event.end_time})`}
                  >
                    <div className="text-[0.6rem] font-medium truncate">
                      {event.team}
                    </div>
                    <div className="flex justify-between">
                      <span className="truncate">{event.start_time.substring(0, 5)}-{event.end_time.substring(0, 5)} {event.title}</span>
                    </div>
                  </div>
                ))}
                {dayEvents.length > 6 && (
                  <div className="text-[0.65rem] text-muted-foreground text-center">
                    +{dayEvents.length - 6} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Calendar() {
  const [date, setDate] = useState<Date | null>(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [showNewEventForm, setShowNewEventForm] = useState(false)
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    type: "training",
    date: date ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : "",
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pathname = usePathname()
  
  // Determine if we are in admin mode or regular user mode
  const isAdminMode = pathname?.startsWith('/admin')
  
  // Set up base paths for navigation based on whether we are in admin mode or not
  const basePath = isAdminMode ? '/admin' : ''
  const dashboardPath = `${basePath}/dashboard`
  const teamsPath = `${basePath}/teams`
  const calendarPath = `${basePath}/calendar`
  const profilePath = `${basePath}/profile`

  // Fetch teams and events from the database
  useEffect(() => {
    const fetchTeamsAndEvents = async () => {
      try {
        setIsLoading(true)
        
        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('name')

        if (teamsError) {
          throw teamsError
        }
        
        setTeams(teamsData || [])
        
        // Fetch events
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
          .order('date')

        if (eventsError) {
          throw eventsError
        }
        
        // Convert events to our Event type
        const formattedEvents: Event[] = await Promise.all((eventsData || []).map(async (event: SupabaseEvent) => {
          // Get team name based on team_id
          const teamName = teamsData?.find(team => team.id === event.team_id)?.name || 'Unknown team'
          
          // Get number of players in the team to calculate total
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
          
          return {
            id: event.id,
            title: event.title,
            team: teamName,
            team_id: event.team_id,
            type: event.type,
            date: event.date,
            start_time: event.start_time,
            end_time: event.end_time,
            location: event.location || '',
            description: event.description || '',
            confirmed: confirmedCount || 0,
            total: count || 0,
          }
        }))
        
        setEvents(formattedEvents)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching:', error)
        setErrorMessage('Could not fetch data from database')
        setIsLoading(false)
      }
    }

    fetchTeamsAndEvents()
  }, [])

  // Get events for the selected date
  const selectedDateEvents = events.filter((event) => {
    if (!date) return false;
    const eventDate = new Date(event.date)
    return (
      eventDate.getDate() === date.getDate() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getFullYear() === date.getFullYear()
    )
  })

  // Function to handle changes in the form
  const handleEventChange = (key: keyof Event, value: string) => {
    setNewEvent({ ...newEvent, [key]: value })
  }

  // When a team is selected, update teamId in the event
  const handleTeamChange = (teamName: string) => {
    const selectedTeam = teams.find(team => team.name === teamName)
    if (selectedTeam) {
      setNewEvent({ 
        ...newEvent, 
        team: teamName,
        team_id: selectedTeam.id
      })
    }
  }

  // Validate the form
  const validateForm = (): boolean => {
    if (!newEvent.title?.trim()) {
      setErrorMessage("Title is required")
      return false
    }
    if (!newEvent.team?.trim()) {
      setErrorMessage("You must select a team")
      return false
    }
    if (!newEvent.team_id) {
      setErrorMessage("Problem with selected team, please select again")
      return false
    }
    if (!newEvent.date) {
      setErrorMessage("You must select a date")
      return false
    }
    if (!newEvent.start_time?.trim()) {
      setErrorMessage("Start time is required")
      return false
    }
    if (!newEvent.end_time?.trim()) {
      setErrorMessage("End time is required")
      return false
    }
    if (!newEvent.location?.trim()) {
      setErrorMessage("Location is required")
      return false
    }

    setErrorMessage(null)
    return true
  }

  // Function to create a new event
  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      
      // Log what we're trying to save for debugging
      console.log('Trying to save event:', {
        team_id: newEvent.team_id,
        title: newEvent.title,
        date: newEvent.date,
        start_time: newEvent.start_time,
        end_time: newEvent.end_time,
        description: newEvent.description || '',
        location: newEvent.location,
        type: newEvent.type
      });
      
      // Save the event in Supabase
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([
          {
            team_id: newEvent.team_id,
            title: newEvent.title,
            date: newEvent.date,
            start_time: newEvent.start_time,
            end_time: newEvent.end_time,
            description: newEvent.description || '',
            location: newEvent.location,
            type: newEvent.type,
            // Use only start_time which is in HH:MM format and can be converted to TIME type
            time: newEvent.start_time || '09:00'
          }
        ])
        .select()
        .single()
        
      if (eventError) {
        console.error('Supabase error:', eventError);
        throw eventError
      }
      
      // Create new event object for our local state
      const newTeam = teams.find(team => team.id === newEvent.team_id)
      const teamName = newTeam?.name || 'Unknown team'
      
      // Get number of players in the team
      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', newEvent.team_id)
      
      const createdEvent: Event = {
        id: eventData.id,
        title: newEvent.title!,
        team: teamName,
        team_id: newEvent.team_id!,
        type: newEvent.type as "training" | "match",
        date: newEvent.date!,
        start_time: newEvent.start_time!,
        end_time: newEvent.end_time!,
        location: newEvent.location!,
        description: newEvent.description,
        confirmed: 0,
        total: count || 0
      }

      // Update local state
      setEvents([...events, createdEvent])
      
      // Reset the form
      setNewEvent({
        type: "training",
        date: date ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : "",
        start_time: "",
        end_time: ""
      })
      setShowNewEventForm(false)
      
    } catch (error: any) {
      console.error('Error saving event:', error);
      // Show more detailed error message
      let errorMsg = 'Could not save the event in the database';
      if (error.message) {
        errorMsg += `: ${error.message}`;
      }
      if (error.details) {
        errorMsg += ` (${error.details})`;
      }
      if (error.hint) {
        errorMsg += ` Hint: ${error.hint}`;
      }
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: Date | null): string => {
    if (!date) return "No date selected";
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  // Helper function to guarantee correct type for event.type
  const handleTypeChange = (value: string) => {
    // Convert the value to one of the two allowed types
    const typedValue = value === "match" ? "match" as const : "training" as const;
    handleEventChange("type", typedValue);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Schedule</h1>
          <Button size="sm" className="gap-1" onClick={() => setShowNewEventForm(true)}>
            <PlusCircle className="h-4 w-4" />
            New Event
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4">
        {showNewEventForm ? (
          <Card>
            <CardHeader>
              <CardTitle>Create New Event</CardTitle>
            </CardHeader>
            <form onSubmit={createEvent}>
              <CardContent className="space-y-4">
                {errorMessage && (
                  <div className="p-3 text-sm border border-red-300 text-red-500 bg-red-50 rounded-md">
                    {errorMessage}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="title">Event Name</Label>
                  <Input
                    id="title"
                    value={newEvent.title || ""}
                    onChange={(e) => handleEventChange("title", e.target.value)}
                    placeholder="E.g. Team Training"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <select
                    id="team"
                    value={newEvent.team || ""}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <option value="">Select a team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {isLoading && (
                    <div className="text-xs text-muted-foreground">Loading teams...</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date || ""}
                      onChange={(e) => handleEventChange("date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Input
                          id="start_time"
                          placeholder="Start time (e.g. 18:00)"
                          value={newEvent.start_time || ""}
                          onChange={(e) => handleEventChange("start_time", e.target.value)}
                        />
                      </div>
                      <div className="flex items-center">
                        <span>-</span>
                      </div>
                      <div className="flex-1">
                        <Input
                          id="end_time"
                          placeholder="End time (e.g. 20:00)"
                          value={newEvent.end_time || ""}
                          onChange={(e) => handleEventChange("end_time", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={newEvent.type || "training"}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="training">Training</option>
                    <option value="match">Match</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="E.g. Football Stadium"
                    value={newEvent.location || ""}
                    onChange={(e) => handleEventChange("location", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add more information about the event"
                    value={newEvent.description || ""}
                    onChange={(e) => handleEventChange("description", e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setShowNewEventForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Create Event"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <div className="grid gap-4">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleCalendar selected={date} onChange={setDate} events={events} />
              </CardContent>
            </Card>

            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-4">
                {formatDate(date)}
              </h2>

              {isLoading ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">Loading events...</p>
                  </CardContent>
                </Card>
              ) : selectedDateEvents.length > 0 ? (
                <div className="grid gap-4">
                  {selectedDateEvents.map((event) => (
                    <Card key={event.id} className="overflow-hidden">
                      <div className={`h-1 ${event.type === "training" ? "bg-primary" : "bg-blue-500"}`} />
                      <CardContent className="p-4">
                        <div className="grid gap-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{event.title}</h3>
                            <div className={`px-2 py-1 rounded-full text-xs ${
                              event.type === "training" 
                                ? "bg-primary/10 text-primary" 
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {event.type === "training" ? "Training" : "Match"}
                            </div>
                          </div>

                          <div className="grid gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{event.team}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{event.start_time} - {event.end_time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          </div>

                          <div className="mt-2">
                            <div className="text-sm">
                              <span className="font-medium">{event.confirmed}</span>
                              <span className="text-muted-foreground">/{event.total} confirmed</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No events scheduled for this day</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
      <nav className="sticky bottom-0 z-10 border-t bg-background">
        <div className="grid grid-cols-4 divide-x">
          <Link
            href={dashboardPath}
            className="flex flex-col items-center justify-center py-3 text-muted-foreground"
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
              className="h-5 w-5"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="mt-1 text-xs">Home</span>
          </Link>
          <Link href={teamsPath} className="flex flex-col items-center justify-center py-3 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span className="mt-1 text-xs">Teams</span>
          </Link>
          <Link href={calendarPath} className="flex flex-col items-center justify-center py-3 text-primary">
            <CalendarIcon className="h-5 w-5" />
            <span className="mt-1 text-xs">Calendar</span>
          </Link>
          <Link href={profilePath} className="flex flex-col items-center justify-center py-3 text-muted-foreground">
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
            <span className="mt-1 text-xs">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
} 