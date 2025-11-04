import { relations } from "drizzle-orm";
import { boolean, integer, json, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull()
});

export const todo = pgTable("todo", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  done: boolean("done").default(false).notNull(),
});



export const session = pgTable("session", {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
    updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date())
});

// Application tables for tasks, schedules, etc.
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "urgent"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "in-progress", "completed", "overdue"]);
export const taskSourceEnum = pgEnum("task_source", ["manual", "lms", "calendar"]);

export const task = pgTable("task", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    dueDate: text('due_date').notNull(),
    priority: priorityEnum('priority').notNull(),
    status: taskStatusEnum('status').default("todo").notNull(),
    estimatedTime: integer('estimated_time').notNull(), // minutes
    actualTime: integer('actual_time').default(0).notNull(), // minutes
    tags: json('tags').$type<string[]>().default([]).notNull(),
    subtasks: json('subtasks').$type<Array<{ id: string; title: string; completed: boolean; estimatedTime: number }>>().default([]).notNull(),
    source: taskSourceEnum('source').default("manual").notNull(),
    sourceId: text('source_id'),
    createdAt: text('created_at').notNull(),
    completedAt: text('completed_at'),
    aiDecomposed: boolean('ai_decomposed').default(false).notNull(),
    // Task manager and verification
    managerEmail: text('manager_email'),
    verificationImageUrl: text('verification_image_url'),
    managerStatus: text('manager_status').default('pending'), // 'pending' | 'accepted'
    managerToken: text('manager_token'),
    managerUserId: text('manager_user_id').references(() => user.id, { onDelete: 'set null' }),
    managerConfirmed: boolean('manager_confirmed').default(false).notNull(),
    managerConfirmedAt: text('manager_confirmed_at')
});

export const scheduleBlockTypeEnum = pgEnum("schedule_block_type", ["task", "break", "wellness", "event", "pomodoro"]);
export const scheduleBlockStatusEnum = pgEnum("schedule_block_status", ["scheduled", "in-progress", "completed", "skipped"]);

export const scheduleBlock = pgTable("schedule_block", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    taskId: text('task_id').references(() => task.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    type: scheduleBlockTypeEnum('type').notNull(),
    status: scheduleBlockStatusEnum('status').default("scheduled").notNull(),
    pomodoroCount: integer('pomodoro_count'),
    createdAt: text('created_at').notNull()
});

export const userPreferences = pgTable("user_preferences", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
    workHoursStart: text('work_hours_start').default("09:00").notNull(),
    workHoursEnd: text('work_hours_end').default("17:00").notNull(),
    pomodoroLength: integer('pomodoro_length').default(25).notNull(),
    breakLength: integer('break_length').default(5).notNull(),
    longBreakLength: integer('long_break_length').default(15).notNull(),
    pomodorosUntilLongBreak: integer('pomodoros_until_long_break').default(4).notNull(),
    enableNotifications: boolean('enable_notifications').default(true),
    notificationsEnabled: boolean('notifications_enabled').default(true),
    wellnessReminders: boolean('wellness_reminders').default(true),
    wellnessReminderInterval: integer('wellness_reminder_interval').default(30),
    theme: text('theme').default("system").notNull()
});

export const userStats = pgTable("user_stats", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
    totalPoints: integer('total_points').default(0).notNull(),
    level: integer('level').default(1).notNull(),
    streak: integer('streak').default(0).notNull(),
    currentStreak: integer('current_streak').default(0),
    longestStreak: integer('longest_streak').default(0),
    tasksCompleted: integer('tasks_completed').default(0).notNull(),
    pomodorosCompleted: integer('pomodoros_completed').default(0).notNull(),
    totalFocusTime: integer('total_focus_time').default(0).notNull() // minutes
});

export const userAchievements = pgTable("user_achievements", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id').notNull(),
    unlockedAt: text('unlocked_at').notNull()
});

