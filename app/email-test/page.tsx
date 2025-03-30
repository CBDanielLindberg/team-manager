'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type ConfigStatus = {
  configured: boolean
  apiKeyConfigured?: boolean
  environment?: string
  message?: string
  error?: string
  domains?: any[]
}

type EmailResult = {
  success: boolean
  error?: any
  mode?: string
  simulatedId?: string
  emailData?: any
}

export default function EmailTestPage() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailResult, setEmailResult] = useState<EmailResult | null>(null)
  const [activeTab, setActiveTab] = useState<'player' | 'event'>('player')
  
  // För spelarinbjudan
  const [playerName, setPlayerName] = useState('')
  const [playerEmail, setPlayerEmail] = useState('')
  const [teamName, setTeamName] = useState('Testlaget')
  
  // För eventinbjudan
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventEmail, setEventEmail] = useState('')

  // Hämta e-postkonfigurationsstatus när sidan laddas
  useEffect(() => {
    checkEmailConfig()
  }, [])

  // Funktion för att kontrollera e-postkonfigurationen
  async function checkEmailConfig() {
    try {
      setConfigLoading(true)
      const response = await fetch('/api/verify-email')
      const data = await response.json()
      setConfigStatus(data)
    } catch (error) {
      console.error('Fel vid verifiering av e-postkonfiguration:', error)
      setConfigStatus({
        configured: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      })
    } finally {
      setConfigLoading(false)
    }
  }

  // Funktion för att skicka spelarinbjudan
  async function sendPlayerInvitation() {
    if (!playerName || !playerEmail) return
    
    try {
      setEmailLoading(true)
      setEmailResult(null)
      
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'player-invite',
          data: {
            to: playerEmail,
            playerName,
            teamName
          }
        })
      })
      
      const data = await response.json()
      setEmailResult(data.result)
    } catch (error) {
      console.error('Fel vid sändning av spelarinbjudan:', error)
      setEmailResult({
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel vid sändning'
      })
    } finally {
      setEmailLoading(false)
    }
  }
  
  // Funktion för att skicka eventinbjudan
  async function sendEventInvitation() {
    if (!eventTitle || !eventDate || !eventEmail) return
    
    try {
      setEmailLoading(true)
      setEmailResult(null)
      
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event-invite',
          data: {
            to: eventEmail,
            eventTitle,
            eventDate,
            teamName
          }
        })
      })
      
      const data = await response.json()
      setEmailResult(data.result)
    } catch (error) {
      console.error('Fel vid sändning av eventinbjudan:', error)
      setEmailResult({
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel vid sändning'
      })
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">E-post Testverktyg</h1>
      
      <div className="grid gap-8">
        {/* E-postkonfigurationskort */}
        <Card>
          <CardHeader>
            <CardTitle>E-postkonfiguration</CardTitle>
            <CardDescription>
              Verifiera att din e-postkonfiguration är korrekt för att skicka meddelanden
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {configLoading ? (
              <div className="text-center py-4">Kontrollerar konfiguration...</div>
            ) : configStatus ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${configStatus.configured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className="font-medium">Status: {configStatus.configured ? 'Konfigurerad' : 'Ej konfigurerad'}</div>
                </div>
                
                {configStatus.message && (
                  <div className="text-amber-600 text-sm">{configStatus.message}</div>
                )}
                
                {configStatus.error && (
                  <div className="text-red-500 text-sm">Fel: {configStatus.error}</div>
                )}
                
                <div className="text-sm text-gray-500">
                  <div>Miljö: {configStatus.environment}</div>
                  <div>API-nyckel: {configStatus.apiKeyConfigured ? 'Konfigurerad' : 'Saknas'}</div>
                  
                  {configStatus.domains && (
                    <div className="mt-2">
                      <div>Verifierade domäner:</div>
                      {configStatus.domains.length === 0 ? (
                        <div className="text-amber-600">Inga verifierade domäner</div>
                      ) : (
                        <ul className="list-disc list-inside">
                          {configStatus.domains.map((domain, i) => (
                            <li key={i}>{domain.name} ({domain.status})</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-red-500">Kunde inte hämta konfigurationsstatus</div>
            )}
          </CardContent>
          
          <CardFooter>
            <Button onClick={checkEmailConfig} disabled={configLoading}>
              {configLoading ? 'Kontrollerar...' : 'Kontrollera igen'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* E-posttestformulär */}
        <Card>
          <CardHeader>
            <CardTitle>Testa e-postutskick</CardTitle>
            <CardDescription>
              Skicka testmeddelanden för att verifiera att e-post fungerar korrekt
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="mb-4 flex border-b">
              <button 
                className={`px-4 py-2 ${activeTab === 'player' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
                onClick={() => setActiveTab('player')}
              >
                Spelarinbjudan
              </button>
              <button 
                className={`px-4 py-2 ${activeTab === 'event' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
                onClick={() => setActiveTab('event')}
              >
                Eventinbjudan
              </button>
            </div>
            
            {activeTab === 'player' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playerName">Spelarens namn</Label>
                  <Input 
                    id="playerName" 
                    value={playerName} 
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Ange spelarens namn" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="playerEmail">E-postadress</Label>
                  <Input 
                    id="playerEmail" 
                    type="email"
                    value={playerEmail} 
                    onChange={(e) => setPlayerEmail(e.target.value)}
                    placeholder="Ange e-postadress" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="playerTeamName">Lagnamn</Label>
                  <Input 
                    id="playerTeamName" 
                    value={teamName} 
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Ange lagnamn" 
                  />
                </div>
                
                <Button onClick={sendPlayerInvitation} disabled={emailLoading || !playerName || !playerEmail}>
                  {emailLoading ? 'Skickar...' : 'Skicka spelarinbjudan'}
                </Button>
              </div>
            )}
            
            {activeTab === 'event' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventTitle">Eventstitel</Label>
                  <Input 
                    id="eventTitle" 
                    value={eventTitle} 
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Ange eventstitel" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Datum</Label>
                  <Input 
                    id="eventDate" 
                    value={eventDate} 
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="t.ex. 2023-04-15 18:00" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="eventEmail">E-postadress</Label>
                  <Input 
                    id="eventEmail" 
                    type="email"
                    value={eventEmail} 
                    onChange={(e) => setEventEmail(e.target.value)}
                    placeholder="Ange e-postadress" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="eventTeamName">Lagnamn</Label>
                  <Input 
                    id="eventTeamName" 
                    value={teamName} 
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Ange lagnamn" 
                  />
                </div>
                
                <Button onClick={sendEventInvitation} disabled={emailLoading || !eventTitle || !eventDate || !eventEmail}>
                  {emailLoading ? 'Skickar...' : 'Skicka eventinbjudan'}
                </Button>
              </div>
            )}
            
            {emailResult && (
              <div className="mt-6 p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Resultat av e-postutskick</h3>
                
                {emailResult.success ? (
                  <div className="text-green-600">
                    E-postutskick lyckades!
                    {emailResult.mode === 'development' && (
                      <div className="text-amber-600 text-sm mt-1">
                        Notera: I utvecklingsläge simuleras e-postutskick. Ingen faktisk e-post skickades.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-500">
                    E-postutskick misslyckades: {emailResult.error?.message || 'Okänt fel'}
                  </div>
                )}
                
                <div className="mt-4 text-xs text-gray-500">
                  <pre className="overflow-auto p-2 bg-gray-100 rounded">
                    {JSON.stringify(emailResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 