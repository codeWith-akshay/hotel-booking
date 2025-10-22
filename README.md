# Hotel Booking App

A modern hotel booking application built with Next.js 14, TypeScript, Prisma, and Tailwind CSS. This application provides a complete hotel management system with role-based access control, booking management, and real-time notifications.

## Features

- **Role-based Access Control**: Super Admin, Admin, and Member roles
- **Booking Management**: Complete booking lifecycle from reservation to check-out
- **Room Management**: Room inventory, pricing, and availability tracking
- **Payment Processing**: Multiple payment methods and transaction tracking
- **User Profiles**: Membership types and preference management
- **Notification System**: Multi-channel notifications (email, SMS, push, in-app)
- **Audit Logging**: Complete activity tracking
- **Bulk Messaging**: Mass communication capabilities
- **Waitlist Management**: Auto-notify when rooms become available
- **Dynamic Rules Engine**: Configurable business rules
- **Responsive Design**: Mobile-first responsive UI

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **State Management**: Zustand, Redux Toolkit
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS with CSS Variables
- **Development**: ESLint, TypeScript strict mode

## Project Structure

```
src/
├── app/
│   ├── (member)/           # Member-only routes
│   │   ├── login/
│   │   ├── profile/
│   │   └── booking/
│   ├── (admin)/            # Admin-only routes
│   │   ├── dashboard/
│   │   └── bookings/
│   ├── (superadmin)/       # Super Admin routes
│   │   ├── rules/
│   │   ├── reports/
│   │   └── communication/
│   ├── layout.tsx
│   └── page.tsx
├── actions/                # Server actions
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── forms/              # Form components
│   ├── booking/            # Booking-specific components
│   └── dashboard/          # Dashboard components
├── hooks/                  # Custom React hooks
├── lib/
│   ├── validation/         # Zod schemas
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # Authentication utilities
│   ├── rbac.ts            # Role-based access control
│   └── utils.ts           # Utility functions
├── store/                  # State management
├── types/                  # TypeScript type definitions
└── styles/
    └── globals.css
```

## Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users & Roles**: User management with role-based permissions
- **Rooms & Inventory**: Room types, pricing, and availability
- **Bookings**: Complete booking lifecycle
- **Payments & Invoices**: Financial transaction tracking
- **Notifications**: Multi-channel messaging system
- **Audit Logs**: Activity tracking and compliance
- **System Settings**: Configurable application settings

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use the provided Neon database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hotel-booking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="your-postgresql-connection-string"
   
   # Auth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # App
   NODE_ENV="development"
   ```

4. **Database Setup**
   
   Generate Prisma client:
   ```bash
   npx prisma generate
   ```
   
   Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
   
   (Optional) Seed the database:
   ```bash
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply new migration
- `npx prisma generate` - Generate Prisma client
- `npx prisma db seed` - Seed the database

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for session encryption | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## Database Commands

```bash
# View database in browser
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration-name

# Reset database (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Generate Prisma client after schema changes
npx prisma generate
```

## API Routes

The application provides RESTful API endpoints for:

- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management
- `/api/rooms/*` - Room management
- `/api/bookings/*` - Booking operations
- `/api/payments/*` - Payment processing
- `/api/notifications/*` - Notification system

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Docker

```dockerfile
# Dockerfile included for containerized deployment
docker build -t hotel-booking .
docker run -p 3000:3000 hotel-booking
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the API documentation in `/api-docs`
