"use client";

/**
 * Enhanced Booking Calendar Example
 * 
 * Demonstrates the new BookingCalendar component with:
 * - Availability integration
 * - Zustand state management
 * - Modern Tailwind design
 * - Responsive layout
 * - Loading states
 * - Error handling
 */

import { useState, useEffect } from "react";
import BookingCalendar from "@/components/Calendar/BookingCalendar";
import { useBookingStore } from "@/store/booking.store";

// ==========================================
// EXAMPLE 1: Basic Usage with Zustand
// ==========================================

export function BasicBookingExample() {
  const { dateRange, setDateRange, setRoomType } = useBookingStore();

  // Set room type on mount
  useEffect(() => {
    setRoomType({
      id: "clx123456", // Replace with actual room type ID
      name: "Deluxe Room",
      pricePerNight: 15000, // $150.00 in cents
      totalRooms: 20,
    });
  }, [setRoomType]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Book Your Stay
      </h1>

      <BookingCalendar
        roomTypeId="clx123456"
        selectedRange={dateRange}
        onSelect={setDateRange}
        showAvailability={true}
        numberOfMonths={2}
      />

      {/* Display selection summary */}
      {dateRange.from && dateRange.to && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <h3 className="font-semibold text-green-900">
            ✓ Dates Selected
          </h3>
          <p className="mt-1 text-sm text-green-700">
            Check-in: {dateRange.from.toLocaleDateString()} <br />
            Check-out: {dateRange.to.toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// EXAMPLE 2: Multi-Room Type Selector
// ==========================================

export function MultiRoomTypeExample() {
  const {
    dateRange,
    setDateRange,
    selectedRoomType,
    setRoomType,
  } = useBookingStore();

  const roomTypes = [
    {
      id: "clx111111",
      name: "Standard Room",
      pricePerNight: 10000,
      totalRooms: 30,
    },
    {
      id: "clx222222",
      name: "Deluxe Room",
      pricePerNight: 15000,
      totalRooms: 20,
    },
    {
      id: "clx333333",
      name: "Suite",
      pricePerNight: 25000,
      totalRooms: 10,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        Select Room & Dates
      </h1>

      {/* Room Type Selector */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          1. Choose Room Type
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {roomTypes.map((room) => (
            <button
              key={room.id}
              onClick={() => setRoomType(room)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                selectedRoomType?.id === room.id
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <h3 className="font-bold text-gray-900">{room.name}</h3>
              <p className="mt-1 text-sm text-gray-600">
                ${(room.pricePerNight / 100).toFixed(2)} / night
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {room.totalRooms} total rooms
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      {selectedRoomType && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            2. Select Dates
          </h2>
          <BookingCalendar
            roomTypeId={selectedRoomType.id}
            selectedRange={dateRange}
            onSelect={setDateRange}
            showAvailability={true}
            numberOfMonths={2}
          />
        </div>
      )}
    </div>
  );
}

// ==========================================
// EXAMPLE 3: Responsive Mobile-Optimized
// ==========================================

export function ResponsiveBookingExample() {
  const { dateRange, setDateRange } = useBookingStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-900 md:text-4xl">
            Book Your Perfect Stay
          </h1>
          <p className="mt-2 text-sm text-gray-600 md:text-base">
            Check availability and select your dates
          </p>
        </div>

        <BookingCalendar
          roomTypeId="clx123456"
          selectedRange={dateRange}
          onSelect={setDateRange}
          showAvailability={true}
          numberOfMonths={isMobile ? 1 : 2} // Dynamic based on screen size
        />
      </div>
    </div>
  );
}

// ==========================================
// EXAMPLE 4: With Price Calculator
// ==========================================

export function BookingWithPriceExample() {
  const {
    dateRange,
    setDateRange,
    selectedRoomType,
    setRoomType,
    getTotalNights,
    getTotalPrice,
  } = useBookingStore();

  useEffect(() => {
    setRoomType({
      id: "clx123456",
      name: "Deluxe Room",
      pricePerNight: 15000,
      totalRooms: 20,
    });
  }, [setRoomType]);

  const totalNights = getTotalNights();
  const totalPrice = getTotalPrice();

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar - 2 columns */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Select Your Dates
          </h2>
          <BookingCalendar
            roomTypeId={selectedRoomType?.id || undefined}
            selectedRange={dateRange}
            onSelect={setDateRange}
            showAvailability={true}
            numberOfMonths={2}
          />
        </div>

        {/* Price Summary - 1 column */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Booking Summary
              </h3>

              {selectedRoomType && (
                <>
                  <div className="mb-4 rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-600">
                      Room Type
                    </p>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {selectedRoomType.name}
                    </p>
                  </div>

                  {totalNights > 0 && (
                    <>
                      <div className="space-y-3 border-t border-gray-200 pt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            ${(selectedRoomType.pricePerNight / 100).toFixed(2)}{" "}
                            × {totalNights} nights
                          </span>
                          <span className="font-medium text-gray-900">
                            ${(totalPrice / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="flex justify-between text-lg">
                          <span className="font-bold text-gray-900">
                            Total
                          </span>
                          <span className="font-bold text-blue-600">
                            ${(totalPrice / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <button className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl active:scale-95">
                        Reserve Now
                      </button>
                    </>
                  )}

                  {totalNights === 0 && (
                    <p className="mt-4 text-center text-sm text-gray-500">
                      Select dates to see pricing
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// EXAMPLE 5: With Custom Validation
// ==========================================

export function BookingWithValidationExample() {
  const { dateRange, setDateRange } = useBookingStore();
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleDateSelect = (range: { from: Date; to: Date | null }) => {
    setValidationError(null);

    // Minimum stay validation (e.g., 2 nights)
    if (range.from && range.to) {
      const nights = Math.ceil(
        (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (nights < 2) {
        setValidationError("Minimum stay is 2 nights");
        return;
      }

      // Maximum stay validation (e.g., 14 nights)
      if (nights > 14) {
        setValidationError("Maximum stay is 14 nights");
        return;
      }
    }

    setDateRange(range);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Book with Validation
      </h1>

      {validationError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            ⚠️ {validationError}
          </p>
        </div>
      )}

      <BookingCalendar
        roomTypeId="clx123456"
        selectedRange={dateRange}
        onSelect={handleDateSelect}
        showAvailability={true}
        numberOfMonths={2}
        minDate={new Date()}
        maxDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)} // 90 days ahead
      />
    </div>
  );
}

// ==========================================
// USAGE IN A PAGE
// ==========================================

/**
 * Example page component using the enhanced calendar
 */
export default function BookingPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Choose one of the examples above */}
      <BookingWithPriceExample />
    </div>
  );
}
