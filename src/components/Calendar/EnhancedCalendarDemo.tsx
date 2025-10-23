"use client";

import React, { useState, useEffect } from "react";
import EnhancedBookingCalendar from "./EnhancedBookingCalendar";
import { useBookingStore } from "@/store/booking.store";
import type { RoomAvailabilityByDate } from "@/types/room.types";

/**
 * EnhancedCalendarDemo Component
 * 
 * Demonstrates the EnhancedBookingCalendar with Zustand integration
 * Shows all features including:
 * - Room type selection
 * - Dynamic availability loading
 * - Error handling
 * - State persistence
 * - Responsive design
 * 
 * @example
 * // In your page:
 * import EnhancedCalendarDemo from '@/components/Calendar/EnhancedCalendarDemo'
 * 
 * export default function BookingPage() {
 *   return <EnhancedCalendarDemo />
 * }
 */

// Mock room types (replace with real data from your API)
const MOCK_ROOM_TYPES = [
  {
    id: "clx123456",
    name: "Deluxe Suite",
    description: "Spacious room with king bed and ocean view",
    pricePerNight: 25000, // cents
    totalRooms: 10,
  },
  {
    id: "clx123457",
    name: "Standard Room",
    description: "Comfortable room with queen bed",
    pricePerNight: 15000,
    totalRooms: 20,
  },
  {
    id: "clx123458",
    name: "Family Suite",
    description: "Large suite with two bedrooms",
    pricePerNight: 35000,
    totalRooms: 5,
  },
];