export const procrastinationAlert = pgTable("procrastination_alert", {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    taskId: text('task_id').notNull().references(() => task.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // "deadline-approaching" | "task-avoided" | "pattern-detected"
    message: text('message').notNull(),
    severity: text('severity').notNull(), // "low" | "medium" | "high"
    createdAt: text('created_at').notNull(),
    dismissed: boolean('dismissed').default(false).notNull()
});

// Contest tables
export const contestStatusEnum = pgEnum("contest_status", ["draft", "waiting", "in_progress", "finished", "cancelled"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const questionTypeEnum = pgEnum("question_type", ["multiple_choice", "true_false", "coding"]);
export const contestTypeEnum = pgEnum("contest_type", ["quick_fire", "standard", "marathon"]);

export const contest = pgTable("contest", {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    status: contestStatusEnum('status').default("draft").notNull(),
    createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
    // Contest configuration fields
    contestType: contestTypeEnum('contest_type').default("standard"),
    difficulty: difficultyEnum('difficulty').default("medium"),
    category: text('category'), // Filter by category
    questionCount: integer('question_count').default(10).notNull(),
    durationMinutes: integer('duration_minutes').default(30).notNull(),
    tags: json('tags').$type<string[]>().default([]).notNull(), // Additional filters
    showResultsAfter: timestamp('show_results_after'), // When to reveal results
    maxParticipants: integer('max_participants').default(5).notNull(), // 4-5 friends max
    isPrivate: boolean('is_private').default(true).notNull(), // Only invited can join
    waitingRoomActive: boolean('waiting_room_active').default(false).notNull(),
    actualStartTime: timestamp('actual_start_time'), // When organizer actually starts
    actualEndTime: timestamp('actual_end_time'),
    metadata: json('metadata').$type<{
        rules?: string;
        prizes?: string[];
        allowedParticipants?: string[]; // email list
    }>()
});

export const contestInvitationStatusEnum = pgEnum("contest_invitation_status", ["pending", "accepted", "declined", "expired"]);

export const contestInvitation = pgTable("contest_invitation", {
    id: text('id').primaryKey(),
    contestId: text('contest_id').notNull().references(() => contest.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }), // Filled after user accepts
    status: contestInvitationStatusEnum('status').default("pending").notNull(),
    invitedBy: text('invited_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
    invitedAt: timestamp('invited_at').$defaultFn(() => new Date()).notNull(),
    respondedAt: timestamp('responded_at'),
    expiresAt: timestamp('expires_at').notNull(),
    verificationToken: text('verification_token').notNull().unique(),
    emailSent: boolean('email_sent').default(false).notNull(),
    emailSentAt: timestamp('email_sent_at')
});

export const participantStatusEnum = pgEnum("participant_status", ["invited", "waiting", "active", "finished", "disconnected"]);

export const contestParticipant = pgTable("contest_participant", {
    id: text('id').primaryKey(),
    contestId: text('contest_id').notNull().references(() => contest.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    username: text('username').notNull(),
    email: text('email').notNull(),
    joinedAt: timestamp('joined_at').$defaultFn(() => new Date()).notNull(),
    score: integer('score').default(0).notNull(),
    rank: integer('rank'),
    submittedAt: timestamp('submitted_at'),
    completedAt: timestamp('completed_at'),
    timeSpentSeconds: integer('time_spent_seconds').default(0).notNull(),
    status: participantStatusEnum('status').default("invited").notNull(),
    isOrganizer: boolean('is_organizer').default(false).notNull(),
    currentQuestionIndex: integer('current_question_index').default(0).notNull(),
    answeredQuestions: json('answered_questions').$type<string[]>().default([]).notNull() // Array of question IDs
});

// Problem sets for contests
export const problemSet = pgTable("problem_set", {
    id: text('id').primaryKey(),
    question: text('question').notNull(),
    questionText: text('question_text').notNull(), // Alias for compatibility
    options: json('options').$type<string[]>().notNull(),
    correctAnswer: text('correct_answer').notNull(),
    explanation: text('explanation'),
    difficulty: difficultyEnum('difficulty').notNull(),
    type: questionTypeEnum('type').notNull(),
    category: text('category').notNull(), // e.g., "Programming", "Math", "Logic", etc.
    tags: json('tags').$type<string[]>().default([]).notNull(),
    points: integer('points').default(10).notNull(),
    timeAllocationSeconds: integer('time_allocation_seconds').default(60).notNull(),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
    updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
    createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
    isActive: boolean('is_active').default(true).notNull()
});

export const contestQuestion = pgTable("contest_question", {
    id: text('id').primaryKey(),
    contestId: text('contest_id').notNull().references(() => contest.id, { onDelete: 'cascade' }),
    problemSetId: text('problem_set_id').notNull().references(() => problemSet.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index').notNull()
});

// Player answers table for tracking individual submissions
export const playerAnswer = pgTable("player_answer", {
    id: text('id').primaryKey(),
    contestId: text('contest_id').notNull().references(() => contest.id, { onDelete: 'cascade' }),
    questionId: text('question_id').notNull().references(() => problemSet.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    answerGiven: text('answer_given').notNull(),
    isCorrect: boolean('is_correct').notNull(),
    timeTaken: integer('time_taken').notNull(), // milliseconds
    pointsAwarded: integer('points_awarded').default(0).notNull(),
    answeredAt: timestamp('answered_at').$defaultFn(() => new Date()).notNull()
});

// Contest results table for final rankings
export const contestResult = pgTable("contest_result", {
    id: text('id').primaryKey(),
    contestId: text('contest_id').notNull().references(() => contest.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    username: text('username').notNull(),
    score: integer('score').default(0).notNull(),
    rank: integer('rank').notNull(),
    completedAt: timestamp('completed_at').$defaultFn(() => new Date()).notNull()
});

export const contestSubmission = pgTable("contest_submission", {
    id: text('id').primaryKey(),
    contestId: text('contest_id').notNull().references(() => contest.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    problemSetId: text('problem_set_id').notNull().references(() => problemSet.id, { onDelete: 'cascade' }),
    selectedAnswer: text('selected_answer').notNull(),
    isCorrect: boolean('is_correct').notNull(),
    pointsEarned: integer('points_earned').default(0).notNull(),
    submittedAt: timestamp('submitted_at').$defaultFn(() => new Date()).notNull(),
    timeSpentSeconds: integer('time_spent_seconds').notNull()
});

export const contestRelations = relations(contest, ({ many, one }) => ({
    participants: many(contestParticipant),
    invitations: many(contestInvitation),
    questions: many(contestQuestion),
    results: many(contestResult),
    playerAnswers: many(playerAnswer),
    creator: one(user, {
        fields: [contest.createdBy],
        references: [user.id]
    })
}));

export const contestParticipantRelations = relations(contestParticipant, ({ one, many }) => ({
    contest: one(contest, {
        fields: [contestParticipant.contestId],
        references: [contest.id]
    }),
    user: one(user, {
        fields: [contestParticipant.userId],
        references: [user.id]
    }),
    submissions: many(contestSubmission)
}));

export const contestInvitationRelations = relations(contestInvitation, ({ one }) => ({
    contest: one(contest, {
        fields: [contestInvitation.contestId],
        references: [contest.id]
    }),
    inviter: one(user, {
        fields: [contestInvitation.invitedBy],
        references: [user.id]
    }),
    invitee: one(user, {
        fields: [contestInvitation.userId],
        references: [user.id]
    })
}));

export const problemSetRelations = relations(problemSet, ({ one, many }) => ({
    creator: one(user, {
        fields: [problemSet.createdBy],
        references: [user.id]
    }),
    contestQuestions: many(contestQuestion),
    submissions: many(contestSubmission),
    playerAnswers: many(playerAnswer)
}));

export const contestQuestionRelations = relations(contestQuestion, ({ one }) => ({
    contest: one(contest, {
        fields: [contestQuestion.contestId],
        references: [contest.id]
    }),
    problemSet: one(problemSet, {
        fields: [contestQuestion.problemSetId],
        references: [problemSet.id]
    })
}));

export const playerAnswerRelations = relations(playerAnswer, ({ one }) => ({
    contest: one(contest, {
        fields: [playerAnswer.contestId],
        references: [contest.id]
    }),
    user: one(user, {
        fields: [playerAnswer.userId],
        references: [user.id]
    }),
    question: one(problemSet, {
        fields: [playerAnswer.questionId],
        references: [problemSet.id]
    })
}));

export const contestResultRelations = relations(contestResult, ({ one }) => ({
    contest: one(contest, {
        fields: [contestResult.contestId],
        references: [contest.id]
    }),
    user: one(user, {
        fields: [contestResult.userId],
        references: [user.id]
    })
}));

export const contestSubmissionRelations = relations(contestSubmission, ({ one }) => ({
    contest: one(contest, {
        fields: [contestSubmission.contestId],
        references: [contest.id]
    }),
    user: one(user, {
        fields: [contestSubmission.userId],
        references: [user.id]
    }),
    problemSet: one(problemSet, {
        fields: [contestSubmission.problemSetId],
        references: [problemSet.id]
    })
}));

export type Contest = typeof contest.$inferSelect;
export type ContestInvitation = typeof contestInvitation.$inferSelect;
export type ContestParticipant = typeof contestParticipant.$inferSelect;
export type ProblemSet = typeof problemSet.$inferSelect;
export type ContestQuestion = typeof contestQuestion.$inferSelect;
export type ContestSubmission = typeof contestSubmission.$inferSelect;
export type PlayerAnswer = typeof playerAnswer.$inferSelect;
export type ContestResult = typeof contestResult.$inferSelect;
export type User = typeof user.$inferSelect;

export const schema = { 
    user, 
    session, 
    account, 
    verification, 
    task,
    scheduleBlock,
    userPreferences,
    userStats,
    userAchievements,
    procrastinationAlert,
    contest,
    contestInvitation,
    contestParticipant,
    problemSet,
    contestQuestion,
    contestSubmission,
    playerAnswer,
    contestResult,
    contestRelations,
    contestParticipantRelations,
    contestInvitationRelations,
    problemSetRelations,
    contestQuestionRelations,
    contestSubmissionRelations,
    playerAnswerRelations,
    contestResultRelations
};
