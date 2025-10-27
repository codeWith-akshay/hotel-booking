// ==========================================
// GUEST INFO STEP - Guest Details Form
// ==========================================
// Allows users to specify guest type, adults, and children

'use client'

import { useState } from 'react'
import { Users, UserCheck, Crown, Building2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useGuestInfo } from '@/store/bookingUIStore'
import type { GuestType } from '@prisma/client'
import { cn } from '@/lib/utils'

// ==========================================
// GUEST TYPE METADATA
// ==========================================

const guestTypeOptions = [
  {
    value: 'REGULAR' as GuestType,
    label: 'Regular Guest',
    icon: Users,
    description: 'Standard booking terms',
    badge: 'Most Popular',
    badgeColor: 'bg-blue-100 text-blue-800',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    value: 'VIP' as GuestType,
    label: 'VIP Guest',
    icon: Crown,
    description: 'Extended advance booking (365 days)',
    badge: 'Premium',
    badgeColor: 'bg-purple-100 text-purple-800',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    value: 'CORPORATE' as GuestType,
    label: 'Corporate Guest',
    icon: Building2,
    description: 'Business traveler (180 days advance)',
    badge: 'Business',
    badgeColor: 'bg-green-100 text-green-800',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
]

// ==========================================
// GUEST INFO STEP COMPONENT
// ==========================================

export function GuestInfoStep() {
  const { guestType, adults, children, totalGuests, setGuestInfo, isValid } = useGuestInfo()
  
  // Local state for form inputs
  const [localAdults, setLocalAdults] = useState(adults)
  const [localChildren, setLocalChildren] = useState(children)
  const [localGuestType, setLocalGuestType] = useState(guestType)

  // ==========================================
  // FORM HANDLERS
  // ==========================================

  const handleGuestTypeSelect = (selectedType: GuestType) => {
    setLocalGuestType(selectedType)
    setGuestInfo(selectedType, localAdults, localChildren)
  }

  const handleAdultsChange = (value: number) => {
    const newAdults = Math.max(1, Math.min(10, value))
    setLocalAdults(newAdults)
    setGuestInfo(localGuestType, newAdults, localChildren)
  }

  const handleChildrenChange = (value: number) => {
    const newChildren = Math.max(0, Math.min(8, value))
    setLocalChildren(newChildren)
    setGuestInfo(localGuestType, localAdults, newChildren)
  }

  // ==========================================
  // GUEST COUNT CONTROLS
  // ==========================================

  const GuestCounter = ({ 
    label, 
    value, 
    onChange, 
    min = 0, 
    max = 10, 
    description 
  }: {
    label: string
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    description?: string
  }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <Label className="font-medium">{label}</Label>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          className="h-8 w-8 p-0"
        >
          -
        </Button>
        <span className="w-8 text-center font-medium">{value}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          className="h-8 w-8 p-0"
        >
          +
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      
      {/* ==========================================
          STEP HEADER
          ========================================== */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Tell us about your party
        </h2>
        <p className="text-gray-600">
          Select your guest type and party size to see personalized pricing and availability.
        </p>
      </div>

      {/* ==========================================
          GUEST TYPE SELECTION
          ========================================== */}
      <div>
        <Label className="text-lg font-semibold mb-4 block">Guest Type</Label>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {guestTypeOptions.map((option) => {
            const IconComponent = option.icon
            const isSelected = localGuestType === option.value
            
            return (
              <Card
                key={option.value}
                className={cn(
                  'relative p-6 cursor-pointer transition-all duration-200 hover:shadow-md',
                  'border-2',
                  isSelected
                    ? `${option.borderColor} ${option.bgColor} ring-2 ring-offset-2 ring-blue-500`
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => handleGuestTypeSelect(option.value)}
              >
                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    option.badgeColor
                  )}>
                    {option.badge}
                  </span>
                </div>
                
                {/* Icon */}
                <div className="mb-4">
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center',
                    isSelected ? option.bgColor : 'bg-gray-100'
                  )}>
                    <IconComponent className={cn(
                      'h-6 w-6',
                      isSelected ? option.iconColor : 'text-gray-500'
                    )} />
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="font-semibold text-gray-900 mb-2">
                  {option.label}
                </h3>
                <p className="text-sm text-gray-600">
                  {option.description}
                </p>
                
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 left-4">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* ==========================================
          GUEST COUNT SELECTION
          ========================================== */}
      <div>
        <Label className="text-lg font-semibold mb-4 block">Party Size</Label>
        
        <div className="space-y-4">
          <GuestCounter
            label="Adults"
            value={localAdults}
            onChange={handleAdultsChange}
            min={1}
            max={10}
            description="Age 18 and above"
          />
          
          <GuestCounter
            label="Children"
            value={localChildren}
            onChange={handleChildrenChange}
            min={0}
            max={8}
            description="Age 0-17 (free breakfast included)"
          />
        </div>
      </div>

      {/* ==========================================
          SUMMARY CARD
          ========================================== */}
      <Card className="p-6 bg-gray-50 border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Party Summary</h3>
            <p className="text-sm text-gray-600">
              {localAdults + localChildren} total guest{localAdults + localChildren !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <span className="text-xl font-bold text-gray-900">
                {localAdults} + {localChildren}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {guestTypeOptions.find(opt => opt.value === localGuestType)?.label}
            </p>
          </div>
        </div>
      </Card>

      {/* ==========================================
          GUEST TYPE BENEFITS
          ========================================== */}
      {localGuestType && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Benefits</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localGuestType === 'REGULAR' && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Standard Booking</p>
                    <p className="text-sm text-gray-600">Book up to 90 days in advance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Free WiFi</p>
                    <p className="text-sm text-gray-600">Complimentary high-speed internet</p>
                  </div>
                </div>
              </>
            )}
            
            {localGuestType === 'VIP' && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Extended Booking</p>
                    <p className="text-sm text-gray-600">Book up to 365 days in advance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Premium Amenities</p>
                    <p className="text-sm text-gray-600">Complimentary room upgrade & late checkout</p>
                  </div>
                </div>
              </>
            )}
            
            {localGuestType === 'CORPORATE' && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Business Booking</p>
                    <p className="text-sm text-gray-600">Book up to 180 days in advance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Business Center</p>
                    <p className="text-sm text-gray-600">24/7 access to meeting rooms & facilities</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* ==========================================
          VALIDATION MESSAGE
          ========================================== */}
      {!isValid && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <p className="text-sm text-amber-800">
              Please ensure you have at least 1 adult guest to continue.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}