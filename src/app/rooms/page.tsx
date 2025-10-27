// ==========================================
// ROOMS PAGE - Public Room Listing
// ==========================================
// Public-facing page showing available room types

import { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Users, Bed, Wifi, Coffee, Tv, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Our Rooms | Hotel Booking',
  description: 'Browse our selection of comfortable and luxurious rooms. Find the perfect accommodation for your stay.',
  keywords: ['hotel rooms', 'accommodations', 'room types', 'booking'],
}

// Mock room data - Replace with API call in production
const roomTypes = [
  {
    id: '1',
    name: 'Standard Room',
    description: 'Comfortable and cozy room perfect for solo travelers or couples.',
    capacity: 2,
    beds: '1 Queen Bed',
    size: '250 sq ft',
    pricePerNight: 99,
    amenities: ['Free WiFi', 'TV', 'Air Conditioning', 'Mini Fridge'],
    image: '/images/rooms/standard.jpg',
  },
  {
    id: '2',
    name: 'Deluxe Room',
    description: 'Spacious room with premium amenities and city views.',
    capacity: 3,
    beds: '1 King Bed + Sofa',
    size: '350 sq ft',
    pricePerNight: 149,
    amenities: ['Free WiFi', 'Smart TV', 'Coffee Maker', 'Mini Bar', 'Balcony'],
    image: '/images/rooms/deluxe.jpg',
  },
  {
    id: '3',
    name: 'Family Suite',
    description: 'Perfect for families with separate bedroom and living area.',
    capacity: 5,
    beds: '1 King + 2 Twin Beds',
    size: '500 sq ft',
    pricePerNight: 229,
    amenities: ['Free WiFi', 'Smart TV', 'Kitchenette', 'Dining Area', 'Two Bathrooms'],
    image: '/images/rooms/suite.jpg',
  },
  {
    id: '4',
    name: 'Executive Suite',
    description: 'Luxurious suite with premium furnishings and exclusive amenities.',
    capacity: 4,
    beds: '1 King Bed + Living Room',
    size: '650 sq ft',
    pricePerNight: 299,
    amenities: ['Free WiFi', 'Smart TV', 'Office Desk', 'Jacuzzi', 'Butler Service'],
    image: '/images/rooms/executive.jpg',
  },
]

const amenityIcons: Record<string, React.ReactNode> = {
  'Free WiFi': <Wifi className="h-5 w-5" />,
  'TV': <Tv className="h-5 w-5" />,
  'Smart TV': <Tv className="h-5 w-5" />,
  'Coffee Maker': <Coffee className="h-5 w-5" />,
}

export default function RoomsPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              🏨 Hotel Booking
            </Link>
            <nav className="flex gap-6">
              <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Home
              </Link>
              <Link href="/booking" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Book Now
              </Link>
              <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Our Rooms & Suites
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose from our selection of comfortable and luxurious accommodations designed for your perfect stay.
          </p>
        </div>
      </section>

      {/* Room Listings */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roomTypes.map((room) => (
              <div
                key={room.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
              >
                {/* Room Image Placeholder */}
                <div className="h-64 bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <Building2 className="h-24 w-24 text-white opacity-50" />
                </div>

                {/* Room Details */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {room.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {room.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        ${room.pricePerNight}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">per night</p>
                    </div>
                  </div>

                  {/* Room Info */}
                  <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <Users className="h-6 w-6 mx-auto text-gray-600 dark:text-gray-400 mb-1" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">{room.capacity} Guests</p>
                    </div>
                    <div className="text-center">
                      <Bed className="h-6 w-6 mx-auto text-gray-600 dark:text-gray-400 mb-1" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">{room.beds}</p>
                    </div>
                    <div className="text-center">
                      <Building2 className="h-6 w-6 mx-auto text-gray-600 dark:text-gray-400 mb-1" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">{room.size}</p>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Amenities
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-1"
                        >
                          {amenityIcons[amenity] || <span>•</span>}
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Book Button */}
                  <Link
                    href="/booking"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Book This Room
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 dark:bg-blue-800">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Book Your Stay?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Check availability and reserve your perfect room today.
          </p>
          <Link
            href="/booking"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            Check Availability
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Hotel Booking. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/about" className="text-gray-400 hover:text-white">About</Link>
            <Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
