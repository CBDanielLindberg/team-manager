import { Resend } from 'resend'

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

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
    await resend.emails.send({
      from: 'Team Manager <noreply@yourapp.com>',
      to,
      subject: `Invitation: ${eventTitle}`,
      html: `
        <h2>You're invited to ${eventTitle}</h2>
        <p>Team: ${teamName}</p>
        <p>Date: ${eventDate}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/respond">Respond to invite</a>
      `
    })
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
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
    await resend.emails.send({
      from: 'Team Manager <noreply@yourapp.com>',
      to,
      subject: `You've been added to ${teamName}`,
      html: `
        <h2>Welcome to ${teamName}!</h2>
        <p>Hi ${playerName},</p>
        <p>You have been added as a player to the team "${teamName}" in Team Manager.</p>
        <p>You'll receive notifications about upcoming games, trainings, and other team events.</p>
        <p>If you haven't set up your account yet, you can do so by clicking the link below:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/register?email=${encodeURIComponent(to)}">Set up your account</a>
      `
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    return { success: false, error }
  }
} 