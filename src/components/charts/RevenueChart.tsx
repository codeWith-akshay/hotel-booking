/**
 * Revenue Chart Component (Day 17)
 * 
 * Bar chart showing daily revenue using Recharts
 */

'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { RevenueData } from '@/lib/validation/reports.validation'
import { formatCurrency } from '@/lib/validation/reports.validation'

interface RevenueChartProps {
  data: RevenueData[]
  height?: number
}

export function RevenueChart({ data, height = 400 }: RevenueChartProps) {
  // Transform data for Recharts
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: d.date,
    totalRevenue: d.totalRevenue / 100, // Convert to dollars
    paidRevenue: d.paidRevenue / 100,
    pendingRevenue: d.pendingRevenue / 100,
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-gray-900 mb-2">{data.fullDate}</p>
          <div className="space-y-1 text-sm">
            <p className="text-emerald-600">
              <span className="font-medium">Paid:</span> ${data.paidRevenue.toFixed(2)}
            </p>
            <p className="text-amber-600">
              <span className="font-medium">Pending:</span> ${data.pendingRevenue.toFixed(2)}
            </p>
            <p className="text-gray-900 font-semibold pt-1 border-t border-gray-200">
              Total: ${data.totalRevenue.toFixed(2)}
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
        <p className="text-gray-500">No revenue data available for the selected period</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          <Bar
            dataKey="paidRevenue"
            fill="#10b981"
            name="Paid Revenue"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="pendingRevenue"
            fill="#f59e0b"
            name="Pending Revenue"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Loading skeleton for revenue chart
 */
export function RevenueChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div
      className="w-full bg-gray-100 rounded-lg animate-pulse"
      style={{ height: `${height}px` }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 mx-auto border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading revenue data...</p>
        </div>
      </div>
    </div>
  )
}
