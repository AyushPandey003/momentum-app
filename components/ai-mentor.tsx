"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Send, Lightbulb, Sparkles, Loader2 } from "lucide-react"

// Backend URL with py-api prefix for Python FastAPI endpoints
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ;

interface MentorResponse {
  response: string;
  relevant_tips: string[];
}

interface Message {
  role: "user" | "mentor";
  content: string;
  tips?: string[];
}

export function AIMentor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [randomTips, setRandomTips] = useState<string[]>([]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/mentor/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_question: input,
          context: messages.length > 0 ? messages[messages.length - 1].content : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get mentor response");
      }

      const data: MentorResponse = await response.json();

      const mentorMessage: Message = {
        role: "mentor",
        content: data.response,
        tips: data.relevant_tips,
      };

      setMessages((prev) => [...prev, mentorMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: "mentor",
        content: "I'm having trouble connecting right now. Please make sure the backend is running and the GEMINI_API_KEY is set. In the meantime, try breaking your task into smaller 5-minute chunks!",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRandomTips = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/mentor/tips?count=3`);
      if (response.ok) {
        const data = await response.json();
        setRandomTips(data.tips);
      }
    } catch (error) {
      console.error("Failed to fetch tips:", error);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="space-y-6 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            AI Mentor
          </CardTitle>
          <CardDescription>
            Get personalized advice on productivity, time management, and overcoming procrastination
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuestion("I'm feeling overwhelmed by my workload. How do I start?")}
            >
              Feeling Overwhelmed?
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuestion("I keep procrastinating. What techniques can help me get started?")}
            >
              Procrastination Help
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickQuestion("How can I maintain focus during study sessions?")}
            >
              Focus Strategies
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetRandomTips}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Random Tips
            </Button>
          </div>

          {/* Random Tips Display */}
          <AnimatePresence>
            {randomTips.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-purple-600">
                  <Sparkles className="w-4 h-4" />
                  Quick Tips
                </div>
                {randomTips.map((tip, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Badge variant="secondary" className="p-2 text-xs leading-relaxed">
                      {tip}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Area */}
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-purple-500/50" />
                  <p className="font-semibold">Welcome to your AI Mentor!</p>
                  <p className="text-sm mt-2">Ask me anything about productivity, time management, or study techniques.</p>
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {messages.map((message, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {message.tips && message.tips.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-semibold flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" />
                            Related Tips:
                          </p>
                          {message.tips.map((tip, tipIdx) => (
                            <p key={tipIdx} className="text-xs opacity-80 pl-4">
                              • {tip}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask your mentor anything... (e.g., 'How do I overcome procrastination?')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="min-h-[60px]"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
