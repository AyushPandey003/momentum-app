import json
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import random

# Optional heavy imports for vector DB (chromadb, sentence-transformers)
try:
    import chromadb
    from chromadb.utils import embedding_functions
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    chromadb = None
    embedding_functions = None

app = FastAPI()

# CORS Middleware
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://momentum003.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-pro')
else:
    model = None

# Initialize ChromaDB for vector storage (optional)
chroma_client = None
sentence_transformer_ef = None
study_tips_collection = None

if CHROMADB_AVAILABLE:
    try:
        chroma_client = chromadb.Client()
        sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        study_tips_collection = chroma_client.get_or_create_collection(
            name="study_tips",
            embedding_function=sentence_transformer_ef
        )
        
        # Initialize with some default study tips if collection is empty
        try:
            existing = study_tips_collection.get()
            if not existing or not existing.get('documents'):
                default_tips = [
                    "The 5-minute rule: Commit to working on a task for just 5 minutes. Often, starting is the hardest part, and you'll find yourself continuing.",
                    "Swiss Cheese Method: Poke small holes in large tasks by completing tiny portions. This makes overwhelming projects manageable.",
                    "Time-blocking: Dedicate specific time slots to specific tasks. Treat these blocks as non-negotiable appointments.",
                    "Energy management: Schedule your most challenging tasks during your peak energy hours. Save routine tasks for low-energy periods.",
                    "The 2-minute rule: If a task takes less than 2 minutes, do it immediately. This prevents small tasks from piling up.",
                    "Pomodoro Technique: Work in 25-minute focused sprints followed by 5-minute breaks. This prevents burnout and maintains focus.",
                    "Break down assignments: Transform 'Write 10-page paper' into smaller steps like 'Research 5 sources', 'Create outline', 'Draft introduction'.",
                    "Schedule self-care: Block time for exercise, hobbies, and social activities. Mental health is crucial for academic success.",
                    "Use implementation intentions: Instead of 'I'll study today', say 'I'll study biology at 3 PM in the library'. Specificity increases follow-through.",
                    "Overcome perfectionism: Done is better than perfect. Aim for progress, not perfection, to avoid paralysis.",
                    "Create accountability: Share your goals with friends or study groups. External accountability boosts commitment.",
                    "Celebrate small wins: Acknowledge every completed task, no matter how small. Positive reinforcement builds momentum.",
                    "Minimize decision fatigue: Plan your day the night before. Fewer decisions mean more mental energy for actual work.",
                    "Environmental design: Create a dedicated study space free from distractions. Your environment shapes your behavior.",
                    "Use the Eisenhower Matrix: Categorize tasks by urgency and importance. Focus on important but not urgent tasks to prevent crises."
                ]
                
                for idx, tip in enumerate(default_tips):
                    study_tips_collection.add(
                        documents=[tip],
                        ids=[f"default_tip_{idx}"],
                        metadatas=[{"category": "productivity", "source": "default"}]
                    )
        except Exception as e:
            print(f"Warning: Could not initialize default tips: {e}")
            
    except Exception as e:
        print(f"Warning: ChromaDB initialization failed: {e}")
        study_tips_collection = None
else:
    print("Info: ChromaDB not installed (optional dependency). Vector-based tips will be unavailable.")

# Load questions from the JSON file
# Get the directory of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'cleaned_output_grouped.json')

with open(json_path, 'r') as f:
    question_data = json.load(f)

class Question(BaseModel):
    q_id: str
    question_type: str
    question: str
    options: List[str]
    actual_answer: str
    answer_explanation: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Momentum App API"}

@app.get("/questions", response_model=List[Question])
def get_questions(category: str = "Cognitive", num_questions: int = 10):
    """
    Get a random set of questions from a specific category.
    """
    if category in question_data and "mcq_single_correct" in question_data[category]:
        questions = question_data[category]["mcq_single_correct"]
        import random
        return random.sample(questions, min(num_questions, len(questions)))
    return []

@app.get("/categories", response_model=List[str])
def get_categories():
    """
    Get the available question categories.
    """
    return list(question_data.keys())


class QuizQuestion(BaseModel):
    q_id: str
    question: str
    options: List[str]
    category: str


class CheckAnswerRequest(BaseModel):
    q_id: str
    user_answer: str
    category: str


class CheckAnswerResponse(BaseModel):
    correct: bool
    actual_answer: Optional[str] = None  # Only sent if incorrect
    answer_explanation: Optional[str] = None  # Only sent if incorrect
    points_earned: int


class SkipQuestionRequest(BaseModel):
    q_id: str
    category: str


class MentorRequest(BaseModel):
    user_question: str
    context: Optional[str] = None


class MentorResponse(BaseModel):
    response: str
    relevant_tips: List[str]



