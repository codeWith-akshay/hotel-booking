// ==========================================
// MOCK ROOM DATA
// ==========================================
// Realistic mock data for development and testing

import type { RoomType } from '@/types/room.types'

export const mockRoomData: RoomType[] = [
  {
    id: '1',
    name: 'Standard Room',
    slug: 'standard-room',
    description: 'Comfortable and cozy room perfect for solo travelers or couples.',
    longDescription: 'Our Standard Room offers a perfect blend of comfort and functionality. Featuring modern amenities and a thoughtfully designed space, it provides everything you need for a pleasant stay. Ideal for business travelers or couples seeking a comfortable retreat.',
    capacity: 2,
    maxCapacity: 2,
    beds: '1 Queen Bed',
    bedTypes: [{ type: 'Queen', count: 1 }],
    size: '250 sq ft',
    sizeInSqFt: 250,
    pricePerNight: 99,
    amenities: ['Free WiFi', 'TV', 'Air Conditioning', 'Mini Fridge', 'Work Desk', 'Room Service'],
    images: [
      '/images/rooms/standard-1.jpg',
      '/images/rooms/standard-2.jpg',
      '/images/rooms/standard-3.jpg',
    ],
    thumbnailImage: '/images/rooms/standard-1.jpg',
    rating: 4.5,
    reviewCount: 128,
    category: 'standard',
    floor: '2-5',
    view: 'City View',
    availabilityStatus: 'available',
    availableRooms: 8,
    totalRooms: 10,
    features: ['Free Parking', 'Pet Friendly'],
    policies: {
      checkIn: '3:00 PM',
      checkOut: '11:00 AM',
      cancellation: 'Free cancellation up to 24 hours before check-in',
    },
  },
  {
    id: '2',
    name: 'Deluxe Room',
    slug: 'deluxe-room',
    description: 'Spacious room with premium amenities and city views.',
    longDescription: 'Experience luxury in our Deluxe Room, featuring expansive city views and upscale amenities. The sophisticated design and enhanced space make it perfect for extended stays or those seeking extra comfort during their visit.',
    capacity: 3,
    maxCapacity: 3,
    beds: '1 King Bed + Sofa',
    bedTypes: [{ type: 'King', count: 1 }, { type: 'Sofa Bed', count: 1 }],
    size: '350 sq ft',
    sizeInSqFt: 350,
    pricePerNight: 149,
    originalPrice: 179,
    amenities: ['Free WiFi', 'Smart TV', 'Coffee Maker', 'Mini Bar', 'Balcony', 'Premium Toiletries', 'Bathrobe', 'Work Desk'],
    images: [
      '/images/rooms/deluxe-1.jpg',
      '/images/rooms/deluxe-2.jpg',
      '/images/rooms/deluxe-3.jpg',
      '/images/rooms/deluxe-4.jpg',
    ],
    thumbnailImage: '/images/rooms/deluxe-1.jpg',
    rating: 4.7,
    reviewCount: 94,
    category: 'deluxe',
    floor: '6-10',
    view: 'Premium City View',
    availabilityStatus: 'limited',
    availableRooms: 3,
    totalRooms: 8,
    features: ['Recently Renovated', 'Corner Room', 'Panoramic Windows'],
    policies: {
      checkIn: '3:00 PM',
      checkOut: '12:00 PM',
      cancellation: 'Free cancellation up to 48 hours before check-in',
    },
  },
  {
    id: '3',
    name: 'Family Suite',
    slug: 'family-suite',
    description: 'Perfect for families with separate bedroom and living area.',
    longDescription: 'Our Family Suite is designed with families in mind, offering separate sleeping and living spaces for maximum comfort and privacy. With room for up to 5 guests, it\'s the ideal choice for family vacations.',
    capacity: 5,
    maxCapacity: 5,
    beds: '1 King + 2 Twin Beds',
    bedTypes: [{ type: 'King', count: 1 }, { type: 'Twin', count: 2 }],
    size: '500 sq ft',
    sizeInSqFt: 500,
    pricePerNight: 229,
    amenities: ['Free WiFi', 'Smart TV', 'Kitchenette', 'Dining Area', 'Two Bathrooms', 'Washer/Dryer', 'Gaming Console', 'Kid-Friendly Amenities'],
    images: [
      '/images/rooms/suite-1.jpg',
      '/images/rooms/suite-2.jpg',
      '/images/rooms/suite-3.jpg',
      '/images/rooms/suite-4.jpg',
      '/images/rooms/suite-5.jpg',
    ],
    thumbnailImage: '/images/rooms/suite-1.jpg',
    rating: 4.8,
    reviewCount: 67,
    category: 'suite',
    floor: '8-12',
    view: 'Garden View',
    availabilityStatus: 'available',
    availableRooms: 5,
    totalRooms: 6,
    features: ['Family-Friendly', 'Connecting Rooms Available', 'Kids Welcome Kit'],
    policies: {
      checkIn: '2:00 PM',
      checkOut: '12:00 PM',
      cancellation: 'Free cancellation up to 72 hours before check-in',
    },
  },
  {
    id: '4',
    name: 'Executive Suite',
    slug: 'executive-suite',
    description: 'Luxurious suite with premium furnishings and exclusive amenities.',
    longDescription: 'Indulge in the ultimate luxury experience with our Executive Suite. Featuring premium furnishings, a spacious layout, and exclusive amenities including butler service, this suite is designed for discerning travelers who expect the very best.',
    capacity: 4,
    maxCapacity: 4,
    beds: '1 King Bed + Living Room',
    bedTypes: [{ type: 'King', count: 1 }, { type: 'Sofa Bed', count: 1 }],
    size: '650 sq ft',
    sizeInSqFt: 650,
    pricePerNight: 299,
    originalPrice: 349,
    amenities: ['Free WiFi', 'Smart TV', 'Office Desk', 'Jacuzzi', 'Butler Service', 'Premium Bar', 'Nespresso Machine', 'Premium Sound System'],
    images: [
      '/images/rooms/executive-1.jpg',
      '/images/rooms/executive-2.jpg',
      '/images/rooms/executive-3.jpg',
      '/images/rooms/executive-4.jpg',
    ],
    thumbnailImage: '/images/rooms/executive-1.jpg',
    rating: 4.9,
    reviewCount: 52,
    category: 'executive',
    floor: '15-18',
    view: 'Skyline View',
    availabilityStatus: 'limited',
    availableRooms: 2,
    totalRooms: 4,
    features: ['VIP Status', 'Airport Transfer Included', 'Late Checkout', 'Executive Lounge Access'],
    policies: {
      checkIn: '2:00 PM',
      checkOut: '1:00 PM',
      cancellation: 'Non-refundable rate with special perks',
    },
  },
  {
    id: '5',
    name: 'Penthouse Suite',
    slug: 'penthouse-suite',
    description: 'The ultimate luxury experience with breathtaking panoramic views.',
    longDescription: 'Experience unparalleled luxury in our Penthouse Suite. Spanning the entire top floor, this exclusive suite offers 360-degree panoramic views, private terrace, and bespoke concierge services for an unforgettable stay.',
    capacity: 6,
    maxCapacity: 8,
    beds: '2 King Beds + Living Areas',
    bedTypes: [{ type: 'King', count: 2 }, { type: 'Sofa Bed', count: 2 }],
    size: '1200 sq ft',
    sizeInSqFt: 1200,
    pricePerNight: 599,
    amenities: ['Free WiFi', 'Smart TV in Every Room', 'Full Kitchen', 'Private Terrace', 'Home Cinema', 'Wine Cellar', '24/7 Butler', 'Private Gym', 'Spa Bath'],
    images: [
      '/images/rooms/penthouse-1.jpg',
      '/images/rooms/penthouse-2.jpg',
      '/images/rooms/penthouse-3.jpg',
      '/images/rooms/penthouse-4.jpg',
      '/images/rooms/penthouse-5.jpg',
      '/images/rooms/penthouse-6.jpg',
    ],
    thumbnailImage: '/images/rooms/penthouse-1.jpg',
    rating: 5.0,
    reviewCount: 28,
    category: 'penthouse',
    floor: 'Top Floor (20)',
    view: '360° Panoramic View',
    availabilityStatus: 'available',
    availableRooms: 1,
    totalRooms: 1,
    features: ['Private Elevator', 'Rooftop Access', 'Personal Chef Available', 'Helicopter Pad Access'],
    policies: {
      checkIn: '12:00 PM',
      checkOut: '3:00 PM',
      cancellation: 'Contact concierge for details',
    },
  },
]

// Helper function to get rooms by category
export const getRoomsByCategory = (category: RoomType['category']) => {
  return mockRoomData.filter((room) => room.category === category)
}

// Helper function to filter rooms by price range
export const filterRoomsByPrice = (min: number, max: number) => {
  return mockRoomData.filter(
    (room) => room.pricePerNight >= min && room.pricePerNight <= max
  )
}

// Helper function to get available rooms only
export const getAvailableRooms = () => {
  return mockRoomData.filter(
    (room) => room.availabilityStatus === 'available' || room.availabilityStatus === 'limited'
  )
}
