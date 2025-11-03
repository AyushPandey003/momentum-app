-- Quick Seed Script for Contest Questions
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID from your database

-- First, let's check if we have users
-- SELECT id, name, email FROM "user" LIMIT 5;

-- Create a seed admin user if needed (uncomment and run if you need one)
-- INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
-- VALUES ('seed_admin', 'Question Admin', 'admin@momentum.app', true, NOW(), NOW())
-- ON CONFLICT (email) DO NOTHING;

-- Programming Questions - Easy
INSERT INTO problem_set (id, question, options, correct_answer, explanation, difficulty, type, category, tags, points, time_allocation_seconds, created_by, is_active, created_at)
VALUES 
('ps_prog_easy_1', 'What does HTML stand for?', 
 '["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"]',
 'Hyper Text Markup Language',
 'HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.',
 'easy', 'multiple_choice', 'Programming', '["web", "basics", "html"]', 5, 30, 
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_prog_easy_2', 'Which programming language is known as the ''language of the web''?',
 '["Python", "Java", "JavaScript", "C++"]',
 'JavaScript',
 'JavaScript is known as the language of the web because it runs in web browsers and is essential for interactive web pages.',
 'easy', 'multiple_choice', 'Programming', '["web", "javascript", "basics"]', 5, 30,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_prog_easy_3', 'What is the correct way to declare a variable in JavaScript?',
 '["var x = 5;", "variable x = 5;", "v x = 5;", "int x = 5;"]',
 'var x = 5;',
 'In JavaScript, you can declare variables using var, let, or const keywords.',
 'easy', 'multiple_choice', 'Programming', '["javascript", "variables", "syntax"]', 5, 30,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_prog_easy_4', 'CSS is used for styling web pages.',
 '["True", "False"]',
 'True',
 'CSS (Cascading Style Sheets) is the language used to style HTML elements on web pages.',
 'easy', 'true_false', 'Programming', '["web", "css", "basics"]', 5, 20,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_prog_easy_5', 'What does SQL stand for?',
 '["Structured Query Language", "Simple Question Language", "Strong Question Language", "Structured Quick Language"]',
 'Structured Query Language',
 'SQL stands for Structured Query Language, used for managing and querying relational databases.',
 'easy', 'multiple_choice', 'Programming', '["database", "sql", "basics"]', 5, 30,
 'YOUR_USER_ID_HERE', true, NOW());

-- Programming Questions - Medium
INSERT INTO problem_set (id, question, options, correct_answer, explanation, difficulty, type, category, tags, points, time_allocation_seconds, created_by, is_active, created_at)
VALUES 
('ps_prog_med_1', 'What is the time complexity of binary search algorithm?',
 '["O(n)", "O(log n)", "O(n^2)", "O(1)"]',
 'O(log n)',
 'Binary search has a time complexity of O(log n) because it divides the search space in half with each iteration.',
 'medium', 'multiple_choice', 'Programming', '["algorithms", "complexity", "data-structures"]', 10, 60,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_prog_med_2', 'In React, what is the purpose of useEffect hook?',
 '["To manage component state", "To handle side effects and lifecycle events", "To create context", "To optimize performance"]',
 'To handle side effects and lifecycle events',
 'useEffect is used to perform side effects in functional components, similar to componentDidMount, componentDidUpdate, and componentWillUnmount in class components.',
 'medium', 'multiple_choice', 'Programming', '["react", "hooks", "frontend"]', 10, 60,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_prog_med_3', 'What is the difference between ''=='' and ''==='' in JavaScript?',
 '["No difference, they are the same", "''=='' checks value only, ''==='' checks value and type", "''=='' is faster than ''===''", "''==='' is deprecated"]',
 '''=='' checks value only, ''==='' checks value and type',
 '''=='' performs type coercion before comparison, while ''==='' (strict equality) compares both value and type without coercion.',
 'medium', 'multiple_choice', 'Programming', '["javascript", "operators", "comparison"]', 10, 60,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_prog_med_4', 'REST API uses HTTP methods like GET, POST, PUT, and DELETE.',
 '["True", "False"]',
 'True',
 'REST APIs use standard HTTP methods: GET for reading, POST for creating, PUT for updating, and DELETE for removing resources.',
 'medium', 'true_false', 'Programming', '["api", "rest", "http"]', 10, 45,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_prog_med_5', 'What is the purpose of the ''async'' keyword in JavaScript?',
 '["To make a function return a Promise", "To make a function run faster", "To make a function synchronous", "To import modules asynchronously"]',
 'To make a function return a Promise',
 'The ''async'' keyword before a function makes it return a Promise automatically, allowing the use of ''await'' inside it.',
 'medium', 'multiple_choice', 'Programming', '["javascript", "async", "promises"]', 10, 60,
 'YOUR_USER_ID_HERE', true, NOW());

