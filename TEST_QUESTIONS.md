# Test Questions for Enhanced Scan System

Use these questions to test the enhanced scanning system and verify that classification, routing, and confidence scoring work correctly.

## 📐 Mathematics

### Easy
```
Solve: 2x + 5 = 13
Expected: subject=math, difficulty=easy, solver=symbolic, confidence=high
```

```
What is 15% of 200?
Expected: subject=math, difficulty=easy, solver=symbolic, confidence=high
```

```
Calculate: 3 × (4 + 5)
Expected: subject=math, difficulty=easy, solver=symbolic, confidence=high
```

### Medium
```
Solve: x² + 5x - 6 = 0
Expected: subject=math, difficulty=medium, solver=symbolic, confidence=high
```

```
Find the derivative of f(x) = 3x² + 2x - 5
Expected: subject=math, difficulty=medium, solver=symbolic, confidence=medium
```

```
Calculate the area of a circle with radius 7 cm
Expected: subject=math, difficulty=easy, solver=symbolic, confidence=high
```

### Hard
```
Prove that the sum of angles in a triangle is 180 degrees
Expected: subject=math, difficulty=hard, solver=hybrid, confidence=medium
```

```
Evaluate: ∫(2x + 3)dx from 0 to 5
Expected: subject=math, difficulty=hard, solver=symbolic, confidence=medium
```

```
Find the limit: lim(x→0) (sin x)/x
Expected: subject=math, difficulty=hard, solver=symbolic, confidence=medium
```

## ⚛️ Physics

### Easy
```
A car travels 100 km in 2 hours. What is its average speed?
Expected: subject=physics, difficulty=easy, solver=physics, confidence=high
```

```
What is the SI unit of force?
Expected: subject=physics, difficulty=easy, solver=llm, confidence=high
```

### Medium
```
A car accelerates from 0 to 60 m/s in 10 seconds. Calculate the acceleration.
Expected: subject=physics, difficulty=medium, solver=physics, confidence=high
```

```
Calculate the kinetic energy of a 5 kg object moving at 10 m/s
Expected: subject=physics, difficulty=medium, solver=physics, confidence=high
```

```
Explain Newton's second law of motion
Expected: subject=physics, difficulty=medium, solver=llm, confidence=high
```

### Hard
```
A projectile is launched at 45° with initial velocity 20 m/s. Find the maximum height.
Expected: subject=physics, difficulty=hard, solver=physics, confidence=medium
```

```
Derive the equation for gravitational potential energy
Expected: subject=physics, difficulty=hard, solver=hybrid, confidence=medium
```

## 🧪 Chemistry

### Easy
```
What is the chemical formula for water?
Expected: subject=chemistry, difficulty=easy, solver=llm, confidence=high
```

```
How many protons does carbon have?
Expected: subject=chemistry, difficulty=easy, solver=llm, confidence=high
```

### Medium
```
Balance the equation: Fe + O₂ → Fe₂O₃
Expected: subject=chemistry, difficulty=medium, solver=chemistry, confidence=high
```

```
Calculate the molar mass of H₂SO₄
Expected: subject=chemistry, difficulty=medium, solver=chemistry, confidence=high
```

```
What is the pH of a solution with [H+] = 1×10⁻⁵ M?
Expected: subject=chemistry, difficulty=medium, solver=chemistry, confidence=high
```

### Hard
```
Explain the mechanism of SN2 reaction
Expected: subject=chemistry, difficulty=hard, solver=llm, confidence=medium
```

```
Calculate the equilibrium constant for: N₂ + 3H₂ ⇌ 2NH₃
Expected: subject=chemistry, difficulty=hard, solver=chemistry, confidence=medium
```

## 🧬 Biology

### Easy
```
What is photosynthesis?
Expected: subject=biology, difficulty=easy, solver=llm, confidence=high
```

```
Name the powerhouse of the cell
Expected: subject=biology, difficulty=easy, solver=llm, confidence=high
```

### Medium
```
Explain the process of mitosis
Expected: subject=biology, difficulty=medium, solver=llm, confidence=high
```

```
What is the difference between DNA and RNA?
Expected: subject=biology, difficulty=medium, solver=llm, confidence=high
```

### Hard
```
Describe the Krebs cycle and its role in cellular respiration
Expected: subject=biology, difficulty=hard, solver=llm, confidence=medium
```

## 📚 History

### Easy
```
When did India gain independence?
Expected: subject=history, difficulty=easy, solver=llm, confidence=high
```

```
Who was the first President of the United States?
Expected: subject=history, difficulty=easy, solver=llm, confidence=high
```

### Medium
```
Explain the causes of World War I
Expected: subject=history, difficulty=medium, solver=llm, confidence=high
```

```
What was the significance of the French Revolution?
Expected: subject=history, difficulty=medium, solver=llm, confidence=high
```

### Hard
```
Analyze the impact of the Industrial Revolution on society
Expected: subject=history, difficulty=hard, solver=llm, confidence=medium
```

## 💰 Economics

### Easy
```
What is supply and demand?
Expected: subject=economics, difficulty=easy, solver=llm, confidence=high
```

```
Define GDP
Expected: subject=economics, difficulty=easy, solver=llm, confidence=high
```

### Medium
```
Explain the concept of inflation
Expected: subject=economics, difficulty=medium, solver=llm, confidence=high
```

```
What is the difference between fiscal and monetary policy?
Expected: subject=economics, difficulty=medium, solver=llm, confidence=high
```

