# Animations

Every element supports three animation slots: **On Enter**, **Loop**, and **On Exit**. Multiple animations can exist in each slot and run in parallel.

---

## Adding an Animation

1. Select an element on the canvas
2. Open its panel in the right sidebar (e.g. Text, Shape, Arrow)
3. Scroll to the animation sections
4. Click **Add** next to the timing category you want
5. Configure type, duration, easing, and timing

---

## Timing Categories

| Category | When it plays |
|---|---|
| **On Enter** | Plays once when the element's start time is reached during scene playback |
| **Loop** | Plays continuously for the entire time the element is visible |
| **On Exit** | Plays once when the element's visible window ends |

---

## Animation Properties

| Property | Description |
|---|---|
| **Type** | The animation effect |
| **Start (s)** | Seconds from scene start when this animation begins |
| **Duration (s)** | How long the animation takes to complete |
| **Delay (s)** | Pause before the animation starts (added to Start) |
| **Easing** | Timing curve (see below) |
| **Direction** | For slide and wipe animations: left / right / up / down |
| **Distance (px)** | For Bounce Loop: vertical travel distance |
| **Period (s)** | For loop animations: time per full cycle |

---

## Easing Curves

| Easing | Feel |
|---|---|
| Linear | Constant speed, mechanical |
| Ease In | Starts slow, accelerates |
| Ease Out | Starts fast, decelerates (most natural for enters) |
| Ease InOut | Slow start and end, smooth overall |
| Bounce | Overshoots and springs back at the end |

---

## Universal Animations

Available on all element types.

### On Enter
| Animation | Effect |
|---|---|
| **Fade In** | Opacity 0 → 1 |
| **Slide In** | Slides in from an edge; configurable direction |
| **Scale In** | Grows from invisible to full size |
| **Wipe In** | Directional reveal (curtain wipe) |
| **Spin** | Full 360° rotation into place |

### Loop
| Animation | Effect |
|---|---|
| **Pulse** | Rhythmic scale oscillation (88%–112%) |
| **Bounce** | Vertical bounce; set Distance for travel height |
| **Rotate** | Continuous clockwise rotation |
| **Fade Loop** | Opacity pulses in and out |
| **Flow** | Marching dashes around the border (shapes / arrows) |

### On Exit
| Animation | Effect |
|---|---|
| **Fade Out** | Opacity 1 → 0 |
| **Slide Out** | Slides out to an edge |
| **Scale Out** | Shrinks to invisible |
| **Wipe Out** | Directional conceal (curtain close) |

---

## Text-Specific Animations

Available only on Text elements, in addition to all universal animations.

| Animation | Effect |
|---|---|
| **Typewriter** | Characters appear one by one left to right |
| **Typewriter (Words)** | Words appear one at a time |
| **Text Fade** | Each word or line fades in sequentially |

---

## Arrow-Specific Animations

| Animation | Timing | Effect |
|---|---|---|
| **Draw Path** | On Enter | The arrow line draws itself from start to end |
| **Flow** | Loop | Animated dashing along the arrow path |
| **Draw Off** | On Exit | The arrow erases itself |

---

## Chart Animations

Chart animations are added from the Loop section of the chart panel. One animation per chart is typical.

| Chart Type | Animation | Effect |
|---|---|---|
| Bar | **Bars Rise** | Each bar grows up from the baseline |
| Line | **Line Draw** | Line traces progressively left to right |
| Area | **Area Flow** | Fill area sweeps in from the left |
| Pie / Doughnut | **Pie Spin** | Slices open sequentially |

---

## Tips

**Stagger text reveals** — place multiple text elements with increasing Start times (0 s, 0.3 s, 0.6 s) to create a sequential entrance.

**Combine enter + loop** — use Fade In on enter and Pulse on loop to make an element breathe after appearing.

**Flow on shapes** — the Flow loop animation works on any shape. If the shape has no stroke, a 3 px grey border is added automatically. Change Stroke Color or Stroke Width in the shape panel to restyle the flow border in real time.

**Draw Path on arrows** — set Duration to match the natural reading speed of the diagram. A 1–2 s draw at Ease Out feels deliberate.

**Loop period** — shorter period = faster cycling. A Pulse at 0.6 s feels energetic; at 2 s it's a gentle breath.