-- Programming Questions - Hard
INSERT INTO problem_set (id, question, options, correct_answer, explanation, difficulty, type, category, tags, points, time_allocation_seconds, created_by, is_active, created_at)
VALUES 
('ps_prog_hard_1', 'What is the space complexity of merge sort algorithm?',
 '["O(1)", "O(log n)", "O(n)", "O(n log n)"]',
 'O(n)',
 'Merge sort requires O(n) extra space for the temporary arrays used during the merging process.',
 'hard', 'multiple_choice', 'Programming', '["algorithms", "sorting", "complexity"]', 15, 90,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_prog_hard_2', 'In a B-tree of order m, what is the maximum number of children a node can have?',
 '["m-1", "m", "m+1", "2m"]',
 'm',
 'In a B-tree of order m, a node can have at most m children and m-1 keys.',
 'hard', 'multiple_choice', 'Programming', '["data-structures", "trees", "b-tree"]', 15, 90,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_prog_hard_3', 'What is the primary purpose of the Virtual DOM in React?',
 '["To store component state", "To minimize direct DOM manipulation and improve performance", "To handle routing", "To manage API calls"]',
 'To minimize direct DOM manipulation and improve performance',
 'Virtual DOM is a lightweight copy of the actual DOM. React uses it to efficiently determine what changes need to be made to the real DOM, minimizing expensive DOM operations.',
 'hard', 'multiple_choice', 'Programming', '["react", "virtual-dom", "performance"]', 15, 90,
 'YOUR_USER_ID_HERE', true, NOW());

-- Math Questions
INSERT INTO problem_set (id, question, options, correct_answer, explanation, difficulty, type, category, tags, points, time_allocation_seconds, created_by, is_active, created_at)
VALUES 
('ps_math_easy_1', 'What is 15% of 200?',
 '["25", "30", "35", "40"]',
 '30',
 '15% of 200 = 0.15 × 200 = 30',
 'easy', 'multiple_choice', 'Math', '["percentage", "arithmetic", "basic"]', 5, 30,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_math_easy_2', 'Is the square root of 144 equal to 12?',
 '["True", "False"]',
 'True',
 '√144 = 12 because 12 × 12 = 144',
 'easy', 'true_false', 'Math', '["square-root", "arithmetic", "basic"]', 5, 20,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_math_easy_3', 'What is the sum of angles in a triangle?',
 '["90°", "180°", "270°", "360°"]',
 '180°',
 'The sum of all interior angles in any triangle is always 180 degrees.',
 'easy', 'multiple_choice', 'Math', '["geometry", "triangles", "angles"]', 5, 30,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_math_med_1', 'What is the derivative of x²?',
 '["x", "2x", "x²", "2x²"]',
 '2x',
 'Using the power rule, d/dx(x²) = 2x^(2-1) = 2x',
 'medium', 'multiple_choice', 'Math', '["calculus", "derivatives", "differentiation"]', 10, 60,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_math_hard_1', 'What is the integral of 1/x with respect to x?',
 '["ln|x| + C", "x²/2 + C", "1/x² + C", "e^x + C"]',
 'ln|x| + C',
 'The integral of 1/x is the natural logarithm of the absolute value of x, plus a constant of integration.',
 'hard', 'multiple_choice', 'Math', '["calculus", "integration", "logarithm"]', 15, 90,
 'YOUR_USER_ID_HERE', true, NOW());

