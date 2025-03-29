import { supabase } from './supabase'

export async function testConnection() {
  try {
    const { data, error } = await supabase.from('teams').select('count').single()
    
    if (error) {
      console.error('Anslutningsfel:', error.message)
      return false
    }
    
    console.log('Supabase-anslutning lyckades!')
    return true
  } catch (error) {
    console.error('Oväntat fel:', error)
    return false
  }
} 