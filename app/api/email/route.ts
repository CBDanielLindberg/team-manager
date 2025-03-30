import { NextRequest, NextResponse } from 'next/server'
import { sendPlayerInvite, sendEventInvite } from '@/lib/email'

// Handle POST requests to /api/email
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json()
    
    // Check what type of email we need to send
    const { type, data } = body
    
    console.log('Email API called with type:', type)
    console.log('Email data:', data)
    
    if (!type || !data) {
      console.error('Missing required fields: type or data')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let result

    // För utvecklingsmiljö, simulera e-postleverans
    if (process.env.NODE_ENV !== 'production') {
      console.log('DEV MODE: Simulerar e-postleverans till', data.to)
      
      // Vänta en kort stund för att simulera API-anrop
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      result = {
        id: 'dev-mode-email-id-' + Date.now(),
        from: 'dev@footballteammanager.app',
        to: data.to,
        subject: type === 'player-invite' ? 'Player Invitation' : 'Event Invitation',
        status: 'simulated',
      }
      
      console.log('DEV MODE: Simulerad e-post levererad', result)
    } else {
      // För produktion, skicka riktiga e-postmeddelanden
      if (type === 'player-invite') {
        const { to, playerName, teamName } = data
        result = await sendPlayerInvite({
          to,
          playerName,
          teamName
        })
      } else if (type === 'event-invite') {
        const { to, eventTitle, eventDate, teamName } = data
        result = await sendEventInvite({
          to,
          eventTitle,
          eventDate,
          teamName
        })
      } else {
        console.error('Invalid email type:', type)
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
      }
    }

    console.log('Email sending result:', result)
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Error in email API route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
} 