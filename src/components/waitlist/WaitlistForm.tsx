// ==========================================
// WAITLIST FORM COMPONENT
// ==========================================
// Form for users to join waitlist when rooms are unavailable

'use client'

import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Calendar, Clock, Users, FileText, DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-shadcn'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

import { joinWaitlist } from '@/actions/waitlist/waitlist.action'
import { 
  JoinWaitlistFormSchema,
  type JoinWaitlistFormInput,
} from '@/lib/validation/waitlist.validation'

interface WaitlistFormProps {
  userId: string
  roomTypeId?: string
  roomTypeName?: string
  startDate: Date
  endDate: Date
  guests: number
  onSuccess?: () => void
  onCancel?: () => void
}

export function WaitlistForm({
  userId,
  roomTypeId,
  roomTypeName,
  startDate,
  endDate,
  guests,
  onSuccess,
  onCancel,
}: WaitlistFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const form = useForm<JoinWaitlistFormInput>({
    resolver: zodResolver(JoinWaitlistFormSchema) as any,
    defaultValues: {
      roomTypeId: roomTypeId || undefined,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      guests: guests.toString(),
      guestType: 'REGULAR',
      deposit: '0',
      notes: '',
    },
  })

  const handleSubmit: SubmitHandler<JoinWaitlistFormInput> = async (data) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const result = await joinWaitlist(userId, data)

      if (result.success) {
        setSubmitSuccess(true)
        form.reset()
        onSuccess?.()
      } else {
        setSubmitError(result.error || 'Failed to join waitlist')
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                You've joined the waitlist!
              </h3>
              <p className="text-gray-600 mt-2">
                We'll notify you as soon as a room becomes available for your dates.
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
                </span>
              </div>
              {roomTypeName && (
                <div className="flex items-center gap-2 text-sm text-blue-800 mt-1">
                  <span>Room Type: {roomTypeName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-blue-800 mt-1">
                <Users className="w-4 h-4" />
                <span>{guests} guests</span>
              </div>
            </div>
            <Button 
              onClick={onCancel} 
              variant="outline" 
              className="w-full"
            >
              Continue Browsing
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Join Waitlist
        </CardTitle>
        <p className="text-gray-600">
          We'll notify you when a room becomes available for your dates
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Booking Details Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Booking Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>
                  {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span>{guests} guests</span>
              </div>
              {roomTypeName && (
                <div className="md:col-span-2">
                  <Badge variant="outline" className="text-blue-600">
                    {roomTypeName}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Guest Type */}
          <div className="space-y-2">
            <Label htmlFor="guestType">Guest Type</Label>
            <Select
              value={form.watch('guestType') || 'REGULAR'}
              onValueChange={(value: string) => 
                form.setValue('guestType', value as 'REGULAR' | 'VIP' | 'CORPORATE')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select guest type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REGULAR">Regular Guest</SelectItem>
                <SelectItem value="VIP">VIP Guest</SelectItem>
                <SelectItem value="CORPORATE">Corporate Guest</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.guestType && (
              <p className="text-sm text-red-600">
                {form.formState.errors.guestType.message}
              </p>
            )}
          </div>

          {/* Deposit */}
          <div className="space-y-2">
            <Label htmlFor="deposit">Security Deposit (Optional)</Label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                id="deposit"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="pl-10"
                {...form.register('deposit', { valueAsNumber: true })}
              />
            </div>
            <p className="text-sm text-gray-500">
              Optional security deposit to prioritize your waitlist position
            </p>
            {form.formState.errors.deposit && (
              <p className="text-sm text-red-600">
                {form.formState.errors.deposit.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Special Requests (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or preferences..."
              rows={3}
              {...form.register('notes')}
            />
            {form.formState.errors.notes && (
              <p className="text-sm text-red-600">
                {form.formState.errors.notes.message}
              </p>
            )}
          </div>

          {/* Error Alert */}
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}