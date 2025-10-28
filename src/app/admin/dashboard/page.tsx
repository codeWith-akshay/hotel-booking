'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import Header from '@/components/layout/Header';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/auth.store';
import { 
  getAdminDashboardStats, 
  getRecentBookings,
  getRevenueData,
  type DashboardStats,
  type RecentBooking
} from '@/actions/admin/dashboard.action';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Hotel,
  CreditCard,
  Activity,
  BarChart3,
  PieChart,
  Eye,
  RefreshCw,
  Download,
  MoreVertical,
  LogIn,
  LogOut,
  Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import type { BookingStatus, PaymentStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import EnhancedBookingManagementModal from '@/components/admin/EnhancedBookingManagementModal';
import OfflineBookingModal from '@/components/admin/OfflineBookingModal';

// ==========================================
// TYPES
// ==========================================

interface RevenueDataPoint {
  date: string;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  bookingCount: number;
}

// ==========================================
// STATUS BADGE COMPONENT
// ==========================================

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const variants: Record<BookingStatus, { color: string; label: string }> = {
    PROVISIONAL: { color: 'bg-yellow-100 text-yellow-800', label: 'Provisional' },
    CONFIRMED: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
    CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    CHECKED_IN: { color: 'bg-green-100 text-green-800', label: 'Checked In' },
    CHECKED_OUT: { color: 'bg-purple-100 text-purple-800', label: 'Checked Out' },
    COMPLETED: { color: 'bg-gray-100 text-gray-800', label: 'Completed' }
  };

  const variant = variants[status] || { color: 'bg-gray-100 text-gray-800', label: status };
  
  return (
    <Badge className={`${variant.color} border-0`}>
      {variant.label}
    </Badge>
  );
};

const PaymentBadge = ({ status }: { status: PaymentStatus }) => {
  const variants: Record<PaymentStatus, { color: string; label: string }> = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    SUCCEEDED: { color: 'bg-green-100 text-green-800', label: 'Succeeded' },
    FAILED: { color: 'bg-red-100 text-red-800', label: 'Failed' },
    REFUNDED: { color: 'bg-purple-100 text-purple-800', label: 'Refunded' },
    CANCELLED: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
  };

  const variant = variants[status] || { color: 'bg-gray-100 text-gray-800', label: status };
  
  return (
    <Badge className={`${variant.color} border-0`}>
      {variant.label}
    </Badge>
  );
};

// ==========================================
// ANIMATED STAT CARD COMPONENT
// ==========================================

interface AnimatedStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  gradient: string;
  delay?: number;
}

