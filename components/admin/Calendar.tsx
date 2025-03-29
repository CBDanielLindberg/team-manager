"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, MapPin, PlusCircle, Users, X } from "lucide-react"

// Sample data
const events = [
  {
    id: "1",
    title: "Team Training",
    team: "FC Barcelona Youth",
    type: "training",
    date: "2025-03-29",
    time: "6:00 PM - 8:00 PM",
    location: "Central Sports Field",
    confirmed: 15,
    total: 18,
  },
  {
    id: "2",
    title: "Friendly Match vs City FC",
    team: "FC Barcelona Youth",
    type: "match",
    date: "2025-03-30",
    time: "3:00 PM - 5:00 PM",
    location: "City Stadium",
    confirmed: 16,
    total: 18,
  },
  {
    id: "3",
    title: "Fitness Training",
    team: "Madrid United",
    type: "training",
    date: "2025-03-29",
    time: "5:30 PM - 7:00 PM",
    location: "Madrid Training Center",
    confirmed: 18,
    total: 22,
  },
]

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Get events for the selected date
  const selectedDateEvents = events.filter((event) => {
    const eventDate = new Date(event.date)
    return (
      date &&
      eventDate.getDate() === date.getDate() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getFullYear() === date.getFullYear()
    )
  })

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Schedule</h1>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            New Event
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarComponent mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
            </CardContent>
          </Card>

          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-4">
              {date
                ? date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                : "No date selected"}
            </h2>

            {selectedDateEvents.length > 0 ? (
              <div className="grid gap-4">
                {selectedDateEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <div className={`h-1 ${event.type === "training" ? "bg-primary" : "bg-secondary"}`} />
                    <CardContent className="p-4">
                      <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{event.title}</h3>
                          <Badge variant={event.type === "training" ? "default" : "secondary"}>
                            {event.type === "training" ? "Training" : "Match"}
                          </Badge>
                        </div>

                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{event.team}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium">{event.confirmed}</span>
                            <span className="text-muted-foreground">/{event.total} confirmed</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-1">
                              <X className="h-4 w-4" />
                              <span>Decline</span>
                            </Button>
                            <Button size="sm" className="gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Attend</span>
                            </Button>
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
      </main>
      <nav className="sticky bottom-0 z-10 border-t bg-background">
        <div className="grid grid-cols-4 divide-x">
          <Link
            href="/admin/dashboard"
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
          <Link href="/admin/teams" className="flex flex-col items-center justify-center py-3 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span className="mt-1 text-xs">Teams</span>
          </Link>
          <Link href="/admin/calendar" className="flex flex-col items-center justify-center py-3 text-primary">
            <CalendarComponent className="h-5 w-5" />
            <span className="mt-1 text-xs">Calendar</span>
          </Link>
          <Link href="/admin/profile" className="flex flex-col items-center justify-center py-3 text-muted-foreground">
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