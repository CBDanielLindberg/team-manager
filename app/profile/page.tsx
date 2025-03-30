'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ChevronLeft, User, Mail, Phone, Save } from 'lucide-react'

// Rollalternativ för användare
const ROLE_OPTIONS = [
  { value: 'coach', label: 'Tränare' },
  { value: 'player', label: 'Spelare' },
  { value: 'admin', label: 'Administratör' },
  { value: 'parent', label: 'Förälder' }
]

type UserProfile = {
  id: string
  email: string
  name: string
  phone: string
  role: string
  avatar_url?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    name: '',
    phone: '',
    role: 'player', // Standard roll
    avatar_url: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    // Hämta användarens information när sidan laddas
    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        // Hämta användarens session
        const { data: sessionData } = await supabase.auth.getSession()
        
        if (!sessionData.session) {
          router.push('/login')
          return
        }

        const user = sessionData.session.user
        
        // Börja med att sätta e-post från auth
        setProfile(prev => ({
          ...prev,
          id: user.id,
          email: user.email || ''
        }))

        // Försök hämta mer information från profiles-tabellen om den finns
        // Detta kommer antagligen fallera första gången eftersom vi inte har en profiles-tabell än,
        // men vi hanterar det genom att fånga felet och fortsätta
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            // Visa inte fel om vi bara inte hittade profilen
            console.error('Fel vid hämtning av profildata:', profileError)
          }

          // Om vi hittade profildata, använd den
          if (profileData) {
            setProfile(prev => ({
              ...prev,
              name: profileData.name || prev.name,
              phone: profileData.phone || prev.phone,
              role: profileData.role || prev.role,
              avatar_url: profileData.avatar_url || prev.avatar_url
            }))
          }
        } catch (err) {
          // Ignorera fel från profiltabellen, vi fortsätter ändå
          console.log('Profiltabell existerar troligtvis inte än')
        }

        // Försök hämta användarens spelarinformation om den finns
        try {
          const { data: playerData, error: playerError } = await supabase
            .from('players')
            .select('name, phone')
            .eq('email', user.email)
            .single()

          if (playerError && playerError.code !== 'PGRST116') {
            console.error('Fel vid hämtning av spelardata:', playerError)
          }

          // Om vi hittade spelardata och saknar namn/telefon, använd den
          if (playerData) {
            setProfile(prev => ({
              ...prev,
              name: prev.name || playerData.name || '',
              phone: prev.phone || playerData.phone || ''
            }))
          }
        } catch (err) {
          // Ignorera fel från spelartabellen
          console.log('Kunde inte hämta spelardata')
        }

      } catch (error) {
        console.error('Fel vid hämtning av användardata:', error)
        setError('Kunde inte hämta användarinformation')
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [router])

  // Hantera formulärändringar
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  // Skicka formuläret
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      // Se till att vi har användar-ID
      if (!profile.id) {
        throw new Error('Användar-ID saknas')
      }

      // Skapa profiles-tabellen om den inte finns
      // I en verklig app skulle detta göras i en migrations-script,
      // men för denna demo skapar vi tabellen on-the-fly
      try {
        await supabase.rpc('create_profiles_if_not_exists')
      } catch (err) {
        console.log('Kan inte köra RPC, försöker skapa tabellen direkt')
        
        // Detta är en fallback om RPC inte fungerar
        // I en riktig app skulle detta hanteras bättre
        try {
          // Använd raw query istället för query-metoden
          await supabase.from('profiles').select('id').limit(1)
          console.log('Profiltabellen verkar existera')
        } catch (tableError) {
          console.error('Kunde inte verifiera om profiltabellen finns:', tableError)
          // Fortsätt ändå, vi antar att tabellen finns eller 
          // att Supabase kommer hantera felet vid upsert
        }
      }

      // Uppdatera eller skapa profil
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          name: profile.name,
          phone: profile.phone,
          role: profile.role,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (upsertError) throw upsertError

      setSuccessMessage('Profilinformation sparad!')
      
      // Visa framgångsmeddelandet i 3 sekunder
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)

    } catch (error) {
      console.error('Fel vid uppdatering av profil:', error)
      setError('Kunde inte spara profilinformation')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Laddar profil...</p>
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
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Min profil</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 container max-w-2xl mx-auto">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personlig information</CardTitle>
              <CardDescription>
                Uppdatera din profilinformation och inställningar här
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}
                
                {successMessage && (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="text-sm text-green-700">{successMessage}</div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-postadress</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email"
                      name="email"
                      value={profile.email}
                      className="pl-10"
                      readOnly
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    E-postadressen kan inte ändras direkt. Kontakta support för att uppdatera.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Namn</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name"
                      name="name"
                      value={profile.name}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="Ditt namn"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefonnummer</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="Ditt telefonnummer"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Roll</Label>
                  <select
                    id="role"
                    name="role"
                    value={profile.role}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Din primära roll avgör hur applikationen anpassas för dig
                  </p>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={saving}
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Sparar...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      <span>Spara ändringar</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <p className="text-xs text-muted-foreground">
                Din profilinformation hjälper lag och administratörer att kommunicera med dig
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <footer className="border-t py-6">
        <div className="container max-w-2xl mx-auto px-4">
          <nav className="flex">
            <Button variant="link" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="link" onClick={() => router.push('/events')}>
              Mina evenemang
            </Button>
          </nav>
        </div>
      </footer>
    </div>
  )
} 