import { supabase } from '@/lib/supabase'

// Exempel på användning
async function getTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
  
  if (error) {
    console.error('Fel vid hämtning av lag:', error)
    return []
  }
  
  return data
} 