### Hard
```
Analyze the effects of quantitative easing on the economy
Expected: subject=economics, difficulty=hard, solver=llm, confidence=medium
```

## 🌍 Geography

### Easy
```
What is the capital of France?
Expected: subject=geography, difficulty=easy, solver=llm, confidence=high
```

```
Name the largest ocean on Earth
Expected: subject=geography, difficulty=easy, solver=llm, confidence=high
```

### Medium
```
Explain the water cycle
Expected: subject=geography, difficulty=medium, solver=llm, confidence=high
```

```
What causes earthquakes?
Expected: subject=geography, difficulty=medium, solver=llm, confidence=high
```

## 💻 Coding

### Easy
```
What is a variable in programming?
Expected: subject=coding, difficulty=easy, solver=llm, confidence=high
```

```
Write a Python function to add two numbers
Expected: subject=coding, difficulty=easy, solver=llm, confidence=high
```

### Medium
```
Explain the difference between a list and a tuple in Python
Expected: subject=coding, difficulty=medium, solver=llm, confidence=high
```

```
Write a function to reverse a string in JavaScript
Expected: subject=coding, difficulty=medium, solver=llm, confidence=high
```

### Hard
```
Implement a binary search algorithm in Python
Expected: subject=coding, difficulty=hard, solver=llm, confidence=medium
```

## 🧪 Edge Cases to Test

### Ambiguous Questions
```
What is x?
Expected: Low confidence, should ask for clarification
```

```
Solve it
Expected: Low confidence, no context
```

### Multi-Subject Questions
```
Calculate the force required to accelerate a 10 kg object at 5 m/s²
Expected: subject=physics, but involves math calculation
```

```
Balance the chemical equation and calculate the molar mass: C₆H₁₂O₆
Expected: subject=chemistry, involves calculation
```

### Poorly Formatted Questions
```
2x+5=13 solve
Expected: Should still classify as math, easy, symbolic
```

```
whats the capital of france
Expected: Should still classify as geography, easy
```

### Very Long Questions
```
A train leaves Station A at 10:00 AM traveling at 60 km/h. Another train leaves Station B (200 km away) at 10:30 AM traveling at 80 km/h toward Station A. At what time will they meet, and how far from Station A will they be?
Expected: subject=math, difficulty=medium, solver=symbolic
```

## 📊 Testing Checklist

### Classification Accuracy
- [ ] Math questions correctly identified
- [ ] Physics questions correctly identified
- [ ] Chemistry questions correctly identified
- [ ] Other subjects correctly identified
- [ ] Difficulty levels appropriate
- [ ] Question types accurate

### Solver Routing
- [ ] Simple calculations → symbolic solver
- [ ] Conceptual questions → LLM solver
- [ ] Proofs → hybrid solver
- [ ] Physics problems → physics solver
- [ ] Chemistry problems → chemistry solver

### Confidence Scoring
- [ ] Easy questions → high confidence (>0.85)
- [ ] Medium questions → medium confidence (0.70-0.85)
- [ ] Hard questions → lower confidence (<0.70)
- [ ] Ambiguous questions → low confidence
- [ ] Well-formatted questions → higher confidence

### Escalation Logic
- [ ] Very low confidence → escalate
- [ ] Hard proofs → escalate
- [ ] Ambiguous questions → escalate
- [ ] Clear questions → don't escalate

## 🎯 Success Criteria

A successful implementation should:

1. **Classify correctly** ≥85% of the time
2. **Route appropriately** ≥90% of the time
3. **Confidence calibration**: High confidence solutions should be correct ≥95% of the time
4. **Escalation rate**: <15% of questions escalated
5. **User satisfaction**: ≥4.5/5 average rating

## 📝 Testing Process

1. **Test each category** (Math, Physics, Chemistry, etc.)
2. **Record results** in a spreadsheet:
   - Question
   - Expected classification
   - Actual classification
   - Expected confidence
   - Actual confidence
   - Correct? (Yes/No)

3. **Calculate metrics**:
   - Classification accuracy = Correct / Total
   - Confidence calibration = (High confidence & correct) / High confidence total
   - Escalation rate = Escalated / Total

4. **Iterate**:
   - Adjust patterns in `questionRouter.ts`
   - Tune weights in `confidenceScorer.ts`
   - Add more training examples

## 🐛 Common Issues & Fixes

### Issue: All questions classified as "other"
**Fix**: Add more patterns to `subjectPatterns` in `questionRouter.ts`

### Issue: Confidence always high/low
**Fix**: Adjust weights in `calculateConfidence()` in `confidenceScorer.ts`

### Issue: Wrong solver selected
**Fix**: Update routing logic in `routeToSolver()` in `questionRouter.ts`

### Issue: OCR not detecting text
**Fix**: Improve image quality, add preprocessing in `mathOCR.ts`

## 📈 Tracking Improvements

Create a simple tracking sheet:

| Date | Question | Subject | Difficulty | Confidence | Correct? | Notes |
|------|----------|---------|------------|------------|----------|-------|
| 2024-05-24 | 2x+5=13 | math | easy | 0.92 | ✅ | Perfect |
| 2024-05-24 | Explain photosynthesis | biology | medium | 0.78 | ✅ | Good |
| 2024-05-24 | What is x? | other | easy | 0.35 | ❌ | Too vague |

Use this data to continuously improve the system!

---

**Happy Testing! 🚀**
