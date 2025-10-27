// ==========================================
// CREATE ADMIN USER API
// ==========================================
// SuperAdmin can create new admin users

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware/auth.utils'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is SUPERADMIN
    if (currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. SUPERADMIN role required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, phone, role } = body

    // Validate required fields
    if (!name || !email || !phone || !role) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate role (only ADMIN or SUPERADMIN can be created)
    if (!['ADMIN', 'SUPERADMIN'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role. Only ADMIN or SUPERADMIN allowed.' },
        { status: 400 }
      )
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format. Include country code.' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    })

    if (existingPhone) {
      return NextResponse.json(
        { success: false, message: 'Phone number already registered' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findFirst({
      where: { email },
    })

    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      )
    }

    // Get role ID
    const roleRecord = await prisma.role.findUnique({
      where: { name: role },
    })

    if (!roleRecord) {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      )
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        roleId: roleRecord.id,
        profileCompleted: true, // Admin users are considered complete
        termsAccepted: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: {
          select: {
            name: true,
          },
        },
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        ...newUser,
        role: newUser.role.name,
      },
    })
  } catch (error) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create admin user' },
      { status: 500 }
    )
  }
}