-- Logic Questions
INSERT INTO problem_set (id, question, options, correct_answer, explanation, difficulty, type, category, tags, points, time_allocation_seconds, created_by, is_active, created_at)
VALUES 
('ps_logic_easy_1', 'If all cats are mammals, and all mammals are animals, then all cats are animals.',
 '["True", "False"]',
 'True',
 'This is a valid logical syllogism using transitive property.',
 'easy', 'true_false', 'Logic', '["reasoning", "syllogism", "deduction"]', 5, 30,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_logic_easy_2', 'What comes next in the sequence: 2, 4, 8, 16, __?',
 '["20", "24", "32", "64"]',
 '32',
 'Each number is multiplied by 2 to get the next number. 16 × 2 = 32',
 'easy', 'multiple_choice', 'Logic', '["patterns", "sequences", "arithmetic"]', 5, 30,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_logic_med_1', 'In a room of 23 people, what is the approximate probability that two people share the same birthday?',
 '["Less than 10%", "About 25%", "About 50%", "About 75%"]',
 'About 50%',
 'This is the famous birthday paradox. With 23 people, the probability is about 50.7% that at least two share a birthday.',
 'medium', 'multiple_choice', 'Logic', '["probability", "paradox", "statistics"]', 10, 60,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_logic_hard_1', 'The Monty Hall problem demonstrates that switching doors increases your probability of winning from 1/3 to 2/3.',
 '["True", "False"]',
 'True',
 'In the Monty Hall problem, switching doors after the host reveals a goat increases your probability of winning the car from 1/3 to 2/3, which is counterintuitive but mathematically correct.',
 'hard', 'true_false', 'Logic', '["probability", "game-theory", "paradox"]', 15, 90,
 'YOUR_USER_ID_HERE', true, NOW());

-- General Knowledge Questions
INSERT INTO problem_set (id, question, options, correct_answer, explanation, difficulty, type, category, tags, points, time_allocation_seconds, created_by, is_active, created_at)
VALUES 
('ps_gk_easy_1', 'What is the capital of France?',
 '["London", "Berlin", "Paris", "Madrid"]',
 'Paris',
 'Paris is the capital and largest city of France.',
 'easy', 'multiple_choice', 'General Knowledge', '["geography", "capitals", "europe"]', 5, 20,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_gk_easy_2', 'The Earth revolves around the Sun.',
 '["True", "False"]',
 'True',
 'The Earth orbits the Sun in an elliptical path, taking approximately 365.25 days to complete one revolution.',
 'easy', 'true_false', 'General Knowledge', '["science", "astronomy", "solar-system"]', 5, 20,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_gk_med_1', 'Who wrote the play ''Romeo and Juliet''?',
 '["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"]',
 'William Shakespeare',
 'Romeo and Juliet is a tragedy written by William Shakespeare early in his career, believed to be written between 1594 and 1596.',
 'medium', 'multiple_choice', 'General Knowledge', '["literature", "shakespeare", "drama"]', 10, 45,
 'YOUR_USER_ID_HERE', true, NOW()),

('ps_gk_hard_1', 'What is the speed of light in a vacuum?',
 '["299,792,458 meters per second", "300,000,000 meters per second", "150,000,000 meters per second", "250,000,000 meters per second"]',
 '299,792,458 meters per second',
 'The speed of light in a vacuum is exactly 299,792,458 meters per second, a fundamental constant in physics.',
 'hard', 'multiple_choice', 'General Knowledge', '["physics", "constants", "light"]', 15, 90,
 'YOUR_USER_ID_HERE', true, NOW());

-- Verify what was inserted
SELECT 
    category,
    difficulty,
    COUNT(*) as count
FROM problem_set
GROUP BY category, difficulty
ORDER BY category, difficulty;

-- Total count
SELECT COUNT(*) as total_questions FROM problem_set;
