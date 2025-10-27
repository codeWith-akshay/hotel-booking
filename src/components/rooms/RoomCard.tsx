// ==========================================
// ROOM CARD COMPONENT
// ==========================================
// Individual room card with image gallery, details, and booking CTA
// Optimized for performance with memoization and lazy loading

'use client'

import { memo, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Users, Bed, Maximize2, Star, Wifi, Coffee, Tv, 
  MapPin, TrendingUp, Check, ArrowRight, Heart 
} from 'lucide-react'
import type { RoomCardProps } from '@/types/room.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * RoomCard Component
 * 
 * Displays a single room with:
 * - High-quality image with lazy loading
 * - Amenities badges
 * - Rating and reviews
 * - Price with discounts
 * - Availability indicator
 * - Booking CTA with loading state
 * 
 * @example
 * ```tsx
 * <RoomCard
 *   room={roomData}
 *   onBookNow={(id) => handleBook(id)}
 *   layout="grid"
 * />
 * ```
 */
const RoomCard = memo<RoomCardProps>(({
  room,
  onBookNow,
  onViewDetails,
  showQuickView = true,
  layout = 'grid',
  className,
}) => {
  const [isBooking, setIsBooking] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  // Handle booking with loading state
  const handleBookClick = useCallback(async () => {
    if (isBooking || !onBookNow) return
    
    setIsBooking(true)
    try {
      await onBookNow(room.id)
    } finally {
      setTimeout(() => setIsBooking(false), 1000)
    }
  }, [room.id, onBookNow, isBooking])

  // Handle view details
  const handleViewDetails = useCallback(() => {
    onViewDetails?.(room.id)
  }, [room.id, onViewDetails])

  // Toggle favorite
  const toggleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }, [isFavorite])

  // Get availability badge
  const getAvailabilityBadge = () => {
    if (room.availabilityStatus === 'available') {
      return (
        <Badge className="bg-green-500 text-white hover:bg-green-600">
          <Check className="w-3 h-3 mr-1" />
          Available
        </Badge>
      )
    }
    if (room.availabilityStatus === 'limited') {
      return (
        <Badge className="bg-orange-500 text-white hover:bg-orange-600">
          <TrendingUp className="w-3 h-3 mr-1" />
          Only {room.availableRooms} left
        </Badge>
      )
    }
    return (
      <Badge variant="destructive">
        Unavailable
      </Badge>
    )
  }

  // Calculate discount percentage
  const discountPercentage = room.originalPrice
    ? Math.round(((room.originalPrice - room.pricePerNight) / room.originalPrice) * 100)
    : 0

  const isUnavailable = room.availabilityStatus === 'unavailable'

  const cardClasses = cn(
    'group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden',
    'hover:shadow-2xl transition-all duration-300',
    'border border-gray-200 dark:border-gray-700',
    isUnavailable && 'opacity-60',
    layout === 'list' ? 'flex flex-col md:flex-row' : 'flex flex-col',
    className
  )

  return (
    <article className={cardClasses} aria-label={`${room.name} room`}>
      {/* Image Section */}
      <div className={cn(
        'relative overflow-hidden',
        layout === 'grid' ? 'h-64' : 'md:w-1/3 h-64 md:h-auto'
      )}>
        {/* Main Image */}
        <div className="relative w-full h-full">
          {!imageError ? (
            <Image
              src={room.thumbnailImage}
              alt={`${room.name} - ${room.description}`}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            // Fallback gradient placeholder
            <div className="w-full h-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <Bed className="w-16 h-16 text-white opacity-50" />
            </div>
          )}
        </div>

        {/* Overlay Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2">
          {/* Availability Badge */}
          {getAvailabilityBadge()}

          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <Badge className="bg-red-500 text-white">
              {discountPercentage}% OFF
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          className={cn(
            'absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm',
            'transition-all duration-200 hover:scale-110',
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white/80 text-gray-700 hover:bg-white'
          )}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
        </button>

        {/* Image Counter */}
        {room.images.length > 1 && (
          <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-sm rounded-full">
            +{room.images.length - 1} photos
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={cn('flex flex-col', layout === 'grid' ? 'p-6' : 'flex-1 p-6')}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {room.name}
              </h3>
              {room.features && room.features[0] && (
                <Badge variant="outline" className="text-xs">
                  {room.features[0]}
                </Badge>
              )}
            </div>

            {/* Rating */}
            {room.rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {room.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({room.reviewCount} reviews)
                </span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="text-right">
            {room.originalPrice && (
              <p className="text-sm text-gray-400 line-through">
                ${room.originalPrice}
              </p>
            )}
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${room.pricePerNight}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">per night</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {room.description}
        </p>

        {/* Room Info Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-y border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center text-center">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-1" />
            <p className="text-xs font-medium text-gray-900 dark:text-white">{room.capacity} Guests</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Bed className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-1" />
            <p className="text-xs font-medium text-gray-900 dark:text-white">{room.beds}</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-1" />
            <p className="text-xs font-medium text-gray-900 dark:text-white">{room.size}</p>
          </div>
        </div>

        {/* Top Amenities */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {room.amenities.slice(0, 4).map((amenity) => {
              const icons: Record<string, React.ReactNode> = {
                'Free WiFi': <Wifi className="w-3 h-3" />,
                'WiFi': <Wifi className="w-3 h-3" />,
                'TV': <Tv className="w-3 h-3" />,
                'Smart TV': <Tv className="w-3 h-3" />,
                'Coffee Maker': <Coffee className="w-3 h-3" />,
              }

              return (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium"
                >
                  {icons[amenity] || <Check className="w-3 h-3" />}
                  {amenity}
                </span>
              )
            })}
            {room.amenities.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium">
                +{room.amenities.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex gap-2">
          {showQuickView && (
            <Button
              variant="outline"
              onClick={handleViewDetails}
              className="flex-1"
              disabled={isUnavailable}
            >
              View Details
            </Button>
          )}
          <Button
            onClick={handleBookClick}
            disabled={isUnavailable || isBooking}
            className={cn(
              'flex-1 font-semibold',
              !showQuickView && 'w-full'
            )}
          >
            {isBooking ? (
              'Booking...'
            ) : (
              <>
                Book Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* View Location */}
        {room.view && (
          <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <MapPin className="w-3 h-3 mr-1" />
            {room.view} • Floor {room.floor}
          </div>
        )}
      </div>
    </article>
  )
})

RoomCard.displayName = 'RoomCard'

export default RoomCard
