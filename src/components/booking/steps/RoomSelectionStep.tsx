// ==========================================
// ROOM SELECTION STEP - Room Type Selection
// ==========================================
// Displays available rooms and allows quantity selection

'use client'

import { useState, useEffect } from 'react'
import { Bed, Users, Wifi, Car, Coffee, Tv, Plus, Minus, Star, Clock, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useRoomSelection, useDateSelection, useGuestInfo } from '@/store/bookingUIStore'
import { WaitlistForm } from '@/components/waitlist'
import type { RoomTypeWithAvailability } from '@/store/bookingUIStore'
import { cn } from '@/lib/utils'

// ==========================================
// MOCK ROOM DATA
// ==========================================
// TODO: Replace with actual API call

const mockRoomTypes: RoomTypeWithAvailability[] = [
  {
    id: 'room-1',
    name: 'Standard Room',
    description: 'Comfortable room with essential amenities for a pleasant stay.',
    pricePerNight: 120,
    totalRooms: 10,
    availableRooms: 7,
    imageUrl: '/images/rooms/standard.jpg',
    amenities: ['Free WiFi', 'Air Conditioning', 'TV', 'Mini Fridge'],
  },
  {
    id: 'room-2',
    name: 'Deluxe Room',
    description: 'Spacious room with premium amenities and city view.',
    pricePerNight: 180,
    totalRooms: 8,
    availableRooms: 2, // Low availability
    imageUrl: '/images/rooms/deluxe.jpg',
    amenities: ['Free WiFi', 'City View', 'Premium TV', 'Coffee Maker', 'Balcony'],
  },
  {
    id: 'room-3',
    name: 'Executive Suite',
    description: 'Luxurious suite with separate living area and executive amenities.',
    pricePerNight: 280,
    totalRooms: 4,
    availableRooms: 0, // Fully booked - show waitlist
    imageUrl: '/images/rooms/suite.jpg',
    amenities: ['Free WiFi', 'Separate Living Area', 'Premium TV', 'Coffee Maker', 'City View', 'Executive Lounge Access'],
  },
  {
    id: 'room-4',
    name: 'Presidential Suite',
    description: 'Ultimate luxury with panoramic views and exclusive services.',
    pricePerNight: 450,
    totalRooms: 2,
    availableRooms: 1,
    imageUrl: '/images/rooms/presidential.jpg',
    amenities: ['Free WiFi', 'Panoramic View', 'Premium TV', 'Full Kitchen', 'Butler Service', 'Private Balcony'],
  },
]

// ==========================================
// AMENITY ICONS
// ==========================================

const amenityIcons: Record<string, any> = {
  'Free WiFi': Wifi,
  'Air Conditioning': Coffee, // Using Coffee as placeholder
  'TV': Tv,
  'Premium TV': Tv,
  'Mini Fridge': Coffee,
  'Coffee Maker': Coffee,
  'City View': Star,
  'Balcony': Star,
  'Separate Living Area': Users,
  'Executive Lounge Access': Star,
  'Panoramic View': Star,
  'Full Kitchen': Coffee,
  'Butler Service': Users,
  'Private Balcony': Star,
  'Parking': Car,
}

// ==========================================
// WAITLIST OPTION COMPONENT
// ==========================================

