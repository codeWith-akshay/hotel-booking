# Offline Customer Booking & Check-In Guide

**For Admin & SuperAdmin Users**

## 📋 Overview

This guide explains how admins and superAdmins can create bookings and check-in walk-in customers **without requiring customer login or registration**.

## 🎯 Two Modes Available

### 1. **Quick Check-In** (Immediate)
For walk-in customers who need to check in **right now**.
- Creates customer profile
- Creates booking
- Checks in immediately
- Collects payment (optional)

### 2. **Offline Booking** (Advance)
For booking customers who will check in later.
- Creates customer profile
- Creates booking for future dates
- Payment can be collected now or later
- Admin manually checks in when customer arrives

---

## 🚀 How to Use

### **Access Point**
1. Login as **Admin** or **SuperAdmin**
2. Navigate to **Admin Dashboard**
3. Look for two buttons in the top-right:
   - 🟢 **"Quick Check-In"** - For immediate check-in
   - 🟣 **"Offline Booking"** - For future bookings

---

## 📝 Step-by-Step: Quick Check-In (Walk-in Customer)

### **When to Use**
- Customer walks in without reservation
- Room is available
- Need immediate check-in

### **Steps**

#### **Step 1: Customer Information**
1. Click **"Quick Check-In"** button
2. Enter customer details:
   - **Phone Number*** (required) - Click "Verify" to check if customer exists
   - **Full Name*** (required)
   - **Email** (optional)
   - **Address** (optional)
   - **ID Type & Number** (optional - Passport, Driver License, Aadhar, etc.)
   - **VIP Status** (Regular, VIP, Staff)
   - **IRCA Membership ID** (optional)

> 💡 **Tip**: If the phone number exists, the system will auto-fill customer details!

3. Click **"Next"**

#### **Step 2: Booking Details**
1. Select dates:
   - **Check-In Date** (today or future)
   - **Check-Out Date**
2. Enter **Number of Rooms**
3. Click **"Search Available Rooms"**
4. Select a room type from the available options:
   - View room details, price per night
   - Total price calculated automatically
5. Add **Special Requests** (optional)
6. Add **Admin Notes** (optional)
7. Click **"Next"**

#### **Step 3: Payment**
1. Enter **Payment Amount** (optional - can be paid later)
   - System shows total booking amount
   - Can accept partial payment
2. If payment entered:
   - Select **Payment Method** (Cash, Card, Bank Transfer, Cheque, Other)
   - Enter **Reference/Receipt Number** (optional)
   - Add **Payment Notes** (optional)
3. Click **"Next"**

#### **Step 4: Review & Confirm**
1. Review all details:
   - Customer information
   - Booking details
   - Payment summary
2. See confirmation: "Customer will be automatically checked in"
3. Click **"Check In Now"**

✅ **Done!** Customer is now:
- Registered in system
- Booking created
- **Checked in immediately**
- Payment recorded (if provided)
- Room inventory updated

---

## 📅 Step-by-Step: Offline Booking (Future Reservation)

### **When to Use**
- Customer wants to book for future dates
- Taking advance reservations
- Phone/walk-in bookings

### **Steps**

Follow the **same 4 steps** as Quick Check-In, but:
- Select **future dates** in Step 2
- Final button says **"Create Booking"** instead of "Check In Now"
- Customer will NOT be checked in automatically
- You must manually check them in when they arrive (using existing check-in feature)

---

## 💡 Key Features

### **Automatic Customer Detection**
- System checks if phone number already exists
- Auto-fills existing customer details
- Updates customer info if provided
- Creates new customer if not found

### **Real-Time Room Availability**
- Searches available rooms for selected dates
- Shows only rooms that are available
- Displays total price calculation
- Multiple room types can be booked

### **Flexible Payment Options**
- ✅ Full payment upfront
- ✅ Partial payment (deposit)
- ✅ No payment (pay later)
- ✅ Multiple payment methods supported:
  - 💵 Cash
  - 💳 Card (POS terminal)
  - 🏦 Bank Transfer
  - 📄 Cheque
  - 🔄 Other

### **Payment Behavior**
- **Full payment** → Booking auto-confirms
- **Partial payment** → Booking stays provisional, can collect remaining later
- **No payment** → Booking provisional, collect payment later

### **Automatic Room Management**
- ✅ Room inventory decrements automatically
- ✅ Rooms blocked for booking period
- ✅ Prevents overbooking
- ✅ Restores inventory on check-out/cancellation