@app.get("/quiz/random", response_model=QuizQuestion)
def get_random_quiz_question(category: str = "Cognitive"):
    """
    Get a random quiz question from the specified category.
    """
    if category in question_data and "mcq_single_correct" in question_data[category]:
        questions = question_data[category]["mcq_single_correct"]
        random_question = random.choice(questions)
        return QuizQuestion(
            q_id=random_question["q_id"],
            question=random_question["question"],
            options=random_question["options"],
            category=category
        )
    raise HTTPException(status_code=404, detail="Category not found or no questions available")


@app.post("/quiz/check", response_model=CheckAnswerResponse)
def check_answer(request: CheckAnswerRequest):
    """
    Check if the user's answer is correct and return appropriate response.
    Points: 10 for correct answer, 0 for incorrect.
    """
    if request.category in question_data and "mcq_single_correct" in question_data[request.category]:
        questions = question_data[request.category]["mcq_single_correct"]
        for question in questions:
            if question["q_id"] == request.q_id:
                correct = question["actual_answer"] == request.user_answer
                
                if correct:
                    # Don't reveal answer for correct responses
                    return CheckAnswerResponse(
                        correct=True,
                        points_earned=10
                    )
                else:
                    # Show correct answer and explanation for incorrect responses
                    return CheckAnswerResponse(
                        correct=False,
                        actual_answer=question["actual_answer"],
                        answer_explanation=question["answer_explanation"],
                        points_earned=0
                    )
    
    raise HTTPException(status_code=404, detail="Question not found")


@app.post("/quiz/skip")
def skip_question(request: SkipQuestionRequest):
    """
    Skip a question without penalty.
    """
    return {"message": "Question skipped", "points_penalty": 0}


