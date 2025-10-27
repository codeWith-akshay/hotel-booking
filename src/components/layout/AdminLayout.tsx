/**
 * Admin Layout Component
 * Professional admin dashboard layout with advanced features
 * - Responsive sidebar with nested navigation
 * - Breadcrumbs navigation
 * - Quick stats bar
 * - Action buttons bar
 * - Mobile-optimized drawer
 * - Dark mode support ready
 */

'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Hotel, 
  Settings, 
  FileText,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  Home,
  Package,
  ClipboardList,
  Radio,
  LogOut,
  UserCircle
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string | number
  children?: { label: string; href: string }[]
}

// ==========================================
// NAVIGATION CONFIGURATION
// ==========================================

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Bookings',
    href: '/admin/bookings',
    icon: <CalendarDays className="w-5 h-5" />,
  },
  {
    label: 'Room Types',
    href: '/admin/rooms',
    icon: <Hotel className="w-5 h-5" />,
  },
  {
    label: 'Inventory',
    href: '/admin/inventory',
    icon: <Package className="w-5 h-5" />,
  },
  {
    label: 'Waitlist',
    href: '/admin/waitlist',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    label: 'Broadcast',
    href: '/admin/broadcast',
    icon: <Radio className="w-5 h-5" />,
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: <FileText className="w-5 h-5" />,
  },
]

// ==========================================
// ADMIN LAYOUT COMPONENT
// ==========================================

export default function AdminLayout({
  children,
  title,
  subtitle,
  actions,
  breadcrumbs,
}: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // ==========================================
  // RESPONSIVE BEHAVIOR
  // ==========================================
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
        setMobileMenuOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Search:', searchQuery)
    // Implement search functionality
  }

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen)
    } else {
      setSidebarOpen(!sidebarOpen)
    }
  }

  // ==========================================
  // AUTO BREADCRUMBS
  // ==========================================
  const autoBreadcrumbs = breadcrumbs || generateBreadcrumbs(pathname)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========================================== */}
      {/* TOP HEADER BAR */}
      {/* ========================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section: Menu + Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-2">
                <Hotel className="w-8 h-8 text-blue-600" />
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">Hotel Admin</h1>
                </div>
              </div>
            </div>

            {/* Center Section: Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search bookings, guests, rooms..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </form>
            </div>

            {/* Right Section: Notifications + Profile */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{user?.role || 'Administrator'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ========================================== */}
        {/* SIDEBAR NAVIGATION */}
        {/* ========================================== */}
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:block fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
            sidebarOpen ? 'w-64' : 'w-0'
          } overflow-hidden`}
        >
          <nav className="p-4 space-y-1 h-full overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={isActive ? 'text-blue-600' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 lg:hidden overflow-y-auto">
              <nav className="p-4 space-y-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        router.push(item.href)
                        setMobileMenuOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item.icon}
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </aside>
          </>
        )}

        {/* ========================================== */}
        {/* MAIN CONTENT AREA */}
        {/* ========================================== */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen && !isMobile ? 'lg:ml-64' : ''
          }`}
        >
          {/* Breadcrumbs */}
          {autoBreadcrumbs.length > 0 && (
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
              <nav className="flex items-center space-x-2 text-sm">
                {autoBreadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />}
                    {crumb.href ? (
                      <button
                        onClick={() => router.push(crumb.href!)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-gray-900 font-medium">{crumb.label}</span>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          )}

          {/* Page Header */}
          {(title || actions) && (
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
                  {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: { label: string; href?: string }[] = [
    { label: 'Admin', href: '/admin/dashboard' },
  ]

  let currentPath = ''
  segments.slice(1).forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 2
    
    breadcrumbs.push({
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      ...(isLast ? {} : { href: `/admin${currentPath}` }),
    })
  })

  return breadcrumbs
}
