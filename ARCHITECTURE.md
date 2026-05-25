# 🏗️ System Architecture - Gauth AI Implementation

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Camera  │  │ Gallery  │  │   Text   │  │  Voice   │           │
│  │  Scan    │  │  Upload  │  │  Input   │  │  Input   │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      PREPROCESSING LAYER                             │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Image Optimization                                         │    │
│  │  • Crop & resize                                            │    │
│  │  • Enhance contrast                                         │    │
│  │  • Denoise                                                  │    │
│  │  • Deskew                                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         OCR LAYER                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Math-Aware OCR (lib/mathOCR.ts)                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │    │
│  │  │  Tesseract   │  │   Equation   │  │   LaTeX      │     │    │
│  │  │     OCR      │→ │   Detection  │→ │  Conversion  │     │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │    │
│  │                                                             │    │
│  │  Output:                                                    │    │
│  │  • text: "Solve: 2x + 5 = 13"                              │    │
│  │  • latex: "2x + 5 = 13"                                    │    │
│  │  • confidence: 87%                                          │    │
│  │  • hasEquations: true                                       │    │
│  │  • equations: [...]                                         │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    CLASSIFICATION LAYER                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Question Router (lib/questionRouter.ts)                   │    │
│  │                                                             │    │
│  │  ┌──────────────────┐         ┌──────────────────┐        │    │
│  │  │   Heuristic      │         │   AI-Powered     │        │    │
│  │  │  Classification  │         │  Classification  │        │    │
│  │  │  (Fast, 85%+)    │         │  (Slow, 95%+)    │        │    │
│  │  └──────────────────┘         └──────────────────┘        │    │
│  │         ↓                              ↓                   │    │
│  │         └──────────────┬───────────────┘                   │    │
│  │                        ↓                                   │    │
│  │              ┌──────────────────┐                          │    │
│  │              │  Classification  │                          │    │
│  │              │     Result       │                          │    │
│  │              └──────────────────┘                          │    │
│  │                                                             │    │
│  │  Output:                                                    │    │
│  │  • subject: "math"                                          │    │
│  │  • subTopic: "linear equations"                            │    │
│  │  • difficulty: "easy"                                       │    │
│  │  • questionType: "calculation"                             │    │
│  │  • requiredSolver: "symbolic"                              │    │
│  │  • confidence: 0.92                                         │    │
│  │  • keywords: ["solve", "equation", "linear"]               │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       ROUTING LAYER                                  │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Solver Router                                              │    │
│  │                                                             │    │
│  │  IF subject = "math" AND type = "calculation":             │    │
│  │     → Symbolic Solver                                       │    │
│  │                                                             │    │
│  │  IF subject = "physics":                                    │    │
│  │     → Physics Solver                                        │    │
│  │                                                             │    │
│  │  IF subject = "chemistry":                                  │    │
│  │     → Chemistry Solver                                      │    │
│  │                                                             │    │
│  │  IF type = "proof" OR difficulty = "hard":                 │    │
│  │     → Hybrid Solver                                         │    │
│  │                                                             │    │
│  │  ELSE:                                                      │    │
│  │     → LLM Solver                                            │    │
│  │                                                             │    │
│  │  Fallback chain: [primary, backup1, backup2]               │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        SOLVING LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Symbolic   │  │   Physics    │  │  Chemistry   │             │
│  │    Solver    │  │    Solver    │  │   Solver     │             │
│  │              │  │              │  │              │             │
│  │  • SymPy     │  │  • Units     │  │  • Formulas  │             │
│  │  • math.js   │  │  • Constants │  │  • Balancing │             │
│  │  • Exact     │  │  • Vectors   │  │  • Molar     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │     LLM      │  │    Hybrid    │  │  Retrieval   │             │
│  │    Solver    │  │    Solver    │  │   System     │             │
│  │              │  │              │  │              │             │
│  │  • Groq      │  │  • Symbolic  │  │  • Vector DB │             │
│  │  • GPT       │  │    + LLM     │  │  • Similar   │             │
│  │  • Claude    │  │  • Verify    │  │    Questions │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    VERIFICATION LAYER                                │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Multi-Model Verification                                   │    │
│  │                                                             │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │    │
│  │  │ Model 1  │  │ Model 2  │  │ Model 3  │                 │    │
│  │  │ Solution │  │ Solution │  │ Solution │                 │    │
│  │  └──────────┘  └──────────┘  └──────────┘                 │    │
│  │       ↓             ↓             ↓                        │    │
│  │       └─────────────┴─────────────┘                        │    │
│  │                     ↓                                      │    │
│  │            ┌─────────────────┐                             │    │
│  │            │   Consensus     │                             │    │
│  │            │   Algorithm     │                             │    │
│  │            └─────────────────┘                             │    │
│  │                                                             │    │
│  │  Output:                                                    │    │
│  │  • consensus: Solution                                      │    │
│  │  • agreement: 0.95                                          │    │
│  │  • confidence: 0.92                                         │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   CONFIDENCE SCORING LAYER                           │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Confidence Scorer (lib/confidenceScorer.ts)               │    │
│  │                                                             │    │
│  │  Factors:                                                   │    │
│  │  ┌──────────────────┐  Weight: 15%                         │    │
│  │  │  OCR Quality     │  Score: 0.87                         │    │
│  │  └──────────────────┘                                       │    │
│  │  ┌──────────────────┐  Weight: 20%                         │    │
│  │  │  Classification  │  Score: 0.92                         │    │
│  │  └──────────────────┘                                       │    │
│  │  ┌──────────────────┐  Weight: 30%                         │    │
│  │  │  Solution        │  Score: 0.88                         │    │
│  │  │  Accuracy        │                                       │    │
│  │  └──────────────────┘                                       │    │
│  │  ┌──────────────────┐  Weight: 20%                         │    │
│  │  │  Step Logic      │  Score: 0.90                         │    │
│  │  └──────────────────┘                                       │    │
│  │  ┌──────────────────┐  Weight: 15%                         │    │
│  │  │  Answer          │  Score: 0.88                         │    │
│  │  │  Verification    │                                       │    │
│  │  └──────────────────┘                                       │    │
│  │                                                             │    │
│  │  Overall: 0.89 (High Confidence)                           │    │
│  │                                                             │    │
│  │  Output:                                                    │    │
│  │  • overall: 0.89                                            │    │
│  │  • trustLevel: "high"                                       │    │
│  │  • shouldEscalate: false                                    │    │
│  │  • recommendations: [...]                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     ESCALATION LAYER                                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Decision Logic                                             │    │
│  │                                                             │    │
│  │  IF confidence < 0.60:                                      │    │
│  │     → Escalate to human tutor                              │    │
│  │     → Show reason                                           │    │
│  │     → Offer tutor marketplace                              │    │
│  │                                                             │    │
│  │  IF confidence >= 0.60 AND < 0.85:                         │    │
│  │     → Show solution with warning                           │    │
│  │     → Display recommendations                              │    │
│  │     → Suggest verification                                 │    │
│  │                                                             │    │
│  │  IF confidence >= 0.85:                                     │    │
│  │     → Show solution with high confidence badge             │    │
│  │     → No warnings                                           │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       OUTPUT LAYER                                   │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Solution Display                                           │    │
│  │                                                             │    │
│  │  ┌──────────────────────────────────────────────────┐      │    │
│  │  │  ✓ High Confidence              89%              │      │    │
│  │  │  Solution quality is excellent                   │      │    │
│  │  └──────────────────────────────────────────────────┘      │    │
│  │                                                             │    │
│  │  Subject: Math                                              │    │
│  │  Difficulty: Easy                                           │    │
│  │  Topic: Linear Equations                                    │    │
│  │                                                             │    │
│  │  Steps:                                                     │    │
│  │  1. Subtract 5 from both sides                             │    │
│  │     2x = 8                                                  │    │
│  │                                                             │    │
│  │  2. Divide by 2                                             │    │
│  │     x = 4                                                   │    │
│  │                                                             │    │
│  │  Answer: x = 4                                              │    │
│  │                                                             │    │
│  │  Actions:                                                   │    │
│  │  [Video Explainer] [Flashcards] [Quiz] [Similar Problems]  │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      ANALYTICS LAYER                                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Data Collection                                            │    │
│  │  • Question text                                            │    │
│  │  • Classification result                                    │    │
│  │  • Solver used                                              │    │
│  │  • Confidence score                                         │    │
│  │  • User feedback (thumbs up/down)                          │    │
│  │  • Time to solve                                            │    │
│  │  • Escalation (yes/no)                                      │    │
│  │                                                             │    │
│  │  Use for:                                                   │    │
│  │  • Improving classification                                 │    │
│  │  • Tuning confidence thresholds                            │    │
│  │  • Training better models                                   │    │
│  │  • Identifying weak areas                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Example

