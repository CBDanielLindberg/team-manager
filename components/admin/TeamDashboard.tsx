"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, PlusCircle, Users } from "lucide-react"

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

export default function TeamDashboard() {
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
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Teams</h2>
            <Link href="/admin/teams/create">
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Create Team
              </Button>
            </Link>
          </div>
          <div className="grid gap-4">
            {teams.map((team) => (
              <Link key={team.id} href={`/admin/teams/${team.id}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">{team.members} members</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">This Week</CardTitle>
                <CardDescription>Your scheduled events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center gap-4 rounded-lg border p-3">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                        <CalendarIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium leading-none">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.team} • {event.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-medium">
                          {event.confirmed}/{event.total}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <nav className="sticky bottom-0 z-10 border-t bg-background">
        <div className="grid grid-cols-4 divide-x">
          <Link href="/admin/dashboard" className="flex flex-col items-center justify-center py-3 text-primary">
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
          <Link href="/admin/calendar" className="flex flex-col items-center justify-center py-3 text-muted-foreground">
            <CalendarIcon className="h-5 w-5" />
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