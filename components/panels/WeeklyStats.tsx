'use client'

import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import type { TodosByDate } from '@/types'
import { format } from 'date-fns'

interface WeeklyStatsProps {
  todos: TodosByDate[]
}

export function WeeklyStats({ todos }: WeeklyStatsProps) {
  const chartData = useMemo(() => {
    return todos.map((dateGroup) => {
      const total = dateGroup.todos.length
      const completed = dateGroup.todos.filter((t) => t.completed).length
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

      // Format date to show day of week
      const date = new Date(dateGroup.date)
      const dayOfWeek = format(date, 'EEE') // Mon, Tue, etc.

      return {
        day: dayOfWeek,
        completionRate,
        completed,
        total,
      }
    })
  }, [todos])

  const weeklyCompletion = useMemo(() => {
    const totalTodos = todos.reduce((sum, dateGroup) => sum + dateGroup.todos.length, 0)
    const completedTodos = todos.reduce(
      (sum, dateGroup) => sum + dateGroup.todos.filter((t) => t.completed).length,
      0
    )

    return totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0
  }, [todos])

  const totalTodos = todos.reduce((sum, dateGroup) => sum + dateGroup.todos.length, 0)
  const completedTodos = todos.reduce(
    (sum, dateGroup) => sum + dateGroup.todos.filter((t) => t.completed).length,
    0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg md:text-xl font-normal">Weekly Completion Stats</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Weekly Summary */}
        <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-4 sm:gap-8">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Weekly Completion</p>
            <p className="text-2xl sm:text-3xl font-semibold text-foreground">{weeklyCompletion}%</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Tasks Completed</p>
            <p className="text-lg sm:text-xl text-foreground">
              {completedTodos} / {totalTodos}
            </p>
          </div>
        </div>

        {/* Daily Completion Chart */}
        {chartData.length > 0 && (
          <div className="w-full h-48 sm:h-56 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'completionRate') {
                      return [
                        `${value}% (${props.payload.completed}/${props.payload.total})`,
                        'Completion',
                      ]
                    }
                    return [value, name]
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completionRate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartData.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No data to display</p>
        )}
      </CardContent>
    </Card>
  )
}
