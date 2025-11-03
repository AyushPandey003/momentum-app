"use client";

import { useState } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createProblemSet } from "@/server/contests";

export default function AdminProblemsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [type, setType] = useState<"multiple_choice" | "true_false" | "coding">("multiple_choice");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [points, setPoints] = useState(10);
  const [timeAllocation, setTimeAllocation] = useState(60);

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      toast({
        title: "Validation Error",
        description: "Question is required",
        variant: "destructive",
      });
      return;
    }

    const validOptions = options.filter((opt) => opt.trim() !== "");
    if (validOptions.length < 2) {
      toast({
        title: "Validation Error",
        description: "At least 2 options are required",
        variant: "destructive",
      });
      return;
    }

    if (!correctAnswer.trim()) {
      toast({
        title: "Validation Error",
        description: "Correct answer is required",
        variant: "destructive",
      });
      return;
    }

    if (!validOptions.includes(correctAnswer)) {
      toast({
        title: "Validation Error",
        description: "Correct answer must be one of the options",
        variant: "destructive",
      });
      return;
    }

    if (!category.trim()) {
      toast({
        title: "Validation Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await createProblemSet({
        question: question.trim(),
        options: validOptions,
        correctAnswer: correctAnswer.trim(),
        explanation: explanation.trim() || undefined,
        difficulty,
        type,
        category: category.trim(),
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        points,
        timeAllocationSeconds: timeAllocation,
      });

      toast({
        title: "Success! 🎉",
        description: "Problem added to the database",
      });

      // Reset form
      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      setExplanation("");
      setDifficulty("medium");
      setType("multiple_choice");
      setCategory("");
      setTags("");
      setPoints(10);
      setTimeAllocation(60);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to add problem. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Problem Set Management</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Add questions to the database that will be used in contests
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Problem</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question */}
              <div className="space-y-2">
                <Label htmlFor="question">
                  Question <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="question"
                  placeholder="Enter your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    Answer Options <span className="text-red-500">*</span>
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Answer */}
              <div className="space-y-2">
                <Label htmlFor="correctAnswer">
                  Correct Answer <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="correctAnswer"
                  placeholder="Enter the exact correct answer from options above"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must exactly match one of the options above
                </p>
              </div>

              {/* Explanation */}
              <div className="space-y-2">
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea
                  id="explanation"
                  placeholder="Explain why this is the correct answer..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Difficulty <span className="text-red-500">*</span>
                  </Label>
                  <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Question Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={type} onValueChange={(value: any) => setType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="coding">Coding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="category"
                  placeholder="e.g., Programming, Math, Logic, Science"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., algorithms, data-structures, arrays"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="points">
                    Points <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    min={1}
                    max={100}
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeAllocation">
                    Time Allocation (seconds) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="timeAllocation"
                    type="number"
                    min={10}
                    max={300}
                    value={timeAllocation}
                    onChange={(e) => setTimeAllocation(parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Problem
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tips for Creating Problems</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Make sure questions are clear and unambiguous</li>
              <li>• Use proper grammar and spelling</li>
              <li>• Set appropriate difficulty levels based on question complexity</li>
              <li>• Add explanations to help participants learn from their mistakes</li>
              <li>• Use consistent categories and tags for better filtering</li>
              <li>• Test your questions before using them in contests</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
