import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
})

export const bookingSchema = z.object({
  roomId: z.string().cuid('Invalid room ID'),
  checkInDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-in date'),
  checkOutDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid check-out date'),
  guests: z.number().min(1, 'At least 1 guest is required').max(10, 'Maximum 10 guests allowed'),
  notes: z.string().optional(),
}).refine((data) => {
  const checkIn = new Date(data.checkInDate)
  const checkOut = new Date(data.checkOutDate)
  return checkOut > checkIn
}, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOutDate'],
})

export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type BookingInput = z.infer<typeof bookingSchema>
export type ProfileInput = z.infer<typeof profileSchema>