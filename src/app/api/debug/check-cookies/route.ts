import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Get all cookies
    const allCookies = cookieStore.getAll()
    
    // Get specific auth cookies
    const authSession = cookieStore.get('auth-session')
    const refreshToken = cookieStore.get('refresh-token')
    
    // Get cookies from request headers too
    const cookieHeader = request.headers.get('cookie')
    
    return NextResponse.json({
      message: 'Cookie diagnostic endpoint',
      cookiesFromStore: {
        all: allCookies,
        authSession: authSession ? { 
          name: authSession.name, 
          hasValue: !!authSession.value,
          valueLength: authSession.value?.length || 0
        } : null,
        refreshToken: refreshToken ? {
          name: refreshToken.name,
          hasValue: !!refreshToken.value,
          valueLength: refreshToken.value?.length || 0
        } : null,
      },
      cookieHeader: cookieHeader ? 'Present' : 'Missing',
      cookieHeaderValue: cookieHeader || 'No cookie header',
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to read cookies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
