/**
 * Occupancy Chart Component (Day 17)
 * 
 * Line chart showing daily occupancy rates using Recharts
 */

'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { OccupancyData } from '@/lib/validation/reports.validation'

interface OccupancyChartProps {
  data: OccupancyData[]
  height?: number
}

export function OccupancyChart({ data, height = 400 }: OccupancyChartProps) {
  // Transform data for Recharts
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: d.date,
    occupancyRate: d.occupancyRate,
    bookedRooms: d.bookedRooms,
    totalRooms: d.totalRooms,
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-gray-900 mb-2">{data.fullDate}</p>
          <div className="space-y-1 text-sm">
            <p className="text-indigo-600">
              <span className="font-medium">Occupancy Rate:</span> {data.occupancyRate}%
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Booked:</span> {data.bookedRooms} / {data.totalRooms} rooms
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
        <p className="text-gray-500">No occupancy data available for the selected period</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
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
            label={{ value: 'Occupancy Rate (%)', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="occupancyRate"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6 }}
            name="Occupancy Rate (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Loading skeleton for occupancy chart
 */
export function OccupancyChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div
      className="w-full bg-gray-100 rounded-lg animate-pulse"
      style={{ height: `${height}px` }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading occupancy data...</p>
        </div>
      </div>
    </div>
  )
}
