import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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