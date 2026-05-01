---
name: animation-skill
description: Build and manage animation system for video creation and editor
---

When working on animation:
- Use keyframe-based system
- Prefer declarative animation configs
- Support easing functions
- Ensure timeline synchronization
- option and time to enter and out
Always:

- Keep animations deterministic
- Optimize for performance (WebGL preferred)
- Avoid heavy DOM usage



---
name: code-visualizer
description: Convert code, ML concepts, and system flows into animated visual scenes
---

When working with code visualization:

## Core Goal
Transform abstract code or ML concepts into clear, animated visual representations.

## Rules

1. Always convert logic into visual blocks:
   - Functions → boxes
   - Data flow → arrows
   - Loops → cycles
   - Conditions → branches

2. For ML/AI content:
   - Show model architecture as layered diagrams
   - Animate flow of data (input → hidden → output)
   - Use progressive reveal (step-by-step)

3. For code blocks:
   - Use syntax-highlighted components
   - Animate:
     - line-by-line reveal
     - highlight execution path
     - variable updates

4. Scene Structure:
   - Break into multiple scenes
   - Each scene = one concept
   - Maintain clarity over density

5. Animation Rules:
   - Prefer simple animations:
     - fade in
     - slide
     - draw line
   - Avoid clutter
   - Focus attention using contrast

6. Output Format:
Always generate structured scene JSON like:

{
  "scene": "Neural Network Forward Pass",
  "elements": [
    { "type": "node", "label": "Input Layer" },
    { "type": "arrow", "from": "Input", "to": "Hidden" }
  ],
  "animations": [
    { "type": "draw", "target": "arrow", "duration": 1.2 }
  ]
}

## Priority
Clarity > Beauty > Complexity