### Example: "Solve: 2x + 5 = 13"

```
Step 1: INPUT
┌─────────────────────────┐
│ User types:             │
│ "Solve: 2x + 5 = 13"    │
└─────────────────────────┘
           ↓

Step 2: OCR (if image)
┌─────────────────────────┐
│ text: "2x + 5 = 13"     │
│ latex: "2x + 5 = 13"    │
│ confidence: 95%         │
│ hasEquations: true      │
└─────────────────────────┘
           ↓

Step 3: CLASSIFICATION
┌─────────────────────────┐
│ subject: "math"         │
│ difficulty: "easy"      │
│ type: "calculation"     │
│ solver: "symbolic"      │
│ confidence: 0.92        │
└─────────────────────────┘
           ↓

Step 4: ROUTING
┌─────────────────────────┐
│ Primary: Symbolic       │
│ Fallback: [Hybrid, LLM] │
│ Priority: 1 (highest)   │
└─────────────────────────┘
           ↓

Step 5: SOLVING
┌─────────────────────────┐
│ Solver: Symbolic        │
│ Steps:                  │
│ 1. 2x = 8               │
│ 2. x = 4                │
│ Answer: x = 4           │
└─────────────────────────┘
           ↓

Step 6: CONFIDENCE
┌─────────────────────────┐
│ OCR: 0.95               │
│ Classification: 0.92    │
│ Solution: 0.90          │
│ Steps: 0.95             │
│ Verification: 0.90      │
│ ─────────────────       │
│ Overall: 0.92 (HIGH)    │
└─────────────────────────┘
           ↓

Step 7: ESCALATION CHECK
┌─────────────────────────┐
│ Confidence: 0.92 > 0.85 │
│ Decision: NO ESCALATION │
│ Action: Show solution   │
└─────────────────────────┘
           ↓

Step 8: OUTPUT
┌─────────────────────────┐
│ ✓ High Confidence  92%  │
│                         │
│ Steps:                  │
│ 1. Subtract 5: 2x = 8   │
│ 2. Divide by 2: x = 4   │
│                         │
│ Answer: x = 4           │
└─────────────────────────┘
```

