'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp,
  FileText,
  BarChart3,
  PieChart,
  Loader2
} from 'lucide-react';
import { getReportStats } from '@/actions/admin/reports';

// ==========================================
// ADMIN REPORTS PAGE
// ==========================================

interface ReportStats {
  totalBookings: number;
  totalRevenue: number;
  totalGuests: number;
  averageOccupancy: number;
}

function AdminReportsContent() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState<ReportStats>({
    totalBookings: 0,
    totalRevenue: 0,
    totalGuests: 0,
    averageOccupancy: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  // Fetch report stats on mount and date range change
  useEffect(() => {
    fetchReportStats();
  }, [dateRange]);

  const fetchReportStats = async () => {
    setIsLoading(true);
    try {
      const result = await getReportStats(
        dateRange.startDate || new Date().toISOString(), 
        dateRange.endDate || new Date().toISOString()
      );
      
      if (result.success && result.data) {
        setStats(result.data);
        setLastGenerated(new Date());
      } else {
        console.error('Error fetching stats:', result.error);
      }
    } catch (error) {
      console.error('Error fetching report stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reportTypes = [
    {
      id: 'revenue',
      title: 'Revenue Report',
      description: 'Detailed breakdown of revenue by room type, date range, and payment status',
      icon: DollarSign,
      color: 'bg-green-500',
      available: true
    },
    {
      id: 'bookings',
      title: 'Bookings Report',
      description: 'Analysis of booking patterns, occupancy rates, and cancellations',
      icon: Calendar,
      color: 'bg-blue-500',
      available: true
    },
    {
      id: 'guests',
      title: 'Guest Report',
      description: 'Guest demographics, repeat customers, and loyalty statistics',
      icon: Users,
      color: 'bg-purple-500',
      available: true
    },
    {
      id: 'occupancy',
      title: 'Occupancy Report',
      description: 'Room occupancy rates, availability trends, and utilization metrics',
      icon: TrendingUp,
      color: 'bg-orange-500',
      available: true
    },
    {
      id: 'financial',
      title: 'Financial Summary',
      description: 'Complete financial overview including payments, refunds, and outstanding balances',
      icon: BarChart3,
      color: 'bg-indigo-500',
      available: true
    },
    {
      id: 'custom',
      title: 'Custom Report',
      description: 'Build your own report with custom filters and data points',
      icon: PieChart,
      color: 'bg-pink-500',
      available: false
    }
  ];

  const handleGenerateReport = async (reportId: string) => {
    console.log('Generating report:', reportId, dateRange);
    setIsLoading(true);
    setLastGenerated(new Date());
    
    try {
      // TODO: Implement actual report generation API
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: reportId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        })
      });

      if (!response.ok) {
        throw new Error('Report generation failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportId}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert(`Report "${reportId}" generated successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      alert(`Report generation will be implemented soon! Selected: "${reportId}"`);
    } finally {
      setIsLoading(false);
    }
  };

  const actions = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={fetchReportStats} disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
        Refresh Stats
      </Button>
      <Button variant="outline" disabled>
        <Download className="h-4 w-4 mr-2" />
        Export All
      </Button>
    </div>
  );

  return (
    <AdminLayout
      title="Reports & Analytics"
      subtitle="Generate comprehensive reports and insights about your hotel operations"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Date Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Report Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalBookings}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `₹${stats.totalRevenue.toLocaleString()}`}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Guests</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalGuests}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Occupancy</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${stats.averageOccupancy}%`}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastGenerated ? lastGenerated.toLocaleTimeString() : 'Never'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`${report.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      {!report.available && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    {report.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleGenerateReport(report.id)}
                      disabled={!report.available || isLoading}
                      className="flex-1"
                      variant={report.available ? 'default' : 'outline'}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!report.available || isLoading}
                    >
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Report Generation
                </h3>
                <p className="text-sm text-blue-800">
                  Reports are generated based on the selected date range. You can export reports in PDF, Excel, or CSV formats.
                  Custom reports with advanced filters are coming soon!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function AdminReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <AdminReportsContent />
    </ProtectedRoute>
  );
}
