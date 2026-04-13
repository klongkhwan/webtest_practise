import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    // If Authorization header is provided, verify the token
    if (authHeader) {
      const authUser = await getAuthUser(request);
      
      if (!authUser) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      return NextResponse.json({ 
        status: 'ok', 
        authenticated: true,
        user: { id: authUser.id, email: authUser.email }
      });
    }

    // Standard health check without authentication
    return NextResponse.json({ 
      status: 'ok', 
      authenticated: false 
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
