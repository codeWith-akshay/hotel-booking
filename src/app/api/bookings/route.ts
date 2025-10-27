// ==========================================
// BOOKINGS API ROUTE
// ==========================================
// Create new bookings

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/middleware/auth.utils'
import { verifyAccessToken } from '@/lib/auth/jwt.service'
import type { RoleName } from '@prisma/client'

// ==========================================
// POST - CREATE BOOKING
// ==========================================

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Booking API: Request received')
    console.log('🔍 Cookies:', request.cookies.getAll())
    console.log('🔍 Headers:', {
      'x-user-id': request.headers.get('x-user-id'),
      'x-user-phone': request.headers.get('x-user-phone'),
      'x-user-name': request.headers.get('x-user-name'),
      'x-user-role': request.headers.get('x-user-role'),
    })
    
    // Try to get user from middleware headers first
    let user = await getCurrentUser()
    
    console.log('🔍 getCurrentUser result:', user)
    
    // If middleware didn't set headers, try to verify token directly
    if (!user) {
      console.log('⚠️  Middleware headers not found, trying direct token verification')
      const cookieStore = await cookies()
      const token = cookieStore.get('auth-session')?.value
      
      if (token) {
        console.log('🔍 Found auth-session cookie, verifying...')
        const decoded = verifyAccessToken(token)
        
        if (decoded && decoded.role) {
          console.log('✅ Token verified directly:', decoded)
          user = {
            userId: decoded.userId,
            phone: decoded.phone,
            name: decoded.name,
            role: decoded.role as RoleName,
          }
        }
      }
    }
    
    if (!user) {
      console.log('❌ No user found - returning 401')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('✅ User authenticated:', user.userId)

    // Parse request body
    const body = await request.json()
    const {
      startDate,
      endDate,
      roomTypeId,
      numberOfRooms,
      adults,
      children,
      guestType,
      firstName,
      lastName,
      email,
      phone,
      specialRequests,
    } = body

    // Validate required fields
    if (!startDate || !endDate || !roomTypeId || !numberOfRooms) {
      console.log('❌ Missing required fields:', {
        hasStartDate: !!startDate,
        hasEndDate: !!endDate,
        hasRoomTypeId: !!roomTypeId,
        hasNumberOfRooms: !!numberOfRooms,
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('📋 Booking request data:', {
      startDate,
      endDate,
      roomTypeId,
      numberOfRooms,
      adults,
      children,
      guestType,
    })

    // Calculate nights
    const checkIn = new Date(startDate)
    const checkOut = new Date(endDate)
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Get room type for pricing
    console.log('🔍 Looking for room type with ID:', roomTypeId)
    
    // First, let's see what room types exist
    const allRoomTypes = await prisma.roomType.findMany({
      select: { id: true, name: true }
    })
    console.log('📦 Available room types in database:', allRoomTypes)
    
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
    })

    if (!roomType) {
      console.log('❌ Room type not found! Requested ID:', roomTypeId)
      console.log('💡 Hint: Check if you selected a room in the booking flow')
      return NextResponse.json(
        { 
          error: 'Room type not found',
          details: `Room type with ID "${roomTypeId}" does not exist in the database`,
          availableRoomTypes: allRoomTypes,
        },
        { status: 404 }
      )
    }

    console.log('✅ Room type found:', { id: roomType.id, name: roomType.name, price: roomType.pricePerNight })

    // Calculate total price
    const basePrice = roomType.pricePerNight * numberOfRooms * nights
    const totalPrice = basePrice // Add any additional fees/taxes here

    // Log guest information for tracking (since schema doesn't support these fields yet)
    console.log('📝 Booking details:', {
      user: user.userId,
      contact: { firstName, lastName, email, phone },
      guests: { adults, children, guestType },
      specialRequests,
    })

    // Create booking with available fields
    // Note: Contact info (firstName, lastName, email, phone) and guest details 
    // are stored in the User model, not in Booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.userId,
        roomTypeId,
        startDate: checkIn,
        endDate: checkOut,
        roomsBooked: numberOfRooms, // Using roomsBooked field from schema
        status: 'PROVISIONAL', // Initial status before payment
        totalPrice,
        // Note: specialRequests, adults, children, guestType are not in the Booking schema
        // They would need to be added to the schema or stored in a separate table
      },
    })

    console.log('✅ Booking created:', {
      bookingId: booking.id,
      totalPrice: booking.totalPrice,
      status: booking.status,
    })

    return NextResponse.json(
      {
        success: true,
        booking: {
          bookingId: booking.id,
          totalPrice: booking.totalPrice,
          status: booking.status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Booking creation error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create booking',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    )
  }
}

// ==========================================
// GET - LIST BOOKINGS (Optional)
// ==========================================

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's bookings
    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        roomType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      bookings,
    })
  } catch (error) {
    console.error('Fetch bookings error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
