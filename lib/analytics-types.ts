// MongoDB Analytics Event Types for Hybrid Procrastination System

export type EventType =
  | "task_created"
  | "task_skipped"
  | "task_completed"
  | "task_status_overdue"
  | "pomodoro_session_completed"
  | "rule_alert_triggered"
  | "ai_intervention_triggered"
  | "ai_feedback_received"
  | "contest_joined"
  | "contest_completed";

export type AlertSeverity = "low" | "medium" | "high";
export type AlertType = 
  | "deadline-approaching" 
  | "task-avoided" 
  | "pattern-detected";

export type FeedbackType = "positive" | "negative" | "neutral";

// Base event structure - all events extend this
export interface BaseAnalyticsEvent {
  eventId: string;
  userId: string;
  timestamp: string; // ISO 8601 format
  event_type: EventType;
}

// User snapshot - captures user state at event time
export interface UserSnapshot {
  current_level: number;
  current_streak: number;
  total_points: number;
  tasks_completed_count: number;
  pomodoros_completed_count: number;
}

// Task Created Event
export interface TaskCreatedEvent extends BaseAnalyticsEvent {
  event_type: "task_created";
  event_data: {
    task_id: string;
    task_title: string;
    task_priority: "low" | "medium" | "high" | "urgent";
    due_date: string;
    estimated_time: number;
    ai_decomposed: boolean;
    tags: string[];
    source: "manual" | "lms" | "calendar";
  };
  user_snapshot: UserSnapshot;
}

// Task Skipped Event
export interface TaskSkippedEvent extends BaseAnalyticsEvent {
  event_type: "task_skipped";
  event_data: {
    task_id: string;
    task_title: string;
    task_priority: "low" | "medium" | "high" | "urgent";
    days_until_due: number;
    hours_until_due: number;
    current_skip_count: number;
    task_tags: string[];
    time_of_day: string; // "morning" | "afternoon" | "evening" | "night"
  };
  user_snapshot: UserSnapshot;
}

// Task Completed Event
export interface TaskCompletedEvent extends BaseAnalyticsEvent {
  event_type: "task_completed";
  event_data: {
    task_id: string;
    task_title: string;
    task_priority: "low" | "medium" | "high" | "urgent";
    completion_date: string;
    was_overdue: boolean;
    actual_time: number;
    estimated_time: number;
    skip_count: number;
    completion_within_24h_of_intervention?: boolean;
  };
  user_snapshot: UserSnapshot;
}

// Task Overdue Event
export interface TaskOverdueEvent extends BaseAnalyticsEvent {
  event_type: "task_status_overdue";
  event_data: {
    task_id: string;
    task_title: string;
    task_priority: "low" | "medium" | "high" | "urgent";
    days_overdue: number;
    skip_count: number;
  };
  user_snapshot: UserSnapshot;
}

// Pomodoro Session Completed Event
export interface PomodoroSessionEvent extends BaseAnalyticsEvent {
  event_type: "pomodoro_session_completed";
  event_data: {
    session_id: string;
    task_id?: string;
    block_type: "Focus" | "Break" | "Long Break";
    duration: number; // minutes
    completed: boolean;
    time_of_day: string;
  };
  user_snapshot: UserSnapshot;
}

// Rule Alert Triggered Event (Phase 1)
export interface RuleAlertTriggeredEvent extends BaseAnalyticsEvent {
  event_type: "rule_alert_triggered";
  event_data: {
    alert_id: string;
    task_id: string;
    task_title: string;
    alert_type: AlertType;
    severity: AlertSeverity;
    reason: string;
    trigger_rules: {
      deadline_approaching?: boolean;
      skip_count_threshold?: number;
      pattern_detected?: string;
    };
  };
  user_snapshot: UserSnapshot;
}

// AI Intervention Triggered Event (Phase 2)
export interface AIInterventionTriggeredEvent extends BaseAnalyticsEvent {
  event_type: "ai_intervention_triggered";
  event_data: {
    intervention_id: string;
    task_id: string;
    task_title: string;
    trigger_type: "rule" | "model"; // Phase 1 vs Phase 3
    prompt_sent: string;
    llm_response_received: string;
    model_used: string; // "gemini-1.5-flash" etc
    severity: AlertSeverity;
    context: {
      skip_count: number;
      hours_until_due: number;
      user_recent_completion_rate?: number;
    };
  };
  user_snapshot: UserSnapshot;
}

// AI Feedback Received Event (Phase 2 - Critical for labeling)
export interface AIFeedbackReceivedEvent extends BaseAnalyticsEvent {
  event_type: "ai_feedback_received";
  event_data: {
    intervention_id: string;
    task_id: string;
    user_feedback: FeedbackType;
    feedback_timestamp: string;
    time_to_feedback_seconds: number; // How long after intervention
  };
  user_snapshot: UserSnapshot;
}

// Contest Events
export interface ContestJoinedEvent extends BaseAnalyticsEvent {
  event_type: "contest_joined";
  event_data: {
    contest_id: string;
    contest_name: string;
    contest_type: string;
  };
  user_snapshot: UserSnapshot;
}

export interface ContestCompletedEvent extends BaseAnalyticsEvent {
  event_type: "contest_completed";
  event_data: {
    contest_id: string;
    contest_name: string;
    score: number;
    rank: number;
    total_participants: number;
  };
  user_snapshot: UserSnapshot;
}

// Union type of all possible events
export type AnalyticsEvent =
  | TaskCreatedEvent
  | TaskSkippedEvent
  | TaskCompletedEvent
  | TaskOverdueEvent
  | PomodoroSessionEvent
  | RuleAlertTriggeredEvent
  | AIInterventionTriggeredEvent
  | AIFeedbackReceivedEvent
  | ContestJoinedEvent
  | ContestCompletedEvent;

// Helper type for Phase 3 ML Model Features
export interface UserFeatures {
  avg_pomodoros_per_task: number;
  skip_rate: number; // skips / total tasks
  completion_rate: number;
  avg_time_of_day_most_productive: string;
  current_streak: number;
  tasks_overdue_count: number;
  recent_7day_completion_rate: number;
  preferred_task_types: string[];
  avg_skip_count_before_completion: number;
}

// Procrastination Prediction Input (Phase 3)
export interface ProcrastinationPredictionInput {
  task_id: string;
  user_id: string;
  user_features: UserFeatures;
  task_features: {
    priority: string;
    estimated_time: number;
    days_until_due: number;
    tags: string[];
    ai_decomposed: boolean;
  };
}

// Procrastination Prediction Output (Phase 3)
export interface ProcrastinationPredictionOutput {
  task_id: string;
  procrastination_probability: number; // 0.0 to 1.0
  confidence: number;
  should_trigger_intervention: boolean;
  recommended_intervention_type: "gentle" | "moderate" | "urgent";
  features_contributing: string[]; // Which features drove the prediction
}