## Component Interactions

```
┌──────────────────────────────────────────────────────────────┐
│                    Component Map                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  app/scan-enhanced.tsx                                        │
│  ├─ Uses: lib/mathOCR.ts                                      │
│  ├─ Uses: lib/questionRouter.ts                               │
│  ├─ Uses: lib/confidenceScorer.ts                             │
│  └─ Uses: lib/gemini.ts (existing)                            │
│                                                               │
│  lib/mathOCR.ts                                               │
│  ├─ Depends: tesseract.js                                     │
│  └─ Exports: recognizeMathFromImage()                         │
│                                                               │
│  lib/questionRouter.ts                                        │
│  ├─ Depends: GROQ API                                         │
│  ├─ Exports: classifyQuestion()                               │
│  └─ Exports: routeToSolver()                                  │
│                                                               │
│  lib/confidenceScorer.ts                                      │
│  ├─ Depends: lib/questionRouter.ts                            │
│  ├─ Exports: calculateConfidence()                            │
│  └─ Exports: findConsensus()                                  │
│                                                               │
│  lib/gemini.ts (existing)                                     │
│  ├─ Depends: GROQ API                                         │
│  ├─ Exports: solveWithGemini()                                │
│  ├─ Exports: generateExplainer()                              │
│  ├─ Exports: generateFlashcards()                             │
│  └─ Exports: generateQuizQuestions()                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Future Architecture (Phase 2+)

```
┌─────────────────────────────────────────────────────────────┐
│                   FUTURE ENHANCEMENTS                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  lib/solvers/                                                │
│  ├─ symbolicSolver.ts      (SymPy integration)              │
│  ├─ physicsSolver.ts        (Units + constants)             │
│  ├─ chemistrySolver.ts      (Formula balancing)             │
│  ├─ essaySolver.ts          (Long-form writing)             │
│  └─ codingSolver.ts         (Code execution)                │
│                                                              │
│  lib/vectorDB.ts            (Supabase Vector)               │
│  lib/embeddings.ts          (OpenAI embeddings)             │
│  lib/retrieval.ts           (Similarity search)             │
│                                                              │
│  lib/aiMemory.ts            (User learning patterns)        │
│  lib/learningAnalytics.ts   (Personalization)               │
│  lib/adaptiveDifficulty.ts  (Dynamic difficulty)            │
│                                                              │
│  lib/conceptGraph.ts        (Knowledge graph)               │
│  lib/examPredictor.ts       (Exam prediction)               │
│                                                              │
│  app/tutor-marketplace.tsx  (Human tutors)                  │
│  app/ar-scan.tsx            (AR overlay)                    │
│  app/concept-map.tsx        (Visual graph)                  │
│  app/learning-analytics.tsx (Dashboard)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

