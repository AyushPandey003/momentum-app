# Momentum Backend API

This is the FastAPI backend for the Momentum app - an AI-powered time management and anti-procrastination tool for students.

## Features

- **Quiz System**: MCQ questions across multiple categories (Cognitive, etc.)
- **AI Mentor**: Powered by Google Gemini AI for personalized productivity guidance
- **Vector Database**: ChromaDB for storing and retrieving study tips and motivational content
- **CORS Enabled**: Ready for frontend integration

## Setup

### Prerequisites

- Python 3.13+
- Google Gemini API Key (optional, but required for AI Mentor feature)

### Installation

1. Install dependencies using uv or pip:

```bash
# Using uv (recommended)
uv pip install -e .

# Or using pip
pip install -e .
```

2. Set up your Gemini API Key (optional but recommended):

**Windows (cmd):**
```cmd
set GEMINI_API_KEY=your_api_key_here
```

**Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY="your_api_key_here"
```

**Linux/Mac:**
```bash
export GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

### Running the Server

```bash
# Development mode (auto-reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python main.py
```

The API will be available at: http://localhost:8000

## API Endpoints

### Quiz Endpoints

- `GET /categories` - Get all available question categories
- `GET /quiz/random?category={category}` - Get a random question from specified category
- `POST /quiz/check` - Check answer and get result with points
- `POST /quiz/skip` - Skip a question without penalty

### AI Mentor Endpoints

- `POST /mentor/ask` - Ask the AI mentor for advice
  - Request: `{ "user_question": "string", "context": "string" }`
  - Response: `{ "response": "string", "relevant_tips": ["string"] }`

- `GET /mentor/tips?count=3` - Get random study tips
- `POST /mentor/store-tip` - Store a new tip in the vector database
  - Request: `{ "tip": "string", "category": "string" }`

## Data Structure

### Question Format

Questions are stored in `cleaned_output_grouped.json`:

```json
{
  "CategoryName": {
    "mcq_single_correct": [
      {
        "q_id": "unique_id",
        "question_type": "mcq",
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "actual_answer": "Correct Option",
        "answer_explanation": "Explanation text"
      }
    ]
  }
}
```

## AI Features

### Gemini AI Mentor

The AI Mentor uses Google's Gemini Pro model to provide:
- Personalized productivity advice
- Strategies to overcome procrastination
- Time management techniques (Pomodoro, Time-blocking, etc.)
- Cognitive-behavioral interventions (5-minute rule, Swiss Cheese Method)
- Empathetic, non-judgmental guidance

### Vector Database (ChromaDB)

Study tips and motivational content are stored in ChromaDB for:
- Semantic search of relevant tips based on user questions
- Context-aware mentor responses
- Building a knowledge base of productivity techniques

Default tips include:
- The 5-minute rule
- Swiss Cheese Method
- Time-blocking strategies
- Energy management
- Implementation intentions
- And more...

## Error Handling

- All endpoints return appropriate HTTP status codes
- 404: Resource not found
- 500: Server error
- 503: Service unavailable (e.g., AI not configured)

## Development

### Adding New Question Categories

1. Update `cleaned_output_grouped.json` with new category
2. Add questions following the existing format
3. The `/categories` endpoint will automatically include the new category

### Customizing AI Responses

Edit the prompt in the `/mentor/ask` endpoint to adjust:
- Tone and style
- Response length
- Specific techniques emphasized
- Output format

## Technologies Used

- **FastAPI**: Modern, fast web framework
- **Google Generative AI**: Gemini Pro for AI mentoring
- **ChromaDB**: Vector database for semantic search
- **Sentence Transformers**: Text embeddings
- **Pydantic**: Data validation

## Troubleshooting

### "Failed to fetch" error in frontend

1. Ensure backend is running on port 8000
2. Check CORS settings in `main.py` - should include your frontend URL
3. Verify `cleaned_output_grouped.json` exists and is valid

### AI Mentor not working

1. Verify GEMINI_API_KEY environment variable is set
2. Check API key is valid and has quota
3. Review backend logs for detailed error messages

### ChromaDB issues

- ChromaDB runs in-memory by default
- Data is persistent across server restarts
- If issues occur, delete the chroma database folder and restart

## License

Part of the Momentum App - Student Productivity & Anti-Procrastination Tool
