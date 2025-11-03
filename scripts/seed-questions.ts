import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";

const sampleQuestions = [
  // Programming - Easy
  {
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Tech Modern Language",
      "Home Tool Markup Language",
      "Hyperlinks and Text Markup Language"
    ],
    correctAnswer: "Hyper Text Markup Language",
    explanation: "HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.",
    difficulty: "easy" as const,
    type: "multiple_choice" as const,
    category: "Programming",
    tags: ["web", "basics", "html"],
    points: 5,
    timeAllocationSeconds: 30
  },
  {
    question: "Which programming language is known as the 'language of the web'?",
    options: ["Python", "Java", "JavaScript", "C++"],
    correctAnswer: "JavaScript",
    explanation: "JavaScript is known as the language of the web because it runs in web browsers and is essential for interactive web pages.",
    difficulty: "easy" as const,
    type: "multiple_choice" as const,
    category: "Programming",
    tags: ["web", "javascript", "basics"],
    points: 5,
    timeAllocationSeconds: 30
  },
  {
    question: "What is the correct way to declare a variable in JavaScript?",
    options: ["var x = 5;", "variable x = 5;", "v x = 5;", "int x = 5;"],
    correctAnswer: "var x = 5;",
    explanation: "In JavaScript, you can declare variables using var, let, or const keywords.",
    difficulty: "easy" as const,
    type: "multiple_choice" as const,
    category: "Programming",
    tags: ["javascript", "variables", "syntax"],
    points: 5,
    timeAllocationSeconds: 30
  },
  {
    question: "CSS is used for styling web pages.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "CSS (Cascading Style Sheets) is the language used to style HTML elements on web pages.",
    difficulty: "easy" as const,
    type: "true_false" as const,
    category: "Programming",
    tags: ["web", "css", "basics"],
    points: 5,
    timeAllocationSeconds: 20
  },
  {
    question: "What does SQL stand for?",
    options: [
      "Structured Query Language",
      "Simple Question Language",
      "Strong Question Language",
      "Structured Quick Language"
    ],
    correctAnswer: "Structured Query Language",
    explanation: "SQL stands for Structured Query Language, used for managing and querying relational databases.",
    difficulty: "easy" as const,
    type: "multiple_choice" as const,
    category: "Programming",
    tags: ["database", "sql", "basics"],
    points: 5,
    timeAllocationSeconds: 30
  },

  // Programming - Medium
  {
    question: "What is the time complexity of binary search algorithm?",
    options: ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
    correctAnswer: "O(log n)",
    explanation: "Binary search has a time complexity of O(log n) because it divides the search space in half with each iteration.",
    difficulty: "medium" as const,
    type: "multiple_choice" as const,
    category: "Programming",
    tags: ["algorithms", "complexity", "data-structures"],
    points: 10,
    timeAllocationSeconds: 60
  },
  {
    question: "In React, what is the purpose of useEffect hook?",
    options: [
      "To manage component state",
      "To handle side effects and lifecycle events",
      "To create context",
      "To optimize performance"
    ],
    correctAnswer: "To handle side effects and lifecycle events",
    explanation: "useEffect is used to perform side effects in functional components, similar to componentDidMount, componentDidUpdate, and componentWillUnmount in class components.",
    difficulty: "medium" as const,
    type: "multiple_choice" as const,
    category: "Programming",
    tags: ["react", "hooks", "frontend"],
    points: 10,
    timeAllocationSeconds: 60
  },
  {
    question: "What is the difference between '==' and '===' in JavaScript?",
    options: [
      "No difference, they are the same",
      "'==' checks value only, '===' checks value and type",
      "'==' is faster than '==='",
      "'===' is deprecated"
    ],
    correctAnswer: "'==' checks value only, '===' checks value and type",
    explanation: "'==' performs type coercion before comparison, while '===' (strict equality) compares both value and type without coercion.",
    difficulty: "medium" as const,
    type: "multiple_choice" as const,
    category: "Programming",
    tags: ["javascript", "operators", "comparison"],
    points: 10,
    timeAllocationSeconds: 60
  },
  {
    question: "REST API uses HTTP methods like GET, POST, PUT, and DELETE.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "REST APIs use standard HTTP methods: GET for reading, POST for creating, PUT for updating, and DELETE for removing resources.",
    difficulty: "medium" as const,
    type: "true_false" as const,
    category: "Programming",
    tags: ["api", "rest", "http"],
    points: 10,
    timeAllocationSeconds: 45
  },
  {
    question: "What is the purpose of the 'async' keyword in JavaScript?",
    options: [
      "To make a function return a Promise",
      "To make a function run faster",
      "To make a function synchronous",
      "To import modules asynchronously"
    ],
    correctAnswer: "To make a function return a Promise",
    explanation: "The 'async' keyword before a function makes it return a Promise automatically, allowing the use of 'await' inside it.",
    difficulty: "medium" as const,
    type: "multiple_choice" as const,
    category: "Programming",
    tags: ["javascript", "async", "promises"],
    points: 10,
    timeAllocationSeconds: 60
  },

  // Programming - Hard
  {
    question: "What is the space complexity of merge sort algorithm?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: "O(n)",
    explanation: "Merge sort requires O(n) extra space for the temporary arrays used during the merging process.",
    difficulty: "hard" as const,
    type: "multiple_choice" as const,
    category: "Programming",
    tags: ["algorithms", "sorting", "complexity"],
    points: 15,
    timeAllocationSeconds: 90
  },
  {
    question: "In a B-tree of order m, what is the maximum number of children a node can have?",
    options: ["m-1", "m", "m+1", "2m"],
    correctAnswer: "m",
    explanation: "In a B-tree of order m, a node can have at most m children and m-1 keys.",
    difficulty: "hard" as const,
    type: "multiple_choice" as const,
    category: "Programming",
    tags: ["data-structures", "trees", "b-tree"],
    points: 15,
    timeAllocationSeconds: 90
  },
  {
    question: "What is the primary purpose of the Virtual DOM in React?",
    options: [
      "To store component state",
      "To minimize direct DOM manipulation and improve performance",
      "To handle routing",
      "To manage API calls"
    ],
    correctAnswer: "To minimize direct DOM manipulation and improve performance",
    explanation: "Virtual DOM is a lightweight copy of the actual DOM. React uses it to efficiently determine what changes need to be made to the real DOM, minimizing expensive DOM operations.",
    difficulty: "hard" as const,
    type: "multiple_choice" as const,
    category: "Programming",
    tags: ["react", "virtual-dom", "performance"],
    points: 15,
    timeAllocationSeconds: 90
  },
  {
    question: "Database normalization always improves query performance.",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "While normalization reduces data redundancy and improves data integrity, it can sometimes decrease query performance due to the need for more complex joins. Denormalization is sometimes used to optimize read performance.",
    difficulty: "hard" as const,
    type: "true_false" as const,
    category: "Programming",
    tags: ["database", "normalization", "optimization"],
    points: 15,
    timeAllocationSeconds: 90
  },
  {
    question: "What is the purpose of a memory leak in programming?",
    options: [
      "To optimize memory usage",
      "It's an unintended bug where memory is not properly released",
      "To share memory between processes",
      "To cache data efficiently"
    ],
    correctAnswer: "It's an unintended bug where memory is not properly released",
    explanation: "A memory leak is a bug where a program fails to release memory that is no longer needed, gradually consuming more memory over time and potentially causing performance issues or crashes.",
    difficulty: "hard" as const,
    type: "multiple_choice" as const,
    category: "Programming",
    tags: ["memory", "debugging", "performance"],
    points: 15,
    timeAllocationSeconds: 90
  },

  // Math - Easy
  {
    question: "What is 15% of 200?",
    options: ["25", "30", "35", "40"],
    correctAnswer: "30",
    explanation: "15% of 200 = 0.15 × 200 = 30",
    difficulty: "easy" as const,
    type: "multiple_choice" as const,
    category: "Math",
    tags: ["percentage", "arithmetic", "basic"],
    points: 5,
    timeAllocationSeconds: 30
  },
  {
    question: "Is the square root of 144 equal to 12?",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "√144 = 12 because 12 × 12 = 144",
    difficulty: "easy" as const,
    type: "true_false" as const,
    category: "Math",
    tags: ["square-root", "arithmetic", "basic"],
    points: 5,
    timeAllocationSeconds: 20
  },
  {
    question: "What is the sum of angles in a triangle?",
    options: ["90°", "180°", "270°", "360°"],
    correctAnswer: "180°",
    explanation: "The sum of all interior angles in any triangle is always 180 degrees.",
    difficulty: "easy" as const,
    type: "multiple_choice" as const,
    category: "Math",
    tags: ["geometry", "triangles", "angles"],
    points: 5,
    timeAllocationSeconds: 30
  },

  // Math - Medium
  {
    question: "What is the derivative of x²?",
    options: ["x", "2x", "x²", "2x²"],
    correctAnswer: "2x",
    explanation: "Using the power rule, d/dx(x²) = 2x^(2-1) = 2x",
    difficulty: "medium" as const,
    type: "multiple_choice" as const,
    category: "Math",
    tags: ["calculus", "derivatives", "differentiation"],
    points: 10,
    timeAllocationSeconds: 60
  },
  {
    question: "In probability, two events are mutually exclusive if they cannot occur at the same time.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Mutually exclusive events are events that cannot happen simultaneously. If one occurs, the other cannot.",
    difficulty: "medium" as const,
    type: "true_false" as const,
    category: "Math",
    tags: ["probability", "statistics", "events"],
    points: 10,
    timeAllocationSeconds: 45
  },

  // Math - Hard
  {
    question: "What is the integral of 1/x with respect to x?",
    options: ["ln|x| + C", "x²/2 + C", "1/x² + C", "e^x + C"],
    correctAnswer: "ln|x| + C",
    explanation: "The integral of 1/x is the natural logarithm of the absolute value of x, plus a constant of integration.",
    difficulty: "hard" as const,
    type: "multiple_choice" as const,
    category: "Math",
    tags: ["calculus", "integration", "logarithm"],
    points: 15,
    timeAllocationSeconds: 90
  },

  // Logic - Easy
  {
    question: "If all cats are mammals, and all mammals are animals, then all cats are animals.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "This is a valid logical syllogism using transitive property.",
    difficulty: "easy" as const,
    type: "true_false" as const,
    category: "Logic",
    tags: ["reasoning", "syllogism", "deduction"],
    points: 5,
    timeAllocationSeconds: 30
  },
  {
    question: "What comes next in the sequence: 2, 4, 8, 16, __?",
    options: ["20", "24", "32", "64"],
    correctAnswer: "32",
    explanation: "Each number is multiplied by 2 to get the next number. 16 × 2 = 32",
    difficulty: "easy" as const,
    type: "multiple_choice" as const,
    category: "Logic",
    tags: ["patterns", "sequences", "arithmetic"],
    points: 5,
    timeAllocationSeconds: 30
  },

  // Logic - Medium
  {
    question: "In a room of 23 people, what is the approximate probability that two people share the same birthday?",
    options: ["Less than 10%", "About 25%", "About 50%", "About 75%"],
    correctAnswer: "About 50%",
    explanation: "This is the famous birthday paradox. With 23 people, the probability is about 50.7% that at least two share a birthday.",
    difficulty: "medium" as const,
    type: "multiple_choice" as const,
    category: "Logic",
    tags: ["probability", "paradox", "statistics"],
    points: 10,
    timeAllocationSeconds: 60
  },

  // Logic - Hard
  {
    question: "The Monty Hall problem demonstrates that switching doors increases your probability of winning from 1/3 to 2/3.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "In the Monty Hall problem, switching doors after the host reveals a goat increases your probability of winning the car from 1/3 to 2/3, which is counterintuitive but mathematically correct.",
    difficulty: "hard" as const,
    type: "true_false" as const,
    category: "Logic",
    tags: ["probability", "game-theory", "paradox"],
    points: 15,
    timeAllocationSeconds: 90
  },

  // General Knowledge - Easy
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: "Paris",
    explanation: "Paris is the capital and largest city of France.",
    difficulty: "easy" as const,
    type: "multiple_choice" as const,
    category: "General Knowledge",
    tags: ["geography", "capitals", "europe"],
    points: 5,
    timeAllocationSeconds: 20
  },
  {
    question: "The Earth revolves around the Sun.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "The Earth orbits the Sun in an elliptical path, taking approximately 365.25 days to complete one revolution.",
    difficulty: "easy" as const,
    type: "true_false" as const,
    category: "General Knowledge",
    tags: ["science", "astronomy", "solar-system"],
    points: 5,
    timeAllocationSeconds: 20
  },

  // General Knowledge - Medium
  {
    question: "Who wrote the play 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: "William Shakespeare",
    explanation: "Romeo and Juliet is a tragedy written by William Shakespeare early in his career, believed to be written between 1594 and 1596.",
    difficulty: "medium" as const,
    type: "multiple_choice" as const,
    category: "General Knowledge",
    tags: ["literature", "shakespeare", "drama"],
    points: 10,
    timeAllocationSeconds: 45
  },

  // General Knowledge - Hard
  {
    question: "What is the speed of light in a vacuum?",
    options: [
      "299,792,458 meters per second",
      "300,000,000 meters per second",
      "150,000,000 meters per second",
      "250,000,000 meters per second"
    ],
    correctAnswer: "299,792,458 meters per second",
    explanation: "The speed of light in a vacuum is exactly 299,792,458 meters per second, a fundamental constant in physics.",
    difficulty: "hard" as const,
    type: "multiple_choice" as const,
    category: "General Knowledge",
    tags: ["physics", "constants", "light"],
    points: 15,
    timeAllocationSeconds: 90
  }
];

