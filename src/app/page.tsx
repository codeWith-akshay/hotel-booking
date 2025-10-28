// ==========================================
// HOME PAGE - Landing Page
// ==========================================
// Main landing page for the hotel booking application

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Link from 'next/link'
import { 
  Building2, Calendar, Users, Shield, ArrowRight, Loader2, 
  Star, CheckCircle, Sparkles, TrendingUp, Clock, MapPin,
  Award, Heart, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Wait for Zustand to rehydrate from localStorage
    if (!_hasHydrated) {
      return
    }

    // Redirect authenticated users to their appropriate dashboard
    if (isAuthenticated && user) {
      const role = user.role
      
      if (role === 'ADMIN' || role === 'SUPERADMIN') {
        router.push('/admin/dashboard')
      } else if (role === 'MEMBER') {
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, user, _hasHydrated, router])

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  const stats = [
    { number: '10K+', label: 'Happy Guests', icon: Users },
    { number: '500+', label: 'Luxury Rooms', icon: Building2 },
    { number: '4.9', label: 'Average Rating', icon: Star },
    { number: '24/7', label: 'Support', icon: Clock },
  ]

  const features = [
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Book your perfect room in just a few clicks with our intuitive booking system.',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: Users,
      title: 'Member Benefits',
      description: 'Join as a member to unlock exclusive deals and manage your bookings easily.',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: Shield,
      title: 'Secure & Safe',
      description: 'Your data and payments are protected with industry-leading security measures.',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: Award,
      title: 'Premium Quality',
      description: 'Experience luxury accommodations with 5-star amenities and exceptional service.',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600'
    },
    {
      icon: Heart,
      title: 'Best Prices',
      description: 'Get the best rates guaranteed with our price match promise and exclusive offers.',
      color: 'from-rose-500 to-red-500',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600'
    },
    {
      icon: Zap,
      title: 'Instant Confirmation',
      description: 'Receive immediate booking confirmation and access to your reservation details.',
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600'
    },
  ]

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-20 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        />
        <div 
          className="absolute top-40 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
        <div 
          className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"
          style={{ transform: `translateY(${scrollY * -0.2}px)` }}
        />
      </div>

      {/* Hero Section */}
      <div className="relative container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center mb-8 animate-fade-in">
            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative w-20 h-20 bg-linear-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                <Building2 className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Main Heading with Animation */}
          <div className="text-center space-y-6 mb-12 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-4">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                #1 Hotel Booking Platform
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 leading-tight">
              Your Perfect
              <span className="block mt-2 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                Stay Awaits
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Book luxury rooms, manage reservations, and enjoy a seamless hospitality experience with our cutting-edge platform.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up animation-delay-200">
            <Link href="/rooms">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Browse Rooms
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 hover:bg-gray-50 transform hover:-translate-y-1 transition-all">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 animate-slide-up animation-delay-400">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <stat.icon className="w-8 h-8 text-blue-600 mb-3" />
                  <p className="text-3xl md:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                    {stat.number}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                Why Choose Us?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Experience the difference with our premium features designed for your comfort
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-linear-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                  
                  {/* Icon */}
                  <div className={`relative w-14 h-14 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-7 h-7 ${feature.iconColor}`} strokeWidth={2} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Hover Effect Arrow */}
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                    <ArrowRight className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="relative bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 md:p-16 text-center overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/10 bg-size-[20px_20px]"></div>
            <div className="relative">
              <Sparkles className="w-12 h-12 text-white/80 mx-auto mb-6 animate-pulse" />
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied guests and experience luxury like never before
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-white text-blue-600 hover:bg-gray-50 shadow-xl">
                    Get Started Free
                    <TrendingUp className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/rooms">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold border-2 border-white text-white hover:bg-white/10">
                    Explore Rooms
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Links Footer */}
          <div className="mt-20 pt-12 border-t border-gray-200">
            <p className="text-gray-500 text-sm mb-6 text-center">Quick Access</p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/rooms" className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                View Rooms
              </Link>
              <Link href="/login" className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Sign In
              </Link>
              <Link href="/privacy" className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Animations */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
          animation-fill-mode: both;
        }
        
        .bg-grid-white\/10 {
          background-image: linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
        }
      `}</style>
    </div>
  )
}
