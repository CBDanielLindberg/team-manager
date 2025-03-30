import { Resend } from 'resend'

// IMPORTANT: För lokalutveckling och testning, eftersom du inte får e-post levererad
// Vi kommer att logga e-posten istället och returnera framgång
// I produktion skulle vi konfigurera Resend korrekt med en verifierad domän

// Försök att skapa en Resend-instans om API-nyckeln finns
const resendApiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY || 'dummy_key'
const resend = new Resend(resendApiKey)

/**
 * Kontrollerar om Resend API-nyckeln är giltig och att anslutningen fungerar
 * Returnerar information om konfigurationsstatus
 */
export async function verifyEmailConfig() {
  try {
    console.log('Verifierar Resend-konfiguration')
    console.log('API-nyckel finns:', !!process.env.NEXT_PUBLIC_RESEND_API_KEY)
    console.log('Miljö:', process.env.NODE_ENV)
    
    // Om vi är i utvecklingsmiljö eller saknar API-nyckel, returnera meddelandeinfo
    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.NODE_ENV === 'development') {
      return {
        configured: false,
        message: 'E-post kommer simuleras i utvecklingsmiljö eller eftersom API-nyckel saknas',
        apiKeyConfigured: !!process.env.NEXT_PUBLIC_RESEND_API_KEY,
        environment: process.env.NODE_ENV || 'unknown'
      }
    }
    
    // Testa anslutningen genom att hämta domäner (kräver en giltig API-nyckel)
    const domains = await resend.domains.list()
    
    return {
      configured: true,
      apiKeyConfigured: true,
      environment: process.env.NODE_ENV,
      domains: domains.data
    }
  } catch (error) {
    console.error('Fel vid verifiering av Resend-konfiguration:', error)
    return {
      configured: false,
      error: error instanceof Error ? error.message : 'Okänt fel',
      apiKeyConfigured: !!process.env.NEXT_PUBLIC_RESEND_API_KEY,
      environment: process.env.NODE_ENV || 'unknown'
    }
  }
}

export async function sendEventInvite({
  to,
  eventTitle,
  eventDate,
  teamName,
}: {
  to: string
  eventTitle: string
  eventDate: string
  teamName: string
}) {
  try {
    console.log('====== SKICKAR EVENT INBJUDAN ======')
    console.log(`Till: ${to}`)
    console.log(`Evenemang: ${eventTitle}`)
    console.log(`Datum: ${eventDate}`)
    console.log(`Lag: ${teamName}`)
    console.log(`API-nyckel konfigurerad: ${!!process.env.NEXT_PUBLIC_RESEND_API_KEY}`)
    console.log(`Miljö: ${process.env.NODE_ENV}`)
    console.log('===================================')
    
    // I utvecklingsläge, låtsas att vi skickar e-post
    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.NODE_ENV === 'development') {
      console.log('DEV MODE: E-post skulle ha skickats (simulerad framgång)')
      return { 
        success: true,
        mode: 'development',
        simulatedId: `sim_${Date.now()}`
      }
    }
    
    // I produktionsläge, försök skicka via Resend
    const result = await resend.emails.send({
      from: 'Team Manager <noreply@yourapp.com>',
      to,
      subject: `Invitation: ${eventTitle}`,
      html: `
        <h2>You're invited to ${eventTitle}</h2>
        <p>Team: ${teamName}</p>
        <p>Date: ${eventDate}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/events/respond">Respond to invite</a>
      `
    })
    
    console.log('Resend API response:', result)
    return { 
      success: true,
      mode: 'production',
      // Returnera hela resultatet istället för att använda id-egenskapen direkt
      emailData: result
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { 
      success: false, 
      error,
      mode: process.env.NODE_ENV || 'unknown'
    }
  }
}

export async function sendPlayerInvite({
  to,
  playerName,
  teamName,
}: {
  to: string
  playerName: string
  teamName: string
}) {
  try {
    console.log('====== SKICKAR SPELAR INBJUDAN ======')
    console.log(`Till: ${to}`)
    console.log(`Spelare: ${playerName}`)
    console.log(`Lag: ${teamName}`)
    console.log(`API-nyckel konfigurerad: ${!!process.env.NEXT_PUBLIC_RESEND_API_KEY}`)
    console.log(`Miljö: ${process.env.NODE_ENV}`)
    console.log('=====================================')
    
    // I utvecklingsläge, låtsas att vi skickar e-post
    if (!process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.NODE_ENV === 'development') {
      console.log('DEV MODE: E-post skulle ha skickats (simulerad framgång)')
      return { 
        success: true,
        mode: 'development',
        simulatedId: `sim_${Date.now()}`
      }
    }
    
    // I produktionsläge, försök skicka via Resend
    const result = await resend.emails.send({
      from: 'Team Manager <noreply@yourapp.com>',
      to,
      subject: `You've been added to ${teamName}`,
      html: `
        <h2>Welcome to ${teamName}!</h2>
        <p>Hi ${playerName},</p>
        <p>You have been added as a player to the team "${teamName}" in Team Manager.</p>
        <p>You'll receive notifications about upcoming games, trainings, and other team events.</p>
        <p>If you haven't set up your account yet, you can do so by clicking the link below:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?email=${encodeURIComponent(to)}">Set up your account</a>
      `
    })
    
    console.log('Resend API response:', result)
    return { 
      success: true,
      mode: 'production',
      // Returnera hela resultatet istället för att använda id-egenskapen direkt
      emailData: result
    }
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    return { 
      success: false, 
      error,
      mode: process.env.NODE_ENV || 'unknown'
    }
  }
} 