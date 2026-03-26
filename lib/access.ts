import { Role } from '@prisma/client'
import { prisma } from './prisma'
import { getCategoryFilter } from './auth'

/**
 * Each helper returns the resource if the user has access, or null.
 * Access is verified by walking up the chain to the Category and
 * applying getCategoryFilter — one DB query per check.
 */

export function getAccessibleCategory(categoryId: string, userId: string, role: Role) {
  return prisma.category.findFirst({
    where: { id: categoryId, ...getCategoryFilter(userId, role) },
  })
}

export function getAccessibleWeek(weekId: string, userId: string, role: Role) {
  return prisma.week.findFirst({
    where: { id: weekId, category: getCategoryFilter(userId, role) },
  })
}

export function getAccessibleTodo(todoId: string, userId: string, role: Role) {
  return prisma.todo.findFirst({
    where: { id: todoId, week: { category: getCategoryFilter(userId, role) } },
  })
}

export function getAccessiblePlan(planId: string, userId: string, role: Role) {
  return prisma.weekPlan.findFirst({
    where: { id: planId, week: { category: getCategoryFilter(userId, role) } },
  })
}

export function getAccessiblePlanTask(planTaskId: string, userId: string, role: Role) {
  return prisma.planTask.findFirst({
    where: { id: planTaskId, plan: { week: { category: getCategoryFilter(userId, role) } } },
  })
}

export function getAccessibleDayTag(dayTagId: string, userId: string, role: Role) {
  return prisma.dayTag.findFirst({
    where: { id: dayTagId, category: getCategoryFilter(userId, role) },
  })
}

/** For reorder endpoints: verifies every ID in the batch is accessible. */
export async function verifyAllTodosAccessible(
  ids: string[],
  userId: string,
  role: Role
): Promise<boolean> {
  const count = await prisma.todo.count({
    where: { id: { in: ids }, week: { category: getCategoryFilter(userId, role) } },
  })
  return count === ids.length
}

export async function verifyAllPlanTasksAccessible(
  ids: string[],
  userId: string,
  role: Role
): Promise<boolean> {
  const count = await prisma.planTask.count({
    where: {
      id: { in: ids },
      plan: { week: { category: getCategoryFilter(userId, role) } },
    },
  })
  return count === ids.length
}
