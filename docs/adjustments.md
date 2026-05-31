# Adjustments

Image and video elements share a full set of non-destructive adjustments. Changes are applied in real time on the canvas and baked in during export.

Open the **Adjustments** section in the right sidebar after selecting an image or video element.

---

## Opacity

| Control | Range |
|---|---|
| Opacity | 0–100% |

Overall element transparency. Distinct from the Exposure and Brightness controls, which affect only the rendered image pixels.

---

## Basic

| Control | Range | Default | Notes |
|---|---|---|---|
| Brightness | 0–200 | 100 | 100 = no change. Values below 100 darken, above 100 brighten |
| Contrast | 0–200 | 100 | 100 = no change |
| Saturation | 0–200 | 100 | 0 = greyscale, 200 = vivid |
| Hue Rotate | −180–180° | 0 | Shifts all hues around the color wheel |
| Blur | 0–20 px | 0 | Gaussian blur |

---

## Light

Fine tonal controls modeled after photo-editing software.

| Control | Range | Effect |
|---|---|---|
| Exposure | −100 to +100 | Overall luminance gain (exponential) |
| Highlights | −100 to +100 | Brightens or darkens the bright regions |
| Shadows | −100 to +100 | Lifts or crushes the dark regions |
| Whites | −100 to +100 | Adjusts the upper-brightness ceiling |
| Blacks | −100 to +100 | Adjusts the lower-brightness floor |

---

## Color

| Control | Range | Effect |
|---|---|---|
| Vibrance | −100 to +100 | Boosts muted colors first; more subtle than Saturation |
| Temperature | −100 to +100 | Negative = cooler (blue), Positive = warmer (orange) |
| Tint | −100 to +100 | Negative = green shift, Positive = magenta shift |

---

## Effects

| Control | Effect |
|---|---|
| **Glass** | Applies a frosted-glass look: 8 px blur + subtle white overlay |

---

## Crop

Crop is separate from the numeric adjustments and has its own visual editor.

### Entering crop mode
- Click **Edit Crop** in the panel, or
- **Double-click** the image / video on the canvas

### Using the crop overlay
```
┌──────────────────────────────┐
│  ●────────────●────────────● │  ← top handles
│  │                        │ │
│  │    crop region         │ │
│  │                        │ │
│  ●────────────●────────────● │  ← bottom handles
└──────────────────────────────┘
```

| Action | How |
|---|---|
| Resize crop | Drag any of the 8 edge or corner handles |
| Pan crop window | Drag the center of the crop area |
| Apply | Click ✓ or press **Enter** |
| Cancel | Click ✗ or press **Escape** |
| Reset crop | Click **Reset** in the panel |

When you apply, the element is **resized** to the cropped dimensions — the canvas element shrinks to match what was selected. The original image data is unchanged.

### Successive crops
Applying a second crop composes with the first. Each crop is applied on top of the previous one, so "crop center of a crop" works as expected.

---

## Perspective Warp

Perspective warp deforms an image or shape into any quadrilateral — useful for placing screenshots on angled screens, floor tiles, or any 3D-like placement.

1. Select the element
2. Open **Perspective** from the left sidebar
3. Drag the four corner handles on the canvas to reshape
4. Click **Reset Perspective** to restore the flat rectangular shape

Perspective and crop can be combined.

---

## Reset

Click **Reset** (top-right of the Adjustments section) to return all numeric adjustments to their defaults. Crop and perspective are reset separately via their own controls.

---

## Workflow Tips

**Match a video to the scene mood** — use Temperature −30 and Vibrance +40 for a cool, cinematic look; Temperature +30 and Highlights −20 for warm, muted tones.

**Make a background image recede** — reduce Brightness to ~80 and Blur to 2–4 px so foreground elements read clearly.

**Greyscale a video with a tinted overlay** — set Saturation to 0, then apply a slight positive Temperature or Tint to add a sepia or cool-toned cast.

**Glass effect for overlay panels** — enable Glass on an image element placed behind a semi-transparent text block to create a frosted-glass UI card effect.
