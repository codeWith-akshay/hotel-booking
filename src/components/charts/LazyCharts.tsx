// ==========================================
// LAZY-LOADED CHART COMPONENTS
// ==========================================
// PERF: Charts are loaded only when needed via dynamic imports
// This significantly reduces initial bundle size

'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { ComponentProps } from 'react'

// Loading skeleton for charts
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full animate-pulse" style={{ height }}>
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
)

// ==========================================
// DYNAMICALLY IMPORTED RECHARTS COMPONENTS
// ==========================================

// We create wrapper components that are lazy loaded
// This ensures recharts (~500KB) is only loaded when charts are rendered

export const LazyAreaChart = dynamic(
  () => import('recharts').then((mod) => {
    const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod
    
    // Return a component that wraps all the recharts components
    return function AreaChartWrapper({ 
      data, 
      height = 320,
      dataKey = 'value',
      gradientId = 'colorGradient',
      gradientColor = '#667eea',
      xAxisKey = 'date',
      strokeWidth = 4,
    }: {
      data: any[]
      height?: number
      dataKey?: string
      gradientId?: string
      gradientColor?: string
      xAxisKey?: string
      strokeWidth?: number
    }) {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientColor} stopOpacity={0.9}/>
                <stop offset="95%" stopColor={gradientColor} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={xAxisKey} 
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
              dataKey={dataKey} 
              stroke={gradientColor} 
              strokeWidth={strokeWidth}
              fillOpacity={1} 
              fill={`url(#${gradientId})`} 
            />
          </AreaChart>
        </ResponsiveContainer>
      )
    }
  }),
  { 
    loading: () => <ChartSkeleton height={320} />,
    ssr: false // Charts don't need SSR
  }
)

export const LazyPieChart = dynamic(
  () => import('recharts').then((mod) => {
    const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = mod
    
    return function PieChartWrapper({ 
      data, 
      height = 250,
    }: {
      data: Array<{ name: string; value: number; color: string }>
      height?: number
    }) {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => {
                const { name, percent } = props
                return `${name} ${(percent * 100).toFixed(0)}%`
              }}
              outerRadius={85}
              fill="#8884d8"
              dataKey="value"
              strokeWidth={3}
              stroke="#fff"
            >
              {data.map((entry, index) => (
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
          </PieChart>
        </ResponsiveContainer>
      )
    }
  }),
  { 
    loading: () => <ChartSkeleton height={250} />,
    ssr: false
  }
)

export const LazyBarChart = dynamic(
  () => import('recharts').then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod
    
    return function BarChartWrapper({ 
      data, 
      height = 300,
      dataKey = 'value',
      barColor = '#667eea',
      xAxisKey = 'name',
    }: {
      data: any[]
      height?: number
      dataKey?: string
      barColor?: string
      xAxisKey?: string
    }) {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: '600' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: '600' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 15px 30px rgba(0,0,0,0.15)',
                padding: '8px 12px'
              }}
            />
            <Bar 
              dataKey={dataKey} 
              fill={barColor}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )
    }
  }),
  { 
    loading: () => <ChartSkeleton height={300} />,
    ssr: false
  }
)

export const LazyLineChart = dynamic(
  () => import('recharts').then((mod) => {
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = mod
    
    return function LineChartWrapper({ 
      data, 
      height = 300,
      lines = [{ dataKey: 'value', color: '#667eea', name: 'Value' }],
      xAxisKey = 'name',
    }: {
      data: any[]
      height?: number
      lines?: Array<{ dataKey: string; color: string; name: string }>
      xAxisKey?: string
    }) {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: '600' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px', fontWeight: '600' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 15px 30px rgba(0,0,0,0.15)',
                padding: '8px 12px'
              }}
            />
            <Legend />
            {lines.map((line) => (
              <Line 
                key={line.dataKey}
                type="monotone" 
                dataKey={line.dataKey} 
                stroke={line.color}
                strokeWidth={3}
                name={line.name}
                dot={{ fill: line.color, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )
    }
  }),
  { 
    loading: () => <ChartSkeleton height={300} />,
    ssr: false
  }
)