export default function EnhancedCalendarDemo() {
  // ==========================================
  // ZUSTAND STORE
  // ==========================================
  
  const {
    selectedRoomTypeId,
    dateRange,
    availabilityData,
    guestCount,
    roomCount,
    setRoomType,
    setDateRange,
    setGuestCount,
    setRoomCount,
    resetBooking,
  } = useBookingStore();

  // ==========================================
  // LOCAL STATE
  // ==========================================
  
  const [availabilityStats, setAvailabilityStats] = useState<{
    total: number;
    green: number;
    yellow: number;
    red: number;
  } | null>(null);

  // ==========================================
  // EFFECTS
  // ==========================================

  /**
   * Calculate availability statistics when data changes
   */
  useEffect(() => {
    if (availabilityData) {
      const stats = availabilityData.reduce(
        (acc, item) => {
          acc.total++;
          if (item.status === "green") acc.green++;
          else if (item.status === "yellow") acc.yellow++;
          else if (item.status === "red") acc.red++;
          return acc;
        },
        { total: 0, green: 0, yellow: 0, red: 0 }
      );
      setAvailabilityStats(stats);
    } else {
      setAvailabilityStats(null);
    }
  }, [availabilityData]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleAvailabilityLoad = (data: RoomAvailabilityByDate[]) => {
    console.log("Availability loaded:", data);
  };

  const handleError = (error: string) => {
    console.error("Calendar error:", error);
  };

  const handleBooking = () => {
    if (!selectedRoomTypeId || !dateRange.from || !dateRange.to) {
      alert("Please select room type and dates");
      return;
    }

    alert(
      `Booking submitted!\n\n` +
      `Room: ${MOCK_ROOM_TYPES.find((r) => r.id === selectedRoomTypeId)?.name}\n` +
      `Check-in: ${dateRange.from.toLocaleDateString()}\n` +
      `Check-out: ${dateRange.to.toLocaleDateString()}\n` +
      `Guests: ${guestCount}\n` +
      `Rooms: ${roomCount}`
    );
  };

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  const selectedRoom = MOCK_ROOM_TYPES.find((r) => r.id === selectedRoomTypeId);
  
  const nightCount =
    dateRange.from && dateRange.to
      ? Math.ceil(
          (dateRange.to.getTime() - dateRange.from.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const totalPrice = selectedRoom && nightCount
    ? (selectedRoom.pricePerNight * nightCount * roomCount) / 100
    : 0;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Book Your Stay
        </h1>
        <p className="mt-2 text-gray-600">
          Select your room type and dates to see real-time availability
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content - Calendar */}
        <div className="lg:col-span-2">
          {/* Room Type Selection */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              1. Select Room Type
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {MOCK_ROOM_TYPES.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setRoomType(room.id)}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    selectedRoomTypeId === room.id
                      ? "border-blue-600 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{room.name}</h3>
                  <p className="mt-1 text-xs text-gray-600">{room.description}</p>
                  <p className="mt-2 text-sm font-bold text-blue-600">
                    ${(room.pricePerNight / 100).toFixed(2)}/night
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {room.totalRooms} rooms available
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          {selectedRoomTypeId ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                2. Select Dates
              </h2>
              
              <EnhancedBookingCalendar
                roomTypeId={selectedRoomTypeId}
                selectedRange={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                onAvailabilityLoad={handleAvailabilityLoad}
                onError={handleError}
              />

              {/* Availability Statistics */}
              {availabilityStats && (
                <div className="mt-6 rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">
                    Availability Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-md bg-white p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {availabilityStats.total}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">Total Days</div>
                    </div>
                    <div className="rounded-md bg-white p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {availabilityStats.green}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">High</div>
                    </div>
                    <div className="rounded-md bg-white p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {availabilityStats.yellow}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">Low</div>
                    </div>
                    <div className="rounded-md bg-white p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {availabilityStats.red}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">Booked</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-4 text-sm text-gray-600">
                Select a room type above to view availability
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - Booking Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Booking Summary
            </h2>

            {/* Room Selection */}
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <div className="text-xs font-medium text-gray-600">Room Type</div>
              <div className="mt-1 font-semibold text-gray-900">
                {selectedRoom ? selectedRoom.name : "Not selected"}
              </div>
              {selectedRoom && (
                <div className="mt-1 text-sm text-gray-600">
                  ${(selectedRoom.pricePerNight / 100).toFixed(2)} per night
                </div>
              )}
            </div>

            {/* Guest & Room Count */}
            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Number of Guests
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Number of Rooms
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={roomCount}
                  onChange={(e) => setRoomCount(parseInt(e.target.value) || 1)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Date Summary */}
            <div className="mb-4 space-y-2 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Check-in:</span>
                <span className="font-medium text-gray-900">
                  {dateRange.from
                    ? dateRange.from.toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Check-out:</span>
                <span className="font-medium text-gray-900">
                  {dateRange.to ? dateRange.to.toLocaleDateString() : "—"}
                </span>
              </div>
              {nightCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nights:</span>
                  <span className="font-medium text-gray-900">{nightCount}</span>
                </div>
              )}
            </div>

            {/* Price Calculation */}
            {totalPrice > 0 && (
              <div className="mb-4 rounded-lg bg-blue-50 p-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {nightCount} nights × {roomCount} room{roomCount > 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-blue-100 pt-2">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleBooking}
                disabled={!selectedRoomTypeId || !dateRange.from || !dateRange.to}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
              >
                {selectedRoomTypeId && dateRange.from && dateRange.to
                  ? "Complete Booking"
                  : "Select Room & Dates"}
              </button>
              <button
                onClick={resetBooking}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Reset
              </button>
            </div>

            {/* Info Note */}
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              <p className="font-medium text-gray-700">💡 Quick Tips:</p>
              <ul className="ml-3 mt-1 list-disc space-y-1">
                <li>Hover over dates to see availability</li>
                <li>Green dots indicate high availability</li>
                <li>Your selection is automatically saved</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Info */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-gray-700">
            🔧 Developer Info (Click to expand)
          </summary>
          <div className="mt-3 space-y-2 text-xs text-gray-600">
            <div>
              <strong>Store State:</strong>
              <pre className="mt-1 overflow-auto rounded bg-white p-2">
                {JSON.stringify(
                  {
                    selectedRoomTypeId,
                    dateRange: {
                      from: dateRange.from?.toISOString(),
                      to: dateRange.to?.toISOString(),
                    },
                    guestCount,
                    roomCount,
                    availabilityDataLength: availabilityData?.length || 0,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