async function seedQuestions() {
  console.log("🌱 Starting to seed questions...");

  // You'll need a user ID to create questions. 
  // This should be replaced with an actual admin user ID from your database
  const ADMIN_USER_ID = "xsWhWU4vDKYBzKdVlOz7DBNux2ypGDkG"; // Replace this with actual user ID

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const question of sampleQuestions) {
      try {
        const problemSetId = `ps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await db.insert(schema.problemSet).values({
          id: problemSetId,
          question: question.question,
          questionText: question.question, // Add questionText field for compatibility
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          difficulty: question.difficulty,
          type: question.type,
          category: question.category,
          tags: question.tags,
          points: question.points,
          timeAllocationSeconds: question.timeAllocationSeconds,
          createdBy: ADMIN_USER_ID,
          isActive: true,
          createdAt: new Date()
        });

        successCount++;
        console.log(`✅ Added: ${question.question.substring(0, 50)}...`);
        
        // Small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        errorCount++;
        console.error(`❌ Error adding question: ${question.question.substring(0, 50)}...`, error);
      }
    }

    console.log("\n📊 Summary:");
    console.log(`✅ Successfully added: ${successCount} questions`);
    console.log(`❌ Failed: ${errorCount} questions`);
    console.log("\n🎉 Seeding completed!");

    // Show statistics
    console.log("\n📈 Question Statistics:");
    const categories = [...new Set(sampleQuestions.map(q => q.category))];
    for (const category of categories) {
      const categoryQuestions = sampleQuestions.filter(q => q.category === category);
      const easy = categoryQuestions.filter(q => q.difficulty === "easy").length;
      const medium = categoryQuestions.filter(q => q.difficulty === "medium").length;
      const hard = categoryQuestions.filter(q => q.difficulty === "hard").length;
      console.log(`  ${category}: ${categoryQuestions.length} total (Easy: ${easy}, Medium: ${medium}, Hard: ${hard})`);
    }

  } catch (error) {
    console.error("❌ Fatal error during seeding:", error);
    process.exit(1);
  }
}

// Run the seed function
seedQuestions()
  .then(() => {
    console.log("\n✨ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
