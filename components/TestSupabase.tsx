'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestSupabase() {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function testConnection() {
      try {
        // Testa anslutning genom att försöka hämta antalet teams
        const { data, error } = await supabase
          .from('teams')
          .select('count')
          .single()

        if (error) {
          throw error
        }

        setStatus('success')
        setMessage('Anslutningen till Supabase lyckades!')
      } catch (error) {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Ett fel uppstod vid anslutning till Supabase')
      }
    }

    testConnection()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Anslutningstest</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-${status === 'success' ? 'green' : status === 'error' ? 'red' : 'blue'}-500`}>
          {status === 'testing' ? 'Testar anslutning...' : message}
        </div>
      </CardContent>
    </Card>
  )
} 