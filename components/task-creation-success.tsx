"use client"

import { CheckCircle2, Calendar, Brain, Clock } from "lucide-react"
import { motion } from "framer-motion"

interface TaskCreationSuccessProps {
  withCalendar?: boolean
  withAI?: boolean
  withPomodoro?: boolean
}

export function TaskCreationSuccess({ 
  withCalendar = false, 
  withAI = false,
  withPomodoro = false 
}: TaskCreationSuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-card rounded-lg shadow-lg p-8 max-w-md w-full mx-4 border-2 border-primary/20"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold"
          >
            Task Created Successfully!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground"
          >
            Your task has been added to your workflow
          </motion.p>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-2 justify-center pt-2"
          >
            {withAI && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                <Brain className="h-4 w-4" />
                <span>AI Decomposed</span>
              </div>
            )}
            {withCalendar && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Scheduled</span>
              </div>
            )}
            {withPomodoro && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-sm">
                <Clock className="h-4 w-4" />
                <span>Pomodoro Ready</span>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
