// Analytics Logging Service
// This service handles all event logging to MongoDB

import { getAnalyticsCollection } from './mongodb';
import type {
  AnalyticsEvent,
  TaskCreatedEvent,
  TaskSkippedEvent,
  TaskCompletedEvent,
  TaskOverdueEvent,
  PomodoroSessionEvent,
  RuleAlertTriggeredEvent,
  AIInterventionTriggeredEvent,
  AIFeedbackReceivedEvent,
  ContestJoinedEvent,
  ContestCompletedEvent,
  UserSnapshot,
} from './analytics-types';

// Helper to generate unique event ID
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to get time of day
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// Helper to calculate hours/days until due
function getTimeUntilDue(dueDate: string): { hours: number; days: number } {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  return { hours, days };
}

class AnalyticsLogger {
  // Core logging function
  private async logEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const collection = await getAnalyticsCollection();
      await collection.insertOne(event as any);
      console.log(`✅ Logged event: ${event.event_type} for user ${event.userId}`);
    } catch (error) {
      // Don't fail the main operation if analytics logging fails
      console.error('Analytics logging error:', error);
      console.error('Event that failed:', event.event_type);
    }
  }

  // Phase 1 Events

  async logTaskCreated(data: {
    userId: string;
    taskId: string;
    title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate: string;
    estimatedTime: number;
    aiDecomposed: boolean;
    tags: string[];
    source: 'manual' | 'lms' | 'calendar';
    userSnapshot: UserSnapshot;
  }): Promise<void> {
    const event: TaskCreatedEvent = {
      eventId: generateEventId(),
      userId: data.userId,
      timestamp: new Date().toISOString(),
      event_type: 'task_created',
      event_data: {
        task_id: data.taskId,
        task_title: data.title,
        task_priority: data.priority,
        due_date: data.dueDate,
        estimated_time: data.estimatedTime,
        ai_decomposed: data.aiDecomposed,
        tags: data.tags,
        source: data.source,
      },
      user_snapshot: data.userSnapshot,
    };
    await this.logEvent(event);
  }

  async logTaskSkipped(data: {
    userId: string;
    taskId: string;
    title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate: string;
    currentSkipCount: number;
    tags: string[];
    userSnapshot: UserSnapshot;
  }): Promise<void> {
    const { hours, days } = getTimeUntilDue(data.dueDate);
    
    const event: TaskSkippedEvent = {
      eventId: generateEventId(),
      userId: data.userId,
      timestamp: new Date().toISOString(),
      event_type: 'task_skipped',
      event_data: {
        task_id: data.taskId,
        task_title: data.title,
        task_priority: data.priority,
        days_until_due: days,
        hours_until_due: hours,
        current_skip_count: data.currentSkipCount,
        task_tags: data.tags,
        time_of_day: getTimeOfDay(),
      },
      user_snapshot: data.userSnapshot,
    };
    await this.logEvent(event);
  }

  async logTaskCompleted(data: {
    userId: string;
    taskId: string;
    title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate: string;
    actualTime: number;
    estimatedTime: number;
    skipCount: number;
    interventionId?: string;
    userSnapshot: UserSnapshot;
  }): Promise<void> {
    const wasOverdue = new Date(data.dueDate) < new Date();
    
    const event: TaskCompletedEvent = {
      eventId: generateEventId(),
      userId: data.userId,
      timestamp: new Date().toISOString(),
      event_type: 'task_completed',
      event_data: {
        task_id: data.taskId,
        task_title: data.title,
        task_priority: data.priority,
        completion_date: new Date().toISOString(),
        was_overdue: wasOverdue,
        actual_time: data.actualTime,
        estimated_time: data.estimatedTime,
        skip_count: data.skipCount,
        completion_within_24h_of_intervention: data.interventionId ? true : undefined,
      },
      user_snapshot: data.userSnapshot,
    };
    await this.logEvent(event);
  }

  async logTaskOverdue(data: {
    userId: string;
    taskId: string;
    title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate: string;
    skipCount: number;
    userSnapshot: UserSnapshot;
  }): Promise<void> {
    const now = new Date();
    const due = new Date(data.dueDate);
    const daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    
    const event: TaskOverdueEvent = {
      eventId: generateEventId(),
      userId: data.userId,
      timestamp: new Date().toISOString(),
      event_type: 'task_status_overdue',
      event_data: {
        task_id: data.taskId,
        task_title: data.title,
        task_priority: data.priority,
        days_overdue: daysOverdue,
        skip_count: data.skipCount,
      },
      user_snapshot: data.userSnapshot,
    };
    await this.logEvent(event);
  }

  async logPomodoroSession(data: {
    userId: string;
    sessionId: string;
    taskId?: string;
    blockType: 'Focus' | 'Break' | 'Long Break';
    duration: number;
    completed: boolean;
    userSnapshot: UserSnapshot;
  }): Promise<void> {
    const event: PomodoroSessionEvent = {
      eventId: generateEventId(),
      userId: data.userId,
      timestamp: new Date().toISOString(),
      event_type: 'pomodoro_session_completed',
      event_data: {
        session_id: data.sessionId,
        task_id: data.taskId,
        block_type: data.blockType,
        duration: data.duration,
        completed: data.completed,
        time_of_day: getTimeOfDay(),
      },
      user_snapshot: data.userSnapshot,
    };
    await this.logEvent(event);
  }

  async logRuleAlertTriggered(data: {
    userId: string;
    alertId: string;
    taskId: string;
    title: string;
    alertType: 'deadline-approaching' | 'task-avoided' | 'pattern-detected';
    severity: 'low' | 'medium' | 'high';
    reason: string;
    triggerRules: {
      deadlineApproaching?: boolean;
      skipCountThreshold?: number;
      patternDetected?: string;
    };
    userSnapshot: UserSnapshot;
  }): Promise<void> {
    const event: RuleAlertTriggeredEvent = {
      eventId: generateEventId(),
      userId: data.userId,
      timestamp: new Date().toISOString(),
      event_type: 'rule_alert_triggered',
      event_data: {
        alert_id: data.alertId,
        task_id: data.taskId,
        task_title: data.title,
        alert_type: data.alertType,
        severity: data.severity,
        reason: data.reason,
        trigger_rules: {
          deadline_approaching: data.triggerRules.deadlineApproaching,
          skip_count_threshold: data.triggerRules.skipCountThreshold,
          pattern_detected: data.triggerRules.patternDetected,
        },
      },
      user_snapshot: data.userSnapshot,
    };
    await this.logEvent(event);
  }

  // Phase 2 Events

  async logAIInterventionTriggered(data: {
    userId: string;
    interventionId: string;
    taskId: string;
    title: string;
    triggerType: 'rule' | 'model';
    promptSent: string;
    llmResponse: string;
    modelUsed: string;
    severity: 'low' | 'medium' | 'high';
    context: {
      skipCount: number;
      hoursUntilDue: number;
      userRecentCompletionRate?: number;
    };
    userSnapshot: UserSnapshot;
  }): Promise<void> {
    const event: AIInterventionTriggeredEvent = {
      eventId: generateEventId(),
      userId: data.userId,
      timestamp: new Date().toISOString(),
      event_type: 'ai_intervention_triggered',
      event_data: {
        intervention_id: data.interventionId,
        task_id: data.taskId,
        task_title: data.title,
        trigger_type: data.triggerType,
        prompt_sent: data.promptSent,
        llm_response_received: data.llmResponse,
        model_used: data.modelUsed,
        severity: data.severity,
        context: {
          skip_count: data.context.skipCount,
          hours_until_due: data.context.hoursUntilDue,
          user_recent_completion_rate: data.context.userRecentCompletionRate,
        },
      },
      user_snapshot: data.userSnapshot,
    };
    await this.logEvent(event);
  }

  async logAIFeedbackReceived(data: {
    userId: string;
    interventionId: string;
    taskId: string;
    feedback: 'positive' | 'negative' | 'neutral';
    interventionTimestamp: string;
    userSnapshot: UserSnapshot;
  }): Promise<void> {
    const now = new Date();
    const interventionTime = new Date(data.interventionTimestamp);
    const timeToFeedbackSeconds = Math.floor(
      (now.getTime() - interventionTime.getTime()) / 1000
    );

    const event: AIFeedbackReceivedEvent = {
      eventId: generateEventId(),
      userId: data.userId,
      timestamp: new Date().toISOString(),
      event_type: 'ai_feedback_received',
      event_data: {
        intervention_id: data.interventionId,
        task_id: data.taskId,
        user_feedback: data.feedback,
        feedback_timestamp: now.toISOString(),
        time_to_feedback_seconds: timeToFeedbackSeconds,
      },
      user_snapshot: data.userSnapshot,
    };
    await this.logEvent(event);
  }

  // Contest Events

  async logContestJoined(data: {
    userId: string;
    contestId: string;
    contestName: string;
    contestType: string;
    userSnapshot: UserSnapshot;
  }): Promise<void> {
    const event: ContestJoinedEvent = {
      eventId: generateEventId(),
      userId: data.userId,
      timestamp: new Date().toISOString(),
      event_type: 'contest_joined',
      event_data: {
        contest_id: data.contestId,
        contest_name: data.contestName,
        contest_type: data.contestType,
      },
      user_snapshot: data.userSnapshot,
    };
    await this.logEvent(event);
  }

  async logContestCompleted(data: {
    userId: string;
    contestId: string;
    contestName: string;
    score: number;
    rank: number;
    totalParticipants: number;
    userSnapshot: UserSnapshot;
  }): Promise<void> {
    const event: ContestCompletedEvent = {
      eventId: generateEventId(),
      userId: data.userId,
      timestamp: new Date().toISOString(),
      event_type: 'contest_completed',
      event_data: {
        contest_id: data.contestId,
        contest_name: data.contestName,
        score: data.score,
        rank: data.rank,
        total_participants: data.totalParticipants,
      },
      user_snapshot: data.userSnapshot,
    };
    await this.logEvent(event);
  }

  // Helper method to get user snapshot from database
  async getUserSnapshot(userId: string): Promise<UserSnapshot> {
    try {
      // Import here to avoid circular dependencies
      const { db } = await import('@/db/drizzle');
      const { userStats } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      
      const stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, userId),
      });

      return {
        current_level: stats?.level || 1,
        current_streak: stats?.currentStreak || stats?.streak || 0,
        total_points: stats?.totalPoints || 0,
        tasks_completed_count: stats?.tasksCompleted || 0,
        pomodoros_completed_count: stats?.pomodorosCompleted || 0,
      };
    } catch (error) {
      console.error('Error getting user snapshot:', error);
      // Return default values if query fails
      return {
        current_level: 1,
        current_streak: 0,
        total_points: 0,
        tasks_completed_count: 0,
        pomodoros_completed_count: 0,
      };
    }
  }
}

// Export singleton instance
export const analyticsLogger = new AnalyticsLogger();
