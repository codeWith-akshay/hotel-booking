/**
 * Booking Status Chart Component (Day 17)
 * 
 * Pie chart showing booking status distribution using Recharts
 */

'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { BookingStatusCount } from '@/lib/validation/reports.validation'

interface BookingStatusChartProps {
  data: BookingStatusCount[]
  height?: number
}

// Status colors
const STATUS_COLORS: Record<string, string> = {
  PROVISIONAL: '#f59e0b', // Amber
  CONFIRMED: '#10b981', // Emerald
  CANCELLED: '#ef4444', // Red
  COMPLETED: '#6366f1', // Indigo
}

export function BookingStatusChart({ data, height = 400 }: BookingStatusChartProps) {
  // Transform data for Recharts
  const chartData = data.map((d) => ({
    name: d.status,
    value: d.count,
    totalValue: d.totalValue,
    paidAmount: d.paidAmount,
  }))

  // Custom label renderer
  const renderLabel = (entry: any) => {
    const percent = ((entry.value / chartData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)
    return `${entry.name} (${percent}%)`
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Count:</span> {data.value} bookings
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Total Value:</span> ${(data.totalValue / 100).toFixed(2)}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Paid:</span> ${(data.paidAmount / 100).toFixed(2)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No booking status data available for the selected period</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {data.map((status) => {
          const total = data.reduce((sum, d) => sum + d.count, 0)
          const percentage = total > 0 ? ((status.count / total) * 100).toFixed(1) : '0.0'
          
          return (
            <div
              key={status.status}
              className="border border-gray-200 rounded-lg p-3 bg-white"
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[status.status] }}
                />
                <span className="text-xs font-medium text-gray-600">{status.status}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{status.count}</p>
              <p className="text-xs text-gray-500">{percentage}% of total</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Loading skeleton for booking status chart
 */
export function BookingStatusChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div>
      <div
        className="w-full bg-gray-100 rounded-lg animate-pulse"
        style={{ height: `${height}px` }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="space-y-3 text-center">
            <div className="w-8 h-8 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Loading booking status data...</p>
          </div>
        </div>
      </div>
      
      {/* Skeleton for status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
