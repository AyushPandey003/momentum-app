// Phase 1: Rule-Based Procrastination Detection
// This implements the simple rules you designed before moving to ML

import type { Task } from './types';
import { analyticsLogger } from './analytics-logger';

export type AlertSeverity = 'low' | 'medium' | 'high';
export type AlertType = 'deadline-approaching' | 'task-avoided' | 'pattern-detected';

export interface ProcrastinationDetectionResult {
  taskId: string;
  taskTitle: string;
  severity: AlertSeverity;
  alertType: AlertType;
  message: string;
  reason: string;
  shouldTrigger: boolean;
  triggerRules: {
    deadlineApproaching?: boolean;
    skipCountThreshold?: number;
    patternDetected?: string;
  };
}

/**
 * Rule 1: Deadline Approaching
 * Triggers when a task is due within 24 hours and still in 'todo' status
 */
function checkDeadlineApproaching(task: Task): ProcrastinationDetectionResult | null {
  if (task.status !== 'todo') return null;

  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Due within 24 hours
  if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
    return {
      taskId: task.id,
      taskTitle: task.title,
      severity: 'low',
      alertType: 'deadline-approaching',
      message: `Gentle reminder: "${task.title}" is due in ${Math.floor(hoursUntilDue)} hours.`,
      reason: `Task is due within 24 hours and still in 'todo' status`,
      shouldTrigger: true,
      triggerRules: {
        deadlineApproaching: true,
      },
    };
  }

  // Due within 6 hours - more urgent
  if (hoursUntilDue <= 6 && hoursUntilDue > 0) {
    return {
      taskId: task.id,
      taskTitle: task.title,
      severity: 'medium',
      alertType: 'deadline-approaching',
      message: `⚠️ "${task.title}" is due in ${Math.floor(hoursUntilDue)} hours. Time to get started!`,
      reason: `Task is due within 6 hours and still in 'todo' status`,
      shouldTrigger: true,
      triggerRules: {
        deadlineApproaching: true,
      },
    };
  }

  return null;
}

/**
 * Rule 2: Task Avoidance (Skip Count Threshold)
 * Triggers when a user skips a task multiple times
 */
function checkTaskAvoidance(task: Task & { skipCount?: number }): ProcrastinationDetectionResult | null {
  const skipCount = task.skipCount || 0;

  // Medium alert: 3+ skips
  if (skipCount >= 3 && skipCount < 5) {
    return {
      taskId: task.id,
      taskTitle: task.title,
      severity: 'medium',
      alertType: 'task-avoided',
      message: `You've skipped "${task.title}" ${skipCount} times. Would you like to reschedule or break it down?`,
      reason: `Task has been skipped ${skipCount} times`,
      shouldTrigger: true,
      triggerRules: {
        skipCountThreshold: skipCount,
      },
    };
  }

  // High alert: 5+ skips - This will trigger Phase 2 AI Coach
  if (skipCount >= 5) {
    return {
      taskId: task.id,
      taskTitle: task.title,
      severity: 'high',
      alertType: 'task-avoided',
      message: `🚨 It looks like you're avoiding "${task.title}". Let's figure out why and how to help.`,
      reason: `Task has been skipped ${skipCount} times - high procrastination risk`,
      shouldTrigger: true,
      triggerRules: {
        skipCountThreshold: skipCount,
      },
    };
  }

  return null;
}

/**
 * Rule 3: Pattern Detection
 * Detects if a user consistently skips tasks with the same tag
 */
function checkPatternDetection(
  task: Task & { skipCount?: number },
  allTasks: (Task & { skipCount?: number })[]
): ProcrastinationDetectionResult | null {
  if (!task.tags || task.tags.length === 0) return null;
  
  const skipCount = task.skipCount || 0;
  if (skipCount < 2) return null; // Only check if current task has been skipped

  // For each tag on the current task, check if other tasks with the same tag are also skipped
  for (const tag of task.tags) {
    const tasksWithTag = allTasks.filter(
      (t) => t.tags && t.tags.includes(tag) && t.id !== task.id
    );
    
    const skippedTasksWithTag = tasksWithTag.filter(
      (t) => (t.skipCount || 0) >= 2
    );

    // If 50%+ of tasks with this tag are skipped, it's a pattern
    if (tasksWithTag.length >= 2 && skippedTasksWithTag.length / tasksWithTag.length >= 0.5) {
      return {
        taskId: task.id,
        taskTitle: task.title,
        severity: 'medium',
        alertType: 'pattern-detected',
        message: `📊 Pattern detected: You often avoid tasks tagged with "${tag}". Want to explore why?`,
        reason: `${skippedTasksWithTag.length} out of ${tasksWithTag.length} tasks with tag "${tag}" are being avoided`,
        shouldTrigger: true,
        triggerRules: {
          patternDetected: tag,
        },
      };
    }
  }

  return null;
}

/**
 * Main detection function - runs all rules
 */
export async function detectProcrastination(
  task: Task & { skipCount?: number },
  allTasks: (Task & { skipCount?: number })[],
  userId: string
): Promise<ProcrastinationDetectionResult | null> {
  // Run all detection rules
  const deadlineResult = checkDeadlineApproaching(task);
  const avoidanceResult = checkTaskAvoidance(task);
  const patternResult = checkPatternDetection(task, allTasks);

  // Priority order: High severity > Medium > Low
  const results = [deadlineResult, avoidanceResult, patternResult].filter(Boolean);
  
  if (results.length === 0) return null;

  // Sort by severity
  const severityOrder = { high: 3, medium: 2, low: 1 };
  results.sort((a, b) => severityOrder[b!.severity] - severityOrder[a!.severity]);

  const topResult = results[0]!;

  // Log this alert to MongoDB
  try {
    const userSnapshot = await analyticsLogger.getUserSnapshot(userId);
    
    await analyticsLogger.logRuleAlertTriggered({
      userId,
      alertId: `alert_${Date.now()}_${task.id}`,
      taskId: task.id,
      title: task.title,
      alertType: topResult.alertType,
      severity: topResult.severity,
      reason: topResult.reason,
      triggerRules: topResult.triggerRules,
      userSnapshot,
    });
  } catch (error) {
    console.error('Failed to log alert:', error);
  }

  return topResult;
}

/**
 * Batch detection - check all user's tasks
 */
export async function detectProcrastinationBatch(
  tasks: (Task & { skipCount?: number })[],
  userId: string
): Promise<ProcrastinationDetectionResult[]> {
  const results: ProcrastinationDetectionResult[] = [];

  for (const task of tasks) {
    const result = await detectProcrastination(task, tasks, userId);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Check if alert should trigger AI intervention (Phase 2)
 */
export function shouldTriggerAIIntervention(result: ProcrastinationDetectionResult): boolean {
  // Only high severity alerts trigger AI coach
  return result.severity === 'high';
}
