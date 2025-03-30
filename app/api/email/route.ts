import { NextRequest, NextResponse } from 'next/server'
import { sendPlayerInvite } from '@/lib/email'

// Handle POST requests to /api/email
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json()
    
    // Check what type of email we need to send
    const { type, data } = body
    
    if (type === 'player-invite') {
      // Validate required fields
      const { to, playerName, teamName } = data
      
      if (!to || !playerName || !teamName) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }
      
      // Send player invitation email
      const result = await sendPlayerInvite({
        to,
        playerName,
        teamName
      })
      
      if (result.success) {
        return NextResponse.json({ success: true })
      } else {
        console.error('Error sending player invite:', result.error)
        return NextResponse.json(
          { error: 'Failed to send invitation email' },
          { status: 500 }
        )
      }
    }
    
    // Unsupported email type
    return NextResponse.json(
      { error: 'Unsupported email type' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Error in email API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 