### **Complete Audit Trail**
- ✅ All actions logged with admin name
- ✅ Customer creation/update tracked
- ✅ Booking creation logged
- ✅ Payment recording logged
- ✅ Check-in/out logged

---

## 🔄 Complete Workflow Examples

### **Example 1: Walk-in Guest (Same Day Check-in)**

**Scenario**: Guest walks in, wants room for 2 nights starting today

1. Click **"Quick Check-In"**
2. Enter phone: `9876543210` → Verify → New customer
3. Enter name: `John Doe`, email: `john@example.com`
4. Next → Select dates: Today to +2 days
5. Search rooms → Select "Deluxe Room" - ₹5,000/night
6. Next → Enter payment: ₹10,000 (full payment) → Cash
7. Review → **"Check In Now"**

**Result**:
- ✅ John Doe registered
- ✅ Booking created (₹10,000 total)
- ✅ Fully paid (₹10,000 cash)
- ✅ **Checked in immediately**
- ✅ Room 101 occupied

---

### **Example 2: Phone Booking (Future Date)**

**Scenario**: Customer calls to book room for next week

1. Click **"Offline Booking"**
2. Enter phone: `9998887776` → Verify → New customer
3. Enter name: `Jane Smith`, email: `jane@example.com`
4. Next → Select dates: +7 days to +10 days (3 nights)
5. Search rooms → Select "Suite" - ₹8,000/night
6. Next → Enter payment: ₹5,000 (partial deposit) → Bank Transfer
   - Reference: `TXN123456789`
7. Review → **"Create Booking"**

**Result**:
- ✅ Jane Smith registered
- ✅ Booking created (₹24,000 total)
- ✅ Partial payment (₹5,000) - Remaining: ₹19,000
- ✅ Status: Provisional (not checked in yet)
- ✅ Rooms blocked for dates

**When Jane Arrives**:
- Admin finds booking in dashboard
- Click **"Check In"** button
- Jane is now checked in
- Collect remaining ₹19,000 using "Record Payment"

---

### **Example 3: VIP Customer (Existing in System)**

**Scenario**: Regular VIP customer walks in

1. Click **"Quick Check-In"**
2. Enter phone: `9191919191` → Verify
   - ✅ **System finds existing customer**
   - ✅ Auto-fills: Name, Email, Address, VIP Status
3. Review/update details if needed
4. Next → Select today's date
5. Search rooms → Select room
6. Next → Skip payment (will pay at checkout)
7. Review → **"Check In Now"**

**Result**:
- ✅ Existing customer profile used
- ✅ New booking created
- ✅ Checked in immediately
- ✅ Payment pending (collect later)

---

## 🎨 User Interface Guide

### **Dashboard Buttons**

```
┌─────────────────────────────────────────────────────────┐
│  Admin Dashboard                                        │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ 🟢 Quick Check-In │  │ 🟣 Offline Booking│           │
│  │ Walk-in customer  │  │ Future booking    │           │
│  └──────────────────┘  └──────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

### **Modal Steps Progress**

```
Step 1: Customer → Step 2: Booking → Step 3: Payment → Step 4: Review
   ✓                  ✓                 ✓                (current)