const AnimatedStatCard = ({ title, value, icon, trend, subtitle, gradient, delay = 0 }: AnimatedStatCardProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl p-8 shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{
        background: gradient,
      }}
    >
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-linear-to-br from-white/50 to-transparent transform rotate-45 translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="p-4 bg-white/30 backdrop-blur-lg rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
            <div className="text-white">{icon}</div>
          </div>
          {trend && (
            <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
              trend.isPositive ? 'bg-green-500/30 text-green-100 backdrop-blur-sm' : 'bg-red-500/30 text-red-100 backdrop-blur-sm'
            }`}>
              {trend.isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        
        <div className="text-white">
          <div className="text-5xl font-extrabold mb-2 group-hover:scale-105 transition-transform duration-300 tracking-tight">
            {value}
          </div>
          <div className="text-white/90 text-base font-semibold mb-2">
            {title}
          </div>
          {subtitle && (
            <div className="text-white/70 text-sm font-medium">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AdminDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [bookingMeta, setBookingMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal state
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'check-in' | 'check-out' | 'payment' | 'details'>('details');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Offline booking modal state
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isQuickCheckInMode, setIsQuickCheckInMode] = useState(false);

  // Booking filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus[]>([]);
  const [sortBy, setSortBy] = useState<'createdAt' | 'startDate' | 'totalPrice'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsResult, bookingsResult, revenueResult] = await Promise.all([
        getAdminDashboardStats(),
        getRecentBookings(10, {
          searchTerm: searchTerm || undefined,
          status: statusFilter.length > 0 ? statusFilter : undefined,
          paymentStatus: paymentFilter.length > 0 ? paymentFilter : undefined,
          sortBy,
          sortOrder,
        }),
        getRevenueData(30)
      ]);

      if (!statsResult.success) {
        throw new Error(statsResult.error || 'Failed to fetch dashboard stats');
      }

      if (!bookingsResult.success) {
        throw new Error(bookingsResult.error || 'Failed to fetch recent bookings');
      }

      if (!revenueResult.success) {
        throw new Error(revenueResult.error || 'Failed to fetch revenue data');
      }

      setStats(statsResult.data || null);
      setRecentBookings(bookingsResult.data || []);
      setBookingMeta(bookingsResult.meta);
      setRevenueData(revenueResult.data || []);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [searchTerm, statusFilter, paymentFilter, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const openBookingModal = (bookingId: string, mode: 'check-in' | 'check-out' | 'payment' | 'details' = 'details') => {
    console.log('[Dashboard] Opening booking modal:', bookingId, 'mode:', mode)
    setSelectedBookingId(bookingId);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsModalOpen(false);
    setSelectedBookingId(null);
  };

  const handleModalSuccess = () => {
    fetchDashboardData(); // Refresh data after successful operation
  };

  const openOfflineBookingModal = (quickCheckIn: boolean = false) => {
    setIsQuickCheckInMode(quickCheckIn);
    setIsOfflineModalOpen(true);
  };

  const closeOfflineModal = () => {
    setIsOfflineModalOpen(false);
    setIsQuickCheckInMode(false);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <AdminLayout
        title="Dashboard"
        subtitle="Welcome to your admin dashboard"
      >
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping" />
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-2">Loading Dashboard</p>
            <p className="text-sm text-gray-500">Fetching latest data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !stats) {
    return (
      <AdminLayout
        title="Dashboard"
        subtitle="Welcome to your admin dashboard"
      >
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
              <p className="text-red-600">{error || 'Failed to load dashboard data'}</p>
            </div>
          </div>
          <button 
            onClick={handleRefresh}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  // Prepare chart data
  const revenueChartData = revenueData.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: d.totalRevenue / 100,
    paid: d.paidRevenue / 100,
    pending: d.pendingRevenue / 100,
  }));

  // Booking status distribution
  // Booking status distribution
  const statusData = [
    { name: 'Confirmed', value: stats.totalBookings - stats.pendingBookings - stats.cancelledToday, color: '#10b981' },
    { name: 'Pending', value: stats.pendingBookings, color: '#f59e0b' },
    { name: 'Cancelled', value: stats.cancelledToday, color: '#ef4444' },
  ];

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <>
        {/* Header at the top */}
        <Header
          user={{
            name: user?.name || 'Admin',
            email: user?.email || user?.phone || '',
            role: user?.role || 'ADMIN',
          }}
          onLogout={handleLogout}
          showNotifications={true}
          notificationsCount={0}
          onNotificationClick={() => router.push('/admin/notifications')}
          showSidebarToggle={false}
        />
        
        <AdminLayout>
          <div className="space-y-8 pb-12 relative">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-20 right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
              <div className="absolute top-40 left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
              <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
            </div>

            {/* Header Actions */}
            <div className="flex items-center justify-between relative z-10">
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
              Welcome Back, {user?.name || 'Admin'}
            </h1>
            <p className="text-gray-600 text-lg font-medium flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Here's what's happening with your hotel today
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => openOfflineBookingModal(true)}
              className="group flex items-center gap-2 px-6 py-4 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <LogIn className="h-5 w-5 relative z-10" />
              <span className="font-bold relative z-10">Quick Check-In</span>
            </button>
            <button
              onClick={() => openOfflineBookingModal(false)}
              className="group flex items-center gap-2 px-6 py-4 bg-linear-to-r from-purple-500 to-pink-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Users className="h-5 w-5 relative z-10" />
              <span className="font-bold relative z-10">Offline Booking</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="group flex items-center gap-2 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-purple-500 hover:shadow-xl transition-all duration-300 disabled:opacity-50 hover:-translate-y-1"
            >
              <RefreshCw className={`h-5 w-5 text-purple-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-bold text-gray-700">Refresh</span>
            </button>
            <button className="group flex items-center gap-2 px-6 py-4 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Download className="h-5 w-5 relative z-10" />
              <span className="font-bold relative z-10">Export Report</span>
            </button>
          </div>
        </div>

        {/* Animated Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          <AnimatedStatCard
            title="Total Revenue"
            value={formatCurrency(stats.revenue)}
            icon={<DollarSign className="h-8 w-8" />}
            subtitle={`Avg: ${formatCurrency(stats.avgBookingValue)}/booking`}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            trend={{ value: 12.5, isPositive: true }}
            delay={0}
          />
          <AnimatedStatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={<Calendar className="h-8 w-8" />}
            subtitle={`${stats.pendingBookings} pending`}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            trend={{ value: 8.2, isPositive: true }}
            delay={100}
          />
          <AnimatedStatCard
            title="Occupancy Rate"
            value={`${stats.occupancyRate.toFixed(1)}%`}
            icon={<Hotel className="h-8 w-8" />}
            subtitle={`${stats.bookedRooms}/${stats.totalRooms} rooms`}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            trend={{ value: 3.1, isPositive: true }}
            delay={200}
          />
          <AnimatedStatCard
            title="Today's Check-ins"
            value={stats.todayCheckIns}
            icon={<CheckCircle className="h-8 w-8" />}
            subtitle={`${stats.todayCheckOuts} check-outs`}
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            trend={{ value: 5.4, isPositive: true }}
            delay={300}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {/* Revenue Trend Chart */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/80">
              <CardHeader className="bg-linear-to-r from-blue-50 via-purple-50 to-pink-50 border-b-2 border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                      <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
                        <BarChart3 className="h-7 w-7 text-white" />
                      </div>
                      Revenue Trend
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2 ml-16 font-medium">Last 30 days performance overview</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 pb-6">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: '600' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px', fontWeight: '600' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                        padding: '12px'
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#667eea" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Booking Status Distribution */}
          <div>
            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden h-full backdrop-blur-sm bg-white/80">
              <CardHeader className="bg-linear-to-r from-purple-50 via-pink-50 to-orange-50 border-b-2 border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                      <div className="p-3 bg-purple-600 rounded-2xl shadow-lg">
                        <PieChart className="h-7 w-7 text-white" />
                      </div>
                      Status
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2 ml-16 font-medium">Distribution</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 pb-6">
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const { name, percent } = props;
                        return `${name} ${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={85}
                      fill="#8884d8"
                      dataKey="value"
                      strokeWidth={3}
                      stroke="#fff"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 15px 30px rgba(0,0,0,0.15)',
                        padding: '8px 12px'
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="mt-6 space-y-3 px-2">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full shadow-md" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-bold text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-extrabold text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <Card className="group border-0 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm bg-white/80">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <Badge className="bg-green-100 text-green-800 border-0 font-bold text-xs px-4 py-2 shadow-sm">Active</Badge>
              </div>
              <div className="text-4xl font-extrabold text-gray-900 mb-2">
                {formatCurrency(revenueData.reduce((sum, d) => sum + d.paidRevenue, 0) / 100)}
              </div>
              <div className="text-sm text-gray-600 font-semibold mb-6">Paid Revenue (30 days)</div>
              <div className="mt-6 h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-linear-to-r from-green-500 via-green-600 to-emerald-500 rounded-full transition-all duration-1000 shadow-lg"
                  style={{ 
                    width: `${(revenueData.reduce((sum, d) => sum + d.paidRevenue, 0) / revenueData.reduce((sum, d) => sum + d.totalRevenue, 0)) * 100}%` 
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm bg-white/80">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-linear-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 border-0 font-bold text-xs px-4 py-2 shadow-sm">Pending</Badge>
              </div>
              <div className="text-4xl font-extrabold text-gray-900 mb-2">
                {formatCurrency(revenueData.reduce((sum, d) => sum + d.pendingRevenue, 0) / 100)}
              </div>
              <div className="text-sm text-gray-600 font-semibold mb-6">Pending Revenue (30 days)</div>
              <div className="mt-6 h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-linear-to-r from-yellow-500 via-yellow-600 to-orange-500 rounded-full transition-all duration-1000 shadow-lg"
                  style={{ 
                    width: `${(revenueData.reduce((sum, d) => sum + d.pendingRevenue, 0) / revenueData.reduce((sum, d) => sum + d.totalRevenue, 0)) * 100}%` 
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="group border-0 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm bg-white/80">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-0 font-bold text-xs px-4 py-2 shadow-sm">Total</Badge>
              </div>
              <div className="text-4xl font-extrabold text-gray-900 mb-2">
                {revenueData.reduce((sum, d) => sum + d.bookingCount, 0)}
              </div>
              <div className="text-sm text-gray-600 font-semibold mb-6">Total Bookings (30 days)</div>
              <div className="mt-6 flex items-center gap-2 text-sm">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-green-600 font-extrabold text-lg">+15.3%</span>
                <span className="text-gray-500 font-medium">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings Table - Enhanced Professional Version */}
        <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-linear-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-purple-600" />
                  Recent Bookings
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Manage reservations, check-ins, and payments
                  {bookingMeta && (
                    <span className="ml-2 text-blue-600 font-semibold">
                      • {bookingMeta.total} total • {bookingMeta.pendingCheckIn} pending check-in
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-all duration-200 hover:shadow-md disabled:opacity-50"
                >
                  <RefreshCw className={cn("h-4 w-4 text-purple-600", refreshing && "animate-spin")} />
                  <span className="text-sm font-medium text-gray-700">Refresh</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">View All</span>
                </button>
              </div>
            </div>

            {/* Advanced Filters and Search */}
            <div className="mt-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by booking ID, guest name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 h-11 bg-white border-2 border-gray-200 focus:border-purple-500 rounded-lg"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Activity className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Filters:</span>
                
                {/* Status Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "border-2 hover:border-purple-500 transition-colors",
                        statusFilter.length > 0 && "border-purple-500 bg-purple-50"
                      )}
                    >
                      <Badge className="h-4 w-4 mr-2" />
                      Status {statusFilter.length > 0 && `(${statusFilter.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <div className="p-2 space-y-2">
                      {['PROVISIONAL', 'CONFIRMED', 'CANCELLED'].map((status) => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={statusFilter.includes(status as BookingStatus)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStatusFilter([...statusFilter, status as BookingStatus])
                              } else {
                                setStatusFilter(statusFilter.filter(s => s !== status))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{status}</span>
                        </label>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Payment Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "border-2 hover:border-green-500 transition-colors",
                        paymentFilter.length > 0 && "border-green-500 bg-green-50"
                      )}
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Payment {paymentFilter.length > 0 && `(${paymentFilter.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <div className="p-2 space-y-2">
                      {['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'].map((status) => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={paymentFilter.includes(status as PaymentStatus)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPaymentFilter([...paymentFilter, status as PaymentStatus])
                              } else {
                                setPaymentFilter(paymentFilter.filter(s => s !== status))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{status}</span>
                        </label>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort By */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-')
                    setSortBy(newSortBy as any)
                    setSortOrder(newSortOrder as any)
                  }}
                  className="px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <option value="createdAt-desc">Latest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="startDate-desc">Check-in Date (Latest)</option>
                  <option value="startDate-asc">Check-in Date (Earliest)</option>
                  <option value="totalPrice-desc">Amount (High to Low)</option>
                  <option value="totalPrice-asc">Amount (Low to High)</option>
                </select>

                {/* Clear Filters */}
                {(statusFilter.length > 0 || paymentFilter.length > 0 || searchTerm) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter([])
                      setPaymentFilter([])
                      setSearchTerm('')
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {recentBookings.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-medium mb-2">No bookings found</p>
                <p className="text-sm">
                  {searchTerm || statusFilter.length > 0 || paymentFilter.length > 0
                    ? 'Try adjusting your filters'
                    : 'Create your first booking to get started'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Booking
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Room & Dates
                      </th>
                      <th className="text-right py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentBookings.map((booking, index) => (
                      <tr 
                        key={booking.id} 
                        className="hover:bg-linear-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer group"
                        style={{ 
                          animation: `fadeIn 0.4s ease-in-out ${index * 0.05}s both` 
                        }}
                        onClick={() => openBookingModal(booking.id, 'details')}
                      >
                        {/* Booking Info */}
                        <td className="py-5 px-6">
                          <div className="space-y-1">
                            <span className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2">
                              #{booking.bookingNumber}
                              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                            <p className="text-xs text-gray-500">
                              {format(new Date(booking.createdAt), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                        </td>

                        {/* Guest Info */}
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                                {booking.guestName.charAt(0)}
                              </div>
                              {booking.hasCheckedIn && !booking.hasCheckedOut && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white" title="Checked In" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 text-sm truncate">
                                {booking.guestName}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {booking.guestEmail || booking.guestPhone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Room & Dates */}
                        <td className="py-5 px-6">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              <Hotel className="h-4 w-4 text-purple-600" />
                              {booking.roomType}
                            </p>
                            <p className="text-xs text-gray-600">
                              {format(new Date(booking.checkIn), 'MMM dd')} → {format(new Date(booking.checkOut), 'MMM dd')}
                              <span className="ml-2 text-blue-600 font-medium">({booking.nights} nights)</span>
                            </p>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-5 px-6 text-right">
                          <div className="space-y-1">
                            <span className="text-base font-bold text-gray-900">
                              {formatCurrency(booking.amount)}
                            </span>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(booking.amount / booking.nights)}/night
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-5 px-6">
                          <div className="flex flex-col items-center gap-2">
                            <StatusBadge status={booking.status} />
                            <PaymentBadge status={booking.paymentStatus} />
                            {booking.hasCheckedIn && (
                              <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                In-House
                              </Badge>
                            )}
                            {booking.hasCheckedOut && (
                              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                                <LogOut className="h-3 w-3 mr-1" />
                                Checked Out
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-5 px-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            {/* Quick Action Buttons */}
                            {booking.status === 'PROVISIONAL' && !booking.hasCheckedIn && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openBookingModal(booking.id, 'check-in')
                                }}
                                className="bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all"
                              >
                                <LogIn className="h-3 w-3 mr-1" />
                                Check In
                              </Button>
                            )}
                            {booking.status === 'CONFIRMED' && booking.hasCheckedIn && !booking.hasCheckedOut && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openBookingModal(booking.id, 'check-out')
                                }}
                                className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all"
                              >
                                <LogOut className="h-3 w-3 mr-1" />
                                Check Out
                              </Button>
                            )}
                            
                            {/* More Options Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 w-9 p-0 border-2 hover:border-purple-500 hover:bg-purple-50 transition-colors"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => openBookingModal(booking.id, 'details')}>
                                  <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                  View Details
                                </DropdownMenuItem>
                                {booking.status !== 'CANCELLED' && booking.paymentStatus !== 'SUCCEEDED' && (
                                  <DropdownMenuItem onClick={() => openBookingModal(booking.id, 'payment')}>
                                    <Wallet className="h-4 w-4 mr-2 text-green-600" />
                                    Record Payment
                                  </DropdownMenuItem>
                                )}
                                {booking.status === 'PROVISIONAL' && !booking.hasCheckedIn && (
                                  <DropdownMenuItem onClick={() => openBookingModal(booking.id, 'check-in')}>
                                    <LogIn className="h-4 w-4 mr-2 text-green-600" />
                                    Check In
                                  </DropdownMenuItem>
                                )}
                                {booking.status === 'CONFIRMED' && booking.hasCheckedIn && !booking.hasCheckedOut && (
                                  <DropdownMenuItem onClick={() => openBookingModal(booking.id, 'check-out')}>
                                    <LogOut className="h-4 w-4 mr-2 text-blue-600" />
                                    Check Out
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2 text-purple-600" />
                                  Download Receipt
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Summary - Enhanced */}
        {revenueData.length > 0 && (
          <Card className="relative border-0 shadow-2xl rounded-3xl overflow-hidden bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 z-10">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-size-[20px_20px]" style={{
                backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)'
              }} />
            </div>
            
            {/* Floating Orbs */}
            <div className="absolute top-10 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-10 left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            
            <CardContent className="p-10 relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-extrabold text-white mb-2">30-Day Performance Overview</h3>
                <p className="text-white/80 text-sm font-medium">Comprehensive revenue and booking statistics</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                <div className="group text-center p-6 bg-white/10 backdrop-blur-lg rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <div className="text-white/90 text-sm font-bold mb-3 uppercase tracking-wide">Total Revenue</div>
                  <div className="text-4xl font-extrabold text-white mb-2 group-hover:scale-110 transition-transform">
                    {formatCurrency(revenueData.reduce((sum, d) => sum + d.totalRevenue, 0) / 100)}
                  </div>
                  <div className="h-1 w-16 mx-auto bg-white/50 rounded-full" />
                </div>
                
                <div className="group text-center p-6 bg-white/10 backdrop-blur-lg rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <div className="text-white/90 text-sm font-bold mb-3 uppercase tracking-wide">Paid Revenue</div>
                  <div className="text-4xl font-extrabold text-white mb-2 group-hover:scale-110 transition-transform">
                    {formatCurrency(revenueData.reduce((sum, d) => sum + d.paidRevenue, 0) / 100)}
                  </div>
                  <div className="h-1 w-16 mx-auto bg-green-400 rounded-full" />
                </div>
                
                <div className="group text-center p-6 bg-white/10 backdrop-blur-lg rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <div className="text-white/90 text-sm font-bold mb-3 uppercase tracking-wide">Pending Revenue</div>
                  <div className="text-4xl font-extrabold text-white mb-2 group-hover:scale-110 transition-transform">
                    {formatCurrency(revenueData.reduce((sum, d) => sum + d.pendingRevenue, 0) / 100)}
                  </div>
                  <div className="h-1 w-16 mx-auto bg-yellow-400 rounded-full" />
                </div>
                
                <div className="group text-center p-6 bg-white/10 backdrop-blur-lg rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <div className="text-white/90 text-sm font-bold mb-3 uppercase tracking-wide">Total Bookings</div>
                  <div className="text-4xl font-extrabold text-white mb-2 group-hover:scale-110 transition-transform">
                    {revenueData.reduce((sum, d) => sum + d.bookingCount, 0)}
                  </div>
                  <div className="h-1 w-16 mx-auto bg-blue-400 rounded-full" />
                </div>
                
                <div className="group text-center p-6 bg-white/10 backdrop-blur-lg rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <div className="text-white/90 text-sm font-bold mb-3 uppercase tracking-wide">Avg Daily Revenue</div>
                  <div className="text-4xl font-extrabold text-white mb-2 group-hover:scale-110 transition-transform">
                    {formatCurrency(revenueData.reduce((sum, d) => sum + d.totalRevenue, 0) / revenueData.length / 100)}
                  </div>
                  <div className="h-1 w-16 mx-auto bg-purple-400 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
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
      `}</style>

      {/* Booking Management Modal - Enhanced Version */}
      {selectedBookingId && (
        <EnhancedBookingManagementModal
          key={`${selectedBookingId}-${modalMode}`}
          isOpen={isModalOpen}
          onClose={closeBookingModal}
          bookingId={selectedBookingId}
          initialMode={modalMode}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Offline Booking Modal */}
      <OfflineBookingModal
        isOpen={isOfflineModalOpen}
        onClose={closeOfflineModal}
        onSuccess={handleModalSuccess}
        quickCheckInMode={isQuickCheckInMode}
      />
        </AdminLayout>
      </>
    </ProtectedRoute>
  );
}
