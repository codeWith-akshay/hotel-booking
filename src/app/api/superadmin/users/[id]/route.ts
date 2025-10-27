// ==========================================
// USER MANAGEMENT API
// ==========================================
// SuperAdmin can get, update, and delete users

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware/auth.utils'
import { prisma } from '@/lib/prisma'

// GET single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: userId } = await params

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// UPDATE user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: userId } = await params
    const body = await request.json()
    const { name, email, phone, role } = body

    // Validate required fields
    if (!name || !email || !phone || !role) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['MEMBER', 'ADMIN', 'SUPERADMIN'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if phone number is being changed and if it's already in use
    if (phone !== existingUser.phone) {
      const phoneExists = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: userId },
        },
      })

      if (phoneExists) {
        return NextResponse.json(
          { success: false, message: 'Phone number already in use' },
          { status: 400 }
        )
      }
    }

    // Check if email is being changed and if it's already in use
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId },
        },
      })

      if (emailExists) {
        return NextResponse.json(
          { success: false, message: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Check if user is SuperAdmin
    if (currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. SuperAdmin only.' },
        { status: 403 }
      )
    }

    // 3. Get user ID from params
    const { id: userId } = await params

    // 4. Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })

    if (!userToDelete) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // 5. Prevent deleting yourself
    if (userId === currentUser.userId) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // 6. Delete related records first (due to foreign key constraints)
    // Delete OTPs
    await prisma.oTP.deleteMany({
      where: { userId },
    })

    // Delete OTP attempts
    await prisma.otpAttempt.deleteMany({
      where: { phone: userToDelete.phone },
    })

    // Delete notifications
    await prisma.notification.deleteMany({
      where: { userId },
    })

    // Delete bookings associated with the user
    await prisma.booking.deleteMany({
      where: { userId },
    })

    // Delete audit logs created by this admin user
    await prisma.bookingAuditLog.deleteMany({
      where: { adminId: userId },
    })

    // 7. Delete the user
    await prisma.user.delete({
      where: { id: userId },
    })

    // 8. Return success response
    return NextResponse.json({
      success: true,
      message: `User ${userToDelete.name} deleted successfully`,
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete user',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