```

### **Customer Step**
- Phone verification with auto-fill
- All customer details in one form
- Clear indication if existing customer

### **Booking Step**
- Date picker for check-in/out
- Room count selector
- **"Search Available Rooms"** button
- Visual room cards with:
  - Room type and description
  - Price breakdown
  - Total price
  - Available count badge
- Special requests textarea

### **Payment Step**
- Total booking amount display (prominent)
- Payment amount input (optional)
- Payment method dropdown
- Reference number field
- Status preview:
  - ✅ Fully paid → Auto-confirm message
  - ⚠️ Partial → Remaining balance shown

### **Review Step**
- Three summary cards:
  1. Customer Details
  2. Booking Details
  3. Payment Details
- Check-in mode indicator (if Quick Check-In)

---

## ⚠️ Important Notes

### **Validation & Constraints**
- ✅ Phone number required (minimum 10 digits)
- ✅ Customer name required
- ✅ Check-out date must be after check-in
- ✅ At least 1 room must be booked
- ✅ Room availability checked before booking
- ✅ Payment amount cannot exceed booking total
- ✅ Only rooms with availability shown

### **Payment Collection**
- Can record payment during booking creation
- Can record additional payments later using "Record Payment"
- Supports multiple partial payments
- Booking auto-confirms when fully paid

### **Check-In Behavior**
- **Quick Check-In**: Immediate check-in after booking
- **Offline Booking**: Manual check-in required later
- Use existing "Check In" button in bookings table when customer arrives

### **Customer Management**
- Existing customers: Details auto-filled, can be updated
- New customers: Created with MEMBER role automatically
- Phone number is unique identifier
- Profile marked as completed

---

## 🔧 Admin Actions After Booking

### **View Booking**
1. Find booking in dashboard table
2. Click dropdown (⋮) → "View Details"
3. See complete booking information

### **Record Additional Payment**
1. Find booking in table
2. Click dropdown → "Record Payment"
3. Enter payment details
4. Submit

### **Manual Check-In** (for Offline Bookings)
1. Find booking with status "Provisional"
2. Click **"Check In"** button
3. Add notes (optional)
4. Confirm check-in

### **Check-Out**
1. Find booking with status "Confirmed"
2. Click **"Check Out"** button
3. Add charges/discounts if any
4. Confirm check-out

---

## 📊 Reporting & Tracking

### **Audit Logs**
Every offline booking creates logs:
- Customer creation/update
- Booking creation with details
- Payment recording
- Check-in/out actions
- Admin who performed action

### **Payment Tracking**
- View in booking details modal
- Payment history with timestamps
- Payment summary (total, paid, remaining)
- Payment method recorded

### **Inventory Management**
- Rooms automatically blocked
- Real-time availability
- Prevents double booking

---

## ❓ Troubleshooting

### **"No rooms available" message**
- ✅ Try different dates
- ✅ Reduce number of rooms
- ✅ Check if rooms are actually booked for those dates

### **Phone verification not working**
- ✅ Ensure phone number is at least 10 digits
- ✅ Check internet connection
- ✅ Refresh and try again

### **Cannot create booking**
- ✅ Verify all required fields filled
- ✅ Ensure dates are valid (end after start)
- ✅ Check room availability

### **Payment amount validation error**
- ✅ Payment cannot be negative
- ✅ Payment cannot exceed total booking amount
- ✅ Use decimal format (e.g., 100.50)

---

## 🎯 Best Practices

### **For Walk-in Customers**
1. ✅ Use "Quick Check-In" for immediate occupancy
2. ✅ Collect at least partial payment upfront
3. ✅ Record ID details for security
4. ✅ Add any special requests in notes

### **For Phone Bookings**
1. ✅ Use "Offline Booking" for future dates
2. ✅ Collect deposit if possible
3. ✅ Note down reference numbers
4. ✅ Confirm dates and room type with customer

### **For Existing Customers**
1. ✅ Always verify phone first to avoid duplicates
2. ✅ Update any changed details
3. ✅ Note their VIP status

### **Payment Management**
1. ✅ Always record payment method
2. ✅ Keep reference numbers for card/bank transfers
3. ✅ Note who received the payment (auto-tracked)
4. ✅ Collect remaining payment before check-out

---

## 🔐 Security & Authorization

- ✅ Only **Admin** and **SuperAdmin** can access
- ✅ All actions logged with admin name
- ✅ Customer data validated
- ✅ Payment records immutable
- ✅ Audit trail maintained

---

## 📞 Support

### **Common Questions**

**Q: Can I edit a booking after creation?**
A: Use existing booking management features (check-in, check-out, payment recording)

**Q: What if customer pays later?**
A: Leave payment empty during booking, use "Record Payment" when they pay

**Q: How do I handle group bookings?**
A: Set "Number of Rooms" to desired count, system handles inventory

**Q: Can I cancel offline bookings?**
A: Yes, use existing cancellation features in booking management

**Q: What happens to payment if booking is cancelled?**
A: Follow standard refund procedures through booking management

---

## ✅ Summary

**Quick Check-In Flow**:
```
Enter Customer → Select Room → Record Payment → Check In Immediately
```

**Offline Booking Flow**:
```
Enter Customer → Select Room → Record Payment (optional) → Create Booking → Check In Later
```

**Key Benefits**:
- ✅ No customer login required
- ✅ Fast walk-in handling
- ✅ Complete payment tracking
- ✅ Automatic room management
- ✅ Full audit trail
- ✅ Supports existing customers
- ✅ Flexible payment options

---

**Version**: 1.0.0
**Last Updated**: October 26, 2025
**Access Level**: Admin + SuperAdmin Only
