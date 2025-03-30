import { NextResponse } from 'next/server';
import { verifyEmailConfig } from '@/lib/email';

/**
 * API-rutt för att verifiera e-postkonfiguration
 * GET /api/verify-email
 */
export async function GET() {
  try {
    // Anropa verifieringsfunktionen för att kontrollera e-postkonfigurationen
    const result = await verifyEmailConfig();
    
    console.log('E-postkonfigurationsresultat:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Fel vid verifiering av e-postkonfiguration:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Okänt fel vid verifiering av e-post', 
        configured: false 
      },
      { status: 500 }
    );
  }
} 