function WaitlistOption({ roomType }: { roomType: RoomTypeWithAvailability }) {
  const { startDate, endDate } = useDateSelection()
  const { totalGuests } = useGuestInfo()
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false)
  
  // Mock user ID - in real app, get from auth context
  const userId = 'mock-user-id'
  
  const handleWaitlistSuccess = () => {
    setIsWaitlistDialogOpen(false)
    // Could show success toast or update UI
  }

  return (
    <div className="space-y-3">
      <Alert className="border-blue-200 bg-blue-50">
        <Clock className="h-4 w-4" />
        <AlertDescription className="text-blue-800">
          This room type is fully booked, but you can join our waitlist to be notified if it becomes available.
        </AlertDescription>
      </Alert>
      
      <Dialog open={isWaitlistDialogOpen} onOpenChange={setIsWaitlistDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
            <Clock className="h-4 w-4 mr-2" />
            Join Waitlist for {roomType.name}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Join Waitlist - {roomType.name}</DialogTitle>
          </DialogHeader>
          <WaitlistForm
            userId={userId}
            roomTypeId={roomType.id}
            roomTypeName={roomType.name}
            startDate={startDate!}
            endDate={endDate!}
            guests={totalGuests}
            onSuccess={handleWaitlistSuccess}
            onCancel={() => setIsWaitlistDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==========================================
// NO ROOMS AVAILABLE COMPONENT
// ==========================================

function NoRoomsAvailable() {
  const { startDate, endDate, nights } = useDateSelection()
  const { totalGuests, adults, children } = useGuestInfo()
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false)
  
  // Mock user ID - in real app, get from auth context
  const userId = 'mock-user-id'
  
  const handleWaitlistSuccess = () => {
    setIsWaitlistDialogOpen(false)
    // Could redirect to dashboard or show success message
  }

  return (
    <Card className="p-8 text-center">
      <div className="max-w-md mx-auto">
        <Bed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Rooms Available
        </h3>
        <p className="text-gray-600 mb-6">
          Sorry, no rooms are available for your selected dates ({startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}). 
        </p>
        
        {/* Waitlist Option */}
        <Alert className="mb-6 text-left">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Join our waitlist!</strong> We'll notify you immediately if a room becomes available for your dates.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="flex-1"
          >
            Change Dates
          </Button>
          
          <Dialog open={isWaitlistDialogOpen} onOpenChange={setIsWaitlistDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1">
                <Clock className="h-4 w-4 mr-2" />
                Join Waitlist
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Join Waitlist for Your Dates</DialogTitle>
              </DialogHeader>
              <WaitlistForm
                userId={userId}
                startDate={startDate!}
                endDate={endDate!}
                guests={totalGuests}
                onSuccess={handleWaitlistSuccess}
                onCancel={() => setIsWaitlistDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  )
}

// ==========================================
// ROOM SELECTION STEP COMPONENT
// ==========================================

export function RoomSelectionStep() {
  const { startDate, endDate, nights } = useDateSelection()
  const { totalGuests, adults, children } = useGuestInfo()
  const { 
    availableRoomTypes, 
    selectedRooms, 
    totalRooms, 
    updateRoomSelection, 
    setAvailableRoomTypes,
    isValid 
  } = useRoomSelection()

  // Local loading state
  const [isLoading, setIsLoading] = useState(false)
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false)
  
  // Mock user ID - in real app, get from auth context
  const userId = 'mock-user-id'

  // ==========================================
  // LOAD ROOM AVAILABILITY
  // ==========================================

  useEffect(() => {
    if (startDate && endDate) {
      setIsLoading(true)
      
      // Fetch real room types from API (with cache buster)
      fetch(`/api/room-types?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
        .then(res => res.json())
        .then(data => {
          console.log('🏨 Loaded room types from API:', data.roomTypes)
          console.log('🔑 Room type IDs:', data.roomTypes.map((r: any) => r.id))
          
          // Map API response to match our store interface
          const roomTypesWithAvailability: RoomTypeWithAvailability[] = data.roomTypes.map((room: any) => ({
            id: room.id,
            name: room.name,
            description: room.description || 'Comfortable room with modern amenities',
            pricePerNight: room.pricePerNight,
            totalRooms: room.totalRooms,
            availableRooms: room.totalRooms, // TODO: Calculate actual availability based on bookings
            imageUrl: room.imageUrl || '/images/rooms/default.jpg',
            amenities: Array.isArray(room.amenities) ? room.amenities : [],
          }))
          
          // Validate and clear any stale room selections
          const validRoomIds = new Set(roomTypesWithAvailability.map(r => r.id))
          const hasStaleSelections = selectedRooms.some(sr => !validRoomIds.has(sr.roomTypeId))
          
          if (hasStaleSelections) {
            console.log('⚠️  Detected stale room selections, clearing...')
            console.log('📦 Current selections:', selectedRooms.map(sr => ({ id: sr.roomTypeId, name: sr.roomTypeName })))
            console.log('✅ Valid IDs:', Array.from(validRoomIds))
            
            // Clear all stale selections
            selectedRooms.forEach(sr => {
              if (!validRoomIds.has(sr.roomTypeId)) {
                console.log(`🗑️  Removing stale selection: ${sr.roomTypeName} (${sr.roomTypeId})`)
                updateRoomSelection(sr.roomTypeId, 0)
              }
            })
          }
          
          setAvailableRoomTypes(roomTypesWithAvailability)
          setIsLoading(false)
        })
        .catch(error => {
          console.error('❌ Error loading room types:', error)
          // Fallback to mock data on error
          setAvailableRoomTypes(mockRoomTypes)
          setIsLoading(false)
        })
    }
  }, [startDate, endDate, setAvailableRoomTypes])

  // ==========================================
  // ROOM SELECTION HANDLERS
  // ==========================================

  const getRoomQuantity = (roomTypeId: string): number => {
    const selection = selectedRooms.find(sr => sr.roomTypeId === roomTypeId)
    return selection?.quantity || 0
  }

  const handleQuantityChange = (roomTypeId: string, newQuantity: number) => {
    updateRoomSelection(roomTypeId, newQuantity)
  }

  // ==========================================
  // ROOM CARD COMPONENT
  // ==========================================

  const RoomCard = ({ room }: { room: RoomTypeWithAvailability }) => {
    const quantity = getRoomQuantity(room.id)
    const maxQuantity = Math.min(room.availableRooms, 5) // Max 5 rooms per type
    const subtotal = quantity * room.pricePerNight * nights
    const isUnavailable = room.availableRooms === 0
    const isLowAvailability = room.availableRooms > 0 && room.availableRooms <= 2

    return (
      <Card className={cn(
        "overflow-hidden transition-all duration-300",
        isUnavailable 
          ? "opacity-75 border-red-200 bg-red-50/50" 
          : "hover:shadow-lg"
      )}>
        {/* Room Image Placeholder */}
        <div className="h-48 bg-gray-200 relative">
          <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
          
          {/* Unavailable Overlay */}
          {isUnavailable && (
            <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center">
              <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Fully Booked
              </div>
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 text-white">
            <h3 className="text-xl font-semibold">{room.name}</h3>
            <p className="text-sm opacity-90">
              {isUnavailable ? 'Fully booked' : `${room.availableRooms} available`}
            </p>
          </div>
          
          {/* Availability Badge */}
          <div className="absolute top-4 right-4">
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-full',
              isUnavailable
                ? 'bg-red-100 text-red-800'
                : room.availableRooms > 5 
                ? 'bg-green-100 text-green-800' 
                : room.availableRooms > 2
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-orange-100 text-orange-800'
            )}>
              {isUnavailable 
                ? 'Unavailable' 
                : room.availableRooms > 5 
                ? 'Available' 
                : `Only ${room.availableRooms} left`
              }
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Room Description */}
          <p className="text-gray-600 mb-4">{room.description}</p>

          {/* Amenities */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {room.amenities.slice(0, 4).map((amenity, index) => {
                const IconComponent = amenityIcons[amenity] || Star
                return (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700"
                  >
                    <IconComponent className="h-3 w-3" />
                    <span>{amenity}</span>
                  </div>
                )
              })}
              {room.amenities.length > 4 && (
                <div className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700">
                  +{room.amenities.length - 4} more
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                ${room.pricePerNight}
              </span>
              <span className="text-sm text-gray-500">per night</span>
            </div>
            {nights > 1 && (
              <p className="text-sm text-gray-600">
                ${room.pricePerNight * nights} for {nights} nights
              </p>
            )}
          </div>

          {/* Low Availability Warning */}
          {isLowAvailability && !isUnavailable && (
            <Alert className="mb-4 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-orange-800">
                <strong>High demand!</strong> Only {room.availableRooms} room{room.availableRooms !== 1 ? 's' : ''} left for these dates.
              </AlertDescription>
            </Alert>
          )}

          {/* Quantity Selection or Waitlist */}
          {isUnavailable ? (
            <WaitlistOption roomType={room} />
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700">Rooms</Label>
                {quantity > 0 && (
                  <p className="text-xs text-gray-500">
                    Subtotal: ${subtotal.toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(room.id, quantity - 1)}
                  disabled={quantity <= 0}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <span className="w-8 text-center font-medium">{quantity}</span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(room.id, quantity + 1)}
                  disabled={quantity >= maxQuantity}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Room Capacity Warning */}
          {quantity > 0 && !isUnavailable && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  {quantity} room{quantity > 1 ? 's' : ''} selected
                  {quantity * 2 < totalGuests && (
                    <span className="block text-xs text-blue-600 mt-1">
                      Consider selecting more rooms for {totalGuests} guests
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    )
  }

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Finding Available Rooms
          </h2>
          <p className="text-gray-600">
            Searching for rooms from {startDate?.toLocaleDateString()} to {endDate?.toLocaleDateString()}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse" />
              <div className="p-6 space-y-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="flex gap-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      
      {/* ==========================================
          STEP HEADER
          ========================================== */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Choose Your Rooms
        </h2>
        <p className="text-gray-600">
          Select from available room types for {adults} adult{adults !== 1 ? 's' : ''} 
          {children > 0 && ` and ${children} child${children !== 1 ? 'ren' : ''}`}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()} • {nights} night{nights !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ==========================================
          ROOM GRID
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {availableRoomTypes.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>

      {/* ==========================================
          SELECTION SUMMARY
          ========================================== */}
      {selectedRooms.length > 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-4">Your Room Selection</h3>
          
          <div className="space-y-3">
            {selectedRooms.map((selection) => (
              <div
                key={selection.roomTypeId}
                className="flex items-center justify-between py-2 border-b border-blue-200 last:border-b-0"
              >
                <div>
                  <p className="font-medium text-blue-900">
                    {selection.roomTypeName}
                  </p>
                  <p className="text-sm text-blue-700">
                    {selection.quantity} room{selection.quantity !== 1 ? 's' : ''} × ${selection.pricePerNight}/night × {nights} nights
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-900">
                    ${selection.subtotal.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-blue-900">
                Total Rooms: {totalRooms}
              </p>
              <p className="text-lg font-bold text-blue-900">
                ${selectedRooms.reduce((sum, sr) => sum + sr.subtotal, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ==========================================
          VALIDATION MESSAGE
          ========================================== */}
      {!isValid && availableRoomTypes.length > 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <Bed className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              Please select at least one room to continue with your booking.
            </p>
          </div>
        </Card>
      )}

      {/* ==========================================
          NO ROOMS AVAILABLE - WITH WAITLIST OPTION
          ========================================== */}
      {availableRoomTypes.length === 0 && !isLoading && (
        <NoRoomsAvailable />
      )}
    </div>
  )
}