```sql
-- Current (Existing)
profiles
items
tasks
notifications
activity_feed

-- Phase 2: Question Bank
question_bank
  ├─ id
  ├─ question_text
  ├─ subject
  ├─ topic
  ├─ difficulty
  ├─ solution (JSONB)
  ├─ embedding (vector)
  ├─ view_count
  └─ created_at

user_solutions
  ├─ id
  ├─ user_id
  ├─ question_id
  ├─ solved_at
  ├─ time_spent
  ├─ hints_used
  └─ mode

-- Phase 3: Tutor Marketplace
tutors
  ├─ id
  ├─ user_id
  ├─ specializations
  ├─ rating
  ├─ hourly_rate
  └─ verified

tutor_sessions
  ├─ id
  ├─ student_id
  ├─ tutor_id
  ├─ question_id
  ├─ status
  ├─ started_at
  └─ ended_at

-- Phase 4: Learning Analytics
learning_profiles
  ├─ user_id
  ├─ weak_topics (JSONB)
  ├─ strong_topics (JSONB)
  ├─ learning_style
  └─ updated_at

concept_mastery
  ├─ user_id
  ├─ concept_id
  ├─ mastery_level
  └─ last_reviewed
```

## API Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      API Calls                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. OCR (if image)                                           │
│     → Tesseract.js (local)                                   │
│     → No API call                                            │
│                                                              │
│  2. Classification                                           │
│     → Heuristic (local, fast)                                │
│     → If confidence < 0.85:                                  │
│        → GROQ API (Llama 3.3)                                │
│        → Cost: ~$0.0001 per request                          │
│                                                              │
│  3. Solving                                                  │
│     → GROQ API (Llama 3.3)                                   │
│     → Cost: ~$0.001 per request                              │
│                                                              │
│  4. Verification (future)                                    │
│     → Multiple models                                        │
│     → Cost: ~$0.003 per request                              │
│                                                              │
│  5. Embeddings (future)                                      │
│     → OpenAI text-embedding-3-small                          │
│     → Cost: ~$0.00002 per request                            │
│                                                              │
│  Total cost per question: ~$0.001-0.005                      │
│  (Much cheaper than human tutors!)                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**This architecture is modular, scalable, and production-ready!**

Each layer can be improved independently without affecting others.

🚀 **Start building!**