@app.post("/mentor/ask", response_model=MentorResponse)
async def ask_mentor(request: MentorRequest):
    """
    AI Mentor using Gemini to provide personalized guidance on productivity,
    time management, and overcoming procrastination.
    """
    if not model:
        raise HTTPException(
            status_code=503, 
            detail="AI Mentor is not configured. Please set GEMINI_API_KEY environment variable."
        )
    
    try:
        # Retrieve relevant study tips from vector DB
        relevant_tips = []
        if study_tips_collection:
            try:
                results = study_tips_collection.query(
                    query_texts=[request.user_question],
                    n_results=3
                )
                if results and results.get('documents'):
                    relevant_tips = results['documents'][0]
            except:
                pass
        
        # Build context-aware prompt
        context_str = f"\nContext: {request.context}" if request.context else ""
        tips_str = f"\nRelevant study tips: {'; '.join(relevant_tips)}" if relevant_tips else ""
        
        prompt = f"""You are an AI mentor for the Momentum app, designed to help students overcome procrastination, 
manage their time effectively, and avoid burnout. You provide empathetic, actionable advice based on 
cognitive-behavioral techniques and proven productivity strategies.

Student's question: {request.user_question}{context_str}{tips_str}

Provide a helpful, encouraging response that:
1. Acknowledges their challenge
2. Offers 2-3 specific, actionable strategies
3. Uses techniques like the 5-minute rule, Swiss Cheese Method, or time-blocking
4. Maintains a supportive, non-judgmental tone
5. Keep response concise (max 150 words)

Response:"""
        
        response = model.generate_content(prompt)
        
        return MentorResponse(
            response=response.text,
            relevant_tips=relevant_tips[:3]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Mentor error: {str(e)}")


@app.post("/mentor/store-tip")
async def store_study_tip(tip: str, category: str = "general"):
    """
    Store a study tip or motivation quote in the vector database.
    """
    if not study_tips_collection:
        raise HTTPException(status_code=503, detail="Vector database not available")
    
    try:
        # Generate unique ID
        tip_id = f"{category}_{hash(tip)}"
        study_tips_collection.add(
            documents=[tip],
            ids=[tip_id],
            metadatas=[{"category": category}]
        )
        return {"message": "Tip stored successfully", "id": tip_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error storing tip: {str(e)}")


@app.get("/mentor/tips")
async def get_random_tips(count: int = 3, category: Optional[str] = None):
    """
    Get random motivational tips from the vector database.
    """
    if not study_tips_collection:
        # Return default tips if vector DB is not available
        default_tips = [
            "Start with just 5 minutes - momentum will carry you forward!",
            "Break large tasks into tiny, achievable steps.",
            "Schedule breaks as seriously as you schedule work.",
            "Your worth isn't measured by productivity - balance is key.",
            "Use the Pomodoro technique: 25 min focus + 5 min break."
        ]
        return {"tips": random.sample(default_tips, min(count, len(default_tips)))}
    
    try:
        # This is a simple retrieval - in production, you'd want better querying
        all_docs = study_tips_collection.get()
        if all_docs and all_docs.get('documents'):
            tips = random.sample(all_docs['documents'], min(count, len(all_docs['documents'])))
            return {"tips": tips}
        return {"tips": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving tips: {str(e)}")



# Smart LMS Scheduling Models
class TaskScheduleRequest(BaseModel):
    taskId: str
    userId: str
    title: str
    description: Optional[str] = None
    dueDate: str
    estimatedTime: int  # in minutes
    priority: str
    userCalendarEvents: Optional[List[Dict[str, Any]]] = None
    userEnergyPattern: Optional[Dict[str, Any]] = None


class ScheduleSlot(BaseModel):
    startTime: str
    endTime: str
    reason: str
    energyLevel: str
    pomodoroBlocks: Optional[List[Dict[str, str]]] = None


class TaskScheduleResponse(BaseModel):
    success: bool
    optimalSlot: ScheduleSlot
    alternativeSlots: List[ScheduleSlot]
    calendarEventId: Optional[str] = None
    message: str


class TaskDecomposeRequest(BaseModel):
    taskId: str
    title: str
    description: Optional[str] = None
    estimatedTime: int


class Subtask(BaseModel):
    id: str
    title: str
    completed: bool
    estimatedTime: int


class TaskDecomposeResponse(BaseModel):
    success: bool
    subtasks: List[Subtask]
    message: str


@app.post("/schedule/smart-lms", response_model=TaskScheduleResponse)
async def smart_lms_schedule(request: TaskScheduleRequest):
    """
    AI-powered smart scheduling for tasks based on:
    - User's calendar availability
    - Energy patterns (peak focus times)
    - Task priority and deadline
    - Optimal time blocking with Pomodoro technique
    """
    if not model:
        raise HTTPException(
            status_code=503,
            detail="AI Scheduling requires Gemini API. Set GEMINI_API_KEY."
        )
    
    try:
        # Parse due date
        from datetime import datetime, timedelta
        due_date = datetime.fromisoformat(request.dueDate.replace('Z', '+00:00'))
        now = datetime.now(due_date.tzinfo) if due_date.tzinfo else datetime.now()
        
        # Calculate available time window
        hours_until_due = (due_date - now).total_seconds() / 3600
        
        # Default energy pattern if not provided
        default_energy = {
            "peak_hours": [9, 10, 11, 14, 15, 16],  # 9-11 AM, 2-4 PM
            "low_hours": [12, 13, 20, 21, 22],  # Lunch time, late evening
            "preferred_work_start": 9,
            "preferred_work_end": 18
        }
        energy_pattern = request.userEnergyPattern or default_energy
        
        # Generate AI prompt for scheduling
        calendar_context = ""
        if request.userCalendarEvents:
            calendar_context = f"\nExisting calendar events: {len(request.userCalendarEvents)} events"
        
        prompt = f"""You are an expert AI scheduler for students. Schedule this task optimally:

Task: {request.title}
Description: {request.description or "No description"}
Estimated Time: {request.estimatedTime} minutes
Priority: {request.priority}
Due Date: {request.dueDate}
Hours Until Due: {hours_until_due:.1f}

User's Energy Pattern:
- Peak focus hours: {energy_pattern.get('peak_hours', [])}
- Low energy hours: {energy_pattern.get('low_hours', [])}
{calendar_context}

Provide the BEST time slot considering:
1. User's peak energy periods for optimal focus
2. Adequate time before deadline (avoid last-minute cramming)
3. Pomodoro technique: Break into 25-min blocks with 5-min breaks
4. Priority level (urgent tasks get prime slots)

Return a JSON object with:
{{
  "startTime": "ISO datetime string",
  "endTime": "ISO datetime string", 
  "reason": "Why this slot is optimal (1 sentence)",
  "energyLevel": "high/medium/low",
  "pomodoroBlocks": [
    {{"start": "HH:MM", "end": "HH:MM", "type": "work"}},
    {{"start": "HH:MM", "end": "HH:MM", "type": "break"}}
  ]
}}

Only return valid JSON, no additional text."""

        # Get AI recommendation
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean up markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse AI response
        import json
        ai_schedule = json.loads(response_text)
        
        # Create optimal slot
        optimal_slot = ScheduleSlot(
            startTime=ai_schedule.get("startTime", (now + timedelta(hours=2)).isoformat()),
            endTime=ai_schedule.get("endTime", (now + timedelta(hours=2, minutes=request.estimatedTime)).isoformat()),
            reason=ai_schedule.get("reason", "Optimal slot based on your energy pattern"),
            energyLevel=ai_schedule.get("energyLevel", "high"),
            pomodoroBlocks=ai_schedule.get("pomodoroBlocks", [])
        )
        
        # Generate alternative slots
        alternative_slots = []
        for i in range(1, 3):
            alt_start = now + timedelta(hours=2 + i * 3)
            alt_end = alt_start + timedelta(minutes=request.estimatedTime)
            alternative_slots.append(ScheduleSlot(
                startTime=alt_start.isoformat(),
                endTime=alt_end.isoformat(),
                reason=f"Alternative slot {i}: Good backup time",
                energyLevel="medium",
                pomodoroBlocks=None
            ))
        
        return TaskScheduleResponse(
            success=True,
            optimalSlot=optimal_slot,
            alternativeSlots=alternative_slots,
            calendarEventId=f"cal_{request.taskId}",
            message="Task scheduled successfully with AI optimization"
        )
        
    except json.JSONDecodeError as e:
        # Fallback scheduling if AI response parsing fails
        from datetime import datetime, timedelta
        due_date = datetime.fromisoformat(request.dueDate.replace('Z', '+00:00'))
        now = datetime.now(due_date.tzinfo) if due_date.tzinfo else datetime.now()
        
        # Schedule for next available peak hour
        start_time = now + timedelta(hours=2)
        end_time = start_time + timedelta(minutes=request.estimatedTime)
        
        optimal_slot = ScheduleSlot(
            startTime=start_time.isoformat(),
            endTime=end_time.isoformat(),
            reason="Scheduled for near-term availability",
            energyLevel="medium",
            pomodoroBlocks=[]
        )
        
        return TaskScheduleResponse(
            success=True,
            optimalSlot=optimal_slot,
            alternativeSlots=[],
            calendarEventId=f"cal_{request.taskId}",
            message="Task scheduled with fallback algorithm"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scheduling error: {str(e)}")


@app.post("/tasks/ai-decompose", response_model=TaskDecomposeResponse)
async def ai_decompose_task(request: TaskDecomposeRequest):
    """
    AI-powered task decomposition using Gemini to break down complex tasks
    into manageable subtasks with time estimates.
    """
    if not model:
        raise HTTPException(
            status_code=503,
            detail="AI Decomposition requires Gemini API. Set GEMINI_API_KEY."
        )
    
    try:
        prompt = f"""You are an expert study advisor. Break down this task into 3-6 actionable subtasks:

Task: {request.title}
Description: {request.description or "No additional details"}
Total Estimated Time: {request.estimatedTime} minutes

Create specific, actionable subtasks that:
1. Follow a logical progression
2. Are individually completable in one sitting
3. Add up to the total time (distribute time appropriately)
4. Use action verbs (Research, Write, Review, etc.)

Return ONLY a JSON array of subtasks:
[
  {{
    "title": "Specific actionable subtask",
    "estimatedTime": minutes_as_integer
  }}
]

Keep it practical for students. Return valid JSON only, no extra text."""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean markdown
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse response
        import json
        import uuid
        ai_subtasks = json.loads(response_text)
        
        # Create subtask objects
        subtasks = []
        for st in ai_subtasks:
            subtasks.append(Subtask(
                id=str(uuid.uuid4()),
                title=st.get("title", "Subtask"),
                completed=False,
                estimatedTime=st.get("estimatedTime", 30)
            ))
        
        return TaskDecomposeResponse(
            success=True,
            subtasks=subtasks,
            message=f"Generated {len(subtasks)} actionable subtasks"
        )
        
    except Exception as e:
        # Fallback: Create generic subtasks
        import uuid
        task_lower = request.title.lower()
        
        if "essay" in task_lower or "paper" in task_lower:
            subtasks = [
                Subtask(id=str(uuid.uuid4()), title="Research and gather sources", completed=False, estimatedTime=int(request.estimatedTime * 0.3)),
                Subtask(id=str(uuid.uuid4()), title="Create outline", completed=False, estimatedTime=int(request.estimatedTime * 0.15)),
                Subtask(id=str(uuid.uuid4()), title="Write first draft", completed=False, estimatedTime=int(request.estimatedTime * 0.4)),
                Subtask(id=str(uuid.uuid4()), title="Revise and proofread", completed=False, estimatedTime=int(request.estimatedTime * 0.15)),
            ]
        else:
            # Generic breakdown
            num_subtasks = max(3, min(5, request.estimatedTime // 30))
            time_per_subtask = request.estimatedTime // num_subtasks
            subtasks = [
                Subtask(
                    id=str(uuid.uuid4()),
                    title=f"Complete step {i+1} of {request.title}",
                    completed=False,
                    estimatedTime=time_per_subtask
                ) for i in range(num_subtasks)
            ]
        
        return TaskDecomposeResponse(
            success=True,
            subtasks=subtasks,
            message="Generated fallback subtasks"
        )


if __name__ == "__main__":

    import uvicorn

    uvicorn.run(app)

