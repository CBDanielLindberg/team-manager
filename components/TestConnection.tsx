'use client'

import { useState, useEffect } from 'react'
import { testConnection } from '@/lib/supabaseAdmin'

export default function TestConnection() {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing')

  useEffect(() => {
    async function checkConnection() {
      const isConnected = await testConnection()
      setStatus(isConnected ? 'success' : 'error')
    }
    
    checkConnection()
  }, [])

  return (
    <div className="p-4">
      <h2>Supabase Anslutningsstatus:</h2>
      {status === 'testing' && <p>Testar anslutning...</p>}
      {status === 'success' && <p className="text-green-500">Anslutningen lyckades!</p>}
      {status === 'error' && <p className="text-red-500">Anslutningen misslyckades</p>}
    </div>
  )
} 