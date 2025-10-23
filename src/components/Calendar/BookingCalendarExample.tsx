"use client";

import { useState, useEffect } from "react";
import BookingCalendar from "./BookingCalendar";

/**
 * Example: Hotel Room Booking Form with Calendar Integration
 * 
 * This example demonstrates how to integrate the BookingCalendar component
 * into a complete booking form with validation and API integration.
 */
export default function BookingFormExample() {
  // State for managing date selection
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | null;
  }>({
    from: new Date(),
    to: null,
  });

  // State for unavailable dates (fetched from backend)
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);

  // State for form validation
  const [errors, setErrors] = useState<{
    dates?: string;
    general?: string;
  }>({});

  /**
   * Example: Fetch unavailable dates from your booking API
   * This would typically be called when component mounts or when room selection changes
   */
  useEffect(() => {
    const fetchUnavailableDates = async () => {
      try {
        // Replace with your actual API endpoint
        const roomId = "123"; // Get from props or router params
        const response = await fetch(`/api/rooms/${roomId}/availability`);
        const data = await response.json();

        // Convert ISO date strings to Date objects
        const bookedDates = data.bookedDates.map(
          (dateStr: string) => new Date(dateStr)
        );
        setUnavailableDates(bookedDates);
      } catch (error) {
        console.error("Failed to fetch unavailable dates:", error);
      }
    };

    // Uncomment to enable API integration
    // fetchUnavailableDates();

    // Mock data for demonstration
    const mockUnavailableDates = [
      new Date(2025, 9, 25), // Oct 25, 2025
      new Date(2025, 9, 26), // Oct 26, 2025
      new Date(2025, 9, 30), // Oct 30, 2025
    ];
    setUnavailableDates(mockUnavailableDates);
  }, []);

  /**
   * Validate date selection before form submission
   */
  const validateDates = (): boolean => {
    const newErrors: { dates?: string } = {};

    if (!dateRange.from) {
      newErrors.dates = "Please select a check-in date";
      setErrors(newErrors);
      return false;
    }

    if (!dateRange.to) {
      newErrors.dates = "Please select a check-out date";
      setErrors(newErrors);
      return false;
    }

    // Ensure checkout is after checkin
    if (dateRange.to <= dateRange.from) {
      newErrors.dates = "Check-out must be after check-in";
      setErrors(newErrors);
      return false;
    }

    // Minimum stay validation (e.g., 1 night minimum)
    const nights = Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (nights < 1) {
      newErrors.dates = "Minimum stay is 1 night";
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDates()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Example API call to create booking
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: "123", // Get from props or state
          checkIn: dateRange.from.toISOString(),
          checkOut: dateRange.to?.toISOString(),
          // Add other booking details...
        }),
      });

      if (!response.ok) {
        throw new Error("Booking failed");
      }

      const booking = await response.json();
      console.log("Booking created:", booking);

      // Redirect to confirmation page or show success message
      // router.push(`/bookings/${booking.id}/confirmation`);
    } catch (error) {
      setErrors({
        general: "Failed to create booking. Please try again.",
      });
      console.error("Booking error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate total price based on nights and room rate
   */
  const calculateTotalPrice = () => {
    if (!dateRange.from || !dateRange.to) return 0;

    const nights = Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
    );
    const pricePerNight = 150; // Get from room data

    return nights * pricePerNight;
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Book Your Stay
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Calendar Component Integration */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Select Your Dates
          </h2>

          <BookingCalendar
            selectedRange={dateRange}
            onSelect={setDateRange}
            minDate={new Date()} // Can't book past dates
            maxDate={
              new Date(new Date().setMonth(new Date().getMonth() + 12))
            } // Can book up to 12 months ahead
            disabledDates={unavailableDates} // Dates already booked
            numberOfMonths={2} // Show 2 months (responsive to 1 on mobile)
          />

          {/* Display validation errors */}
          {errors.dates && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {errors.dates}
            </div>
          )}
        </div>

        {/* Booking Summary */}
        {dateRange.from && dateRange.to && (
          <div className="rounded-lg bg-gray-50 p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              Booking Summary
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price per night:</span>
                <span className="font-semibold text-gray-900">$150</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Number of nights:</span>
                <span className="font-semibold text-gray-900">
                  {Math.ceil(
                    (dateRange.to.getTime() - dateRange.from.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}
                </span>
              </div>

              <div className="border-t border-gray-300 pt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-800">
                    Total Price:
                  </span>
                  <span className="font-bold text-blue-600">
                    ${calculateTotalPrice()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* General error message */}
        {errors.general && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
            {errors.general}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !dateRange.from || !dateRange.to}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}

/**
 * ADDITIONAL INTEGRATION PATTERNS
 * 
 * 1. With Redux/Zustand state management:
 *    const dispatch = useDispatch();
 *    const handleDateSelect = (range) => {
 *      dispatch(setBookingDates(range));
 *    };
 * 
 * 2. With URL query params (for shareable booking links):
 *    const router = useRouter();
 *    const searchParams = useSearchParams();
 *    
 *    useEffect(() => {
 *      const checkIn = searchParams.get('checkIn');
 *      const checkOut = searchParams.get('checkOut');
 *      if (checkIn && checkOut) {
 *        setDateRange({
 *          from: new Date(checkIn),
 *          to: new Date(checkOut)
 *        });
 *      }
 *    }, [searchParams]);
 * 
 * 3. With dynamic pricing based on dates:
 *    useEffect(() => {
 *      if (dateRange.from && dateRange.to) {
 *        fetchPricingForDates(dateRange.from, dateRange.to)
 *          .then(pricing => setPricing(pricing));
 *      }
 *    }, [dateRange]);
 * 
 * 4. With real-time availability checking:
 *    const debouncedCheckAvailability = useDebounce((range) => {
 *      checkRoomAvailability(roomId, range.from, range.to)
 *        .then(available => setIsAvailable(available));
 *    }, 500);
 *    
 *    useEffect(() => {
 *      if (dateRange.from && dateRange.to) {
 *        debouncedCheckAvailability(dateRange);
 *      }
 *    }, [dateRange]);
 */
