# 🧠 GitHub Copilot Instructions
**Project:** Hotel Booking Engine (Next.js + TypeScript + Server Actions + Prisma + Zod + Tailwind + Auth.js + Zustand + Redux)

---

## 🎯 Goal
Guide Copilot to generate **production-grade, type-safe, modular** code for a hotel booking platform consisting of:
- **Member Portal:** OTP login, profile, booking calendar, waitlist, payments  
- **Admin Dashboard:** room inventory, offline payments, booking management  
- **Super Admin Dashboard:** rule setup, reports, overrides, bulk communication  
- **Backend:** All logic via Next.js **Server Actions**, **Prisma ORM**, and **Zod validation**

---

## 🧩 Core Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend | Next.js Server Actions (no route handlers) |
| DB | PostgreSQL + Prisma |
| Auth | Auth.js (NextAuth) for RBAC |
| Validation | Zod (separate schema files) |
| State Management | Zustand (UI) + Redux Toolkit (app state) |
| Styling | Tailwind + ShadCN UI components |
| Communication | WhatsApp API + Email (stub) |
| Payment | Razorpay/Stripe (sandbox) |
| Notifications | Server-side cron or edge functions |
| Language | TypeScript only |

---

## 📁 Folder Structure
Copilot should always follow this structure and generate files accordingly:



---

## 🧠 Copilot Behavior Guidelines

### 1️⃣ Code Style
- Use **TypeScript** everywhere.
- Always import types using `import type { ... }`.
- Prefer **async/await**.
- Use **ESLint + Prettier conventions** (2-space indent, semi: true, single quotes).
- For Tailwind, use **semantic, composable utility classes** (avoid long chains).

### 2️⃣ Server Actions
- Use server actions instead of API routes.
- Every server action must:
  - Be declared in `src/actions/<domain>/<action>.ts`
  - Use `'use server'` at the top.
  - Validate inputs with Zod.
  - Handle Prisma transactions safely.
  - Return standardized results:
    ```ts
    type ActionResponse<T> = { success: boolean; data?: T; error?: string };
    ```
  - Example:
    ```ts
    'use server';
    import { prisma } from '@/lib/prisma';
    import { z } from 'zod';
    import { bookingSchema } from '@/lib/validation/booking';

    export async function createBookingAction(input: z.infer<typeof bookingSchema>) {
      const parsed = bookingSchema.safeParse(input);
      if (!parsed.success) return { success: false, error: 'Invalid data' };

      try {
        const booking = await prisma.booking.create({ data: parsed.data });
        return { success: true, data: booking };
      } catch (err) {
        console.error(err);
        return { success: false, error: 'Database error' };
      }
    }
    ```

### 3️⃣ Prisma + DB Models
- Each model in `schema.prisma` must have corresponding:
  - Zod schema in `lib/validation/<model>.ts`
  - TypeScript type in `types/<model>.d.ts`
- Example:
  ```prisma
  model Booking {
    id          String   @id @default(cuid())
    userId      String
    roomTypeId  String
    startDate   DateTime
    endDate     DateTime
    totalAmount Float
    status      String   @default("PENDING")
    createdAt   DateTime @default(now())
  }
