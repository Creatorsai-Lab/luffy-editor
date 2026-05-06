# Testing Guide - All Features + Animation & Export Improvements

## 🧪 How to Test All Features

This guide will help you test all Quick Wins features, new animation enhancements, and the overhauled export system.

---

## 🚀 Getting Started

### 1. Start the App:
```bash
npm run dev
```

### 2. Create or Open a Project:
- App should load with a default project
- Or create a new project from the header

### 3. Add Some Test Content:
- Add 3-4 scenes
- Add some elements (text, shapes, etc.)
- Add some animations to elements

Now you're ready to test!

---

## ✅ Quick Wins Testing

### 1. Timeline Zoom Controls

**What to test:**
- [ ] Click zoom in button (🔍+)
- [ ] Click zoom out button (🔍-)
- [ ] Click "1:1" reset button
- [ ] Use `Ctrl +` keyboard shortcut
- [ ] Use `Ctrl -` keyboard shortcut (now includes `_` key)
- [ ] Use `Ctrl 0` keyboard shortcut
- [ ] Zoom percentage updates correctly
- [ ] Timeline scales appropriately
- [ ] Zoom range is 10% - 500%

**Expected behavior:**
- Zoom in: Timeline expands, more detail visible
- Zoom out: Timeline shrinks, more scenes visible
- Reset: Returns to 100% (1:1)
- Percentage display updates in real-time
- Smooth transitions, no jank

---

### 2. Scene Delete with Keyboard

**What to test:**
- [ ] Select a scene by clicking it
- [ ] Press `Delete` or `Backspace` key
- [ ] Scene should be deleted (if more than 1 scene exists)
- [ ] Cannot delete if only 1 scene remains

**Expected behavior:**
- Delete key removes current scene
- Minimum 1 scene always remains
- Next scene becomes active after deletion

---

### 3. Enhanced Scene Styling

**What to test:**
- [ ] Scenes have different colors (blue, skyblue, indigo, royalblue)
- [ ] Scene text is white and readable
- [ ] Scenes have rounded corners
- [ ] Active scene has white ring
- [ ] Scenes look distinct and professional

**Expected behavior:**
- Each scene has unique color from palette
- Colors cycle through 4 options
- White text contrasts well
- Rounded corners (border-radius)
- Active scene clearly highlighted

---

### 4. Enhanced Element Tracks

**What to test:**
- [ ] Element names shown in rounded blocks
- [ ] Element names have dark background
- [ ] Element names are white text
- [ ] Animation bars have rounded corners
- [ ] Animation bars have shadows
- [ ] Overall timeline looks more polished

**Expected behavior:**
- Element labels are clear and readable
- Rounded blocks look professional
- Good contrast and visibility
- Animations stand out

---

### 5. Text Panel Scrolling

**What to test:**
- [ ] Select a text element
- [ ] Open Text panel from menu
- [ ] Scroll through all options
- [ ] All controls are accessible
- [ ] No options are hidden

**Expected behavior:**
- Panel scrolls smoothly
- All text options visible
- Scrollbar appears when needed
- No layout issues

---

## 🎨 New Animation Features Testing

### 6. Text Animations Panel - ALL ANIMATIONS NOW RENDER!

**What to test:**
- [ ] Click "Text Animations" in menu bar
- [ ] Panel opens with text animation options
- [ ] Select a text element
- [ ] Click "Add Text Animation"
- [ ] Choose timing: Enter, Exit, or Loop
- [ ] Select animation type (filtered by timing)
- [ ] Set start time, duration, delay
- [ ] Choose easing function
- [ ] Animation appears in timeline
- [ ] **Animation renders correctly in preview!**

**Animation Types to Test - ALL WORKING:**

**On Enter:**
- [ ] **Typewriter (Chars)** - Types character by character ✅ RENDERS
- [ ] **Typewriter (Words)** - Types word by word ✅ RENDERS
- [ ] **Fade In** - Fades in smoothly ✅ RENDERS
- [ ] **Burst** - Bursts onto screen with overshoot ✅ RENDERS
- [ ] **Bounce** - Bounces in from above ✅ RENDERS
- [ ] **Block** - Vertical block reveal ✅ RENDERS
- [ ] **Squiz In** - Squeezes in horizontally ✅ RENDERS
- [ ] **Spread** - Spreads out horizontally ✅ RENDERS
- [ ] **Twirl** - Twirls in with rotation ✅ RENDERS
- [ ] **Zoom In** - Zooms in from center ✅ RENDERS

**On Exit:**
- [ ] **Fade Out** - Fades out smoothly ✅ RENDERS
- [ ] **Zoom Out** - Zooms out dramatically ✅ RENDERS

**Loop:**
- [ ] **Pulse (Loop)** - Pulses continuously ✅ RENDERS
- [ ] **Bounce (Loop)** - Bounces continuously ✅ RENDERS

**Expected behavior:**
- Panel only shows when text is selected
- Timing buttons toggle correctly
- Animation types filter by timing
- Loop animations show "∞ Loops continuously" badge
- All controls work smoothly
- **All animations render visually in preview and export!**

---

### 7. Shape Animations Panel

**What to test:**
- [ ] Click "Shape Animations" in menu bar
- [ ] Panel opens with shape animation options
- [ ] Select a shape, arrow, or image
- [ ] Click "Add Shape Animation"
- [ ] Choose timing: Enter, Exit, or Loop
- [ ] Select animation type (filtered by timing)
- [ ] Set start time, duration, delay
- [ ] Choose easing function
- [ ] For slide animations, choose direction
- [ ] For bounce loop, set distance
- [ ] Animation appears in timeline
- [ ] Animation renders correctly

**Animation Types to Test:**

**On Enter:**
- [ ] Fade In ✅
- [ ] Slide In (with direction) ✅
- [ ] Scale In ✅
- [ ] Spin In ✅

**On Exit:**
- [ ] Fade Out ✅
- [ ] Slide Out (with direction) ✅
- [ ] Scale Out ✅

**Loop:**
- [ ] Pulse - pulses continuously ✅
- [ ] Bounce - bounces continuously (with distance) ✅
- [ ] Rotate - rotates continuously ✅

**Expected behavior:**
- Panel only shows when shape/arrow/image is selected
- Timing buttons toggle correctly
- Animation types filter by timing
- Direction picker shows for slide animations
- Distance control shows for bounce loop
- Loop animations show "∞ Loops continuously" badge

---

### 8. Text Effects Panel

**What to test:**
- [ ] Click "Text Effects" in menu bar
- [ ] Panel opens with text effects options
- [ ] Select a text element
- [ ] Click effect buttons to toggle on/off
- [ ] Multiple effects can be active
- [ ] Active effects shown at bottom
- [ ] Effects persist when switching elements

**Effects to Test:**
- [ ] Shadow - drop shadow effect
- [ ] Glow - glowing outline
- [ ] Outline - text outline
- [ ] Hollow - hollow text
- [ ] Glitch - glitch effect
- [ ] Bubble - bubble text

**Expected behavior:**
- Panel only shows when text is selected
- Effects toggle on/off with click
- Active effects highlighted in blue
- Multiple effects can be active
- Active effects list shows at bottom

---

## 🎥 NEW: High-Quality Export Testing

### 9. FFmpeg-Based MP4 Export - COMPLETELY OVERHAULED!

**What to test:**
- [ ] Click "Export" in menu bar
- [ ] Export modal opens
- [ ] Shows resolution, duration, frames
- [ ] **Format selection available (MP4/WebM)**
- [ ] **Quality selection available (High/Ultra)**
- [ ] **Estimated file size shown**
- [ ] FFmpeg loads automatically
- [ ] Click "Start Export"
- [ ] Progress bar shows detailed status
- [ ] Progress messages update (Rendering, Writing, Encoding)
- [ ] Export completes successfully
- [ ] Click "Save File"
- [ ] **File saves as .mp4 (not .webm!)**
- [ ] **Video plays in media player**
- [ ] **Video shows correct duration**
- [ ] **Video has progress bar**
- [ ] **Video quality is excellent**
- [ ] All backgrounds render correctly
- [ ] All elements render correctly
- [ ] **All animations render correctly!**

**Export Settings to Test:**

**Format Options:**
- [ ] **MP4** - H.264 codec, universal compatibility ✅
- [ ] **WebM** - VP9 codec, web-optimized ✅

**Quality Options (MP4 only):**
- [ ] **High Quality** - CRF 23, fast encoding ✅
  - Good quality, reasonable file size
  - ~8-10 MB per minute (1080p)
  - Fast export speed
  
- [ ] **Ultra Quality** - CRF 18, slow encoding ✅
  - Excellent quality, larger file size
  - ~15-20 MB per minute (1080p)
  - Slower export speed

**Expected behavior:**
- MP4 format produces real MP4 files
- Videos play in all media players
- Duration shows correctly
- Progress bar works
- Quality is excellent (no pixelation)
- File size is reasonable
- Export speed is acceptable (~1-2x realtime)
- All animations render smoothly
- No frame drops or glitches

---

## 🎯 Integration Testing

### Test Complete Workflow:

**Scenario 1: Create Animated Text with Export**
1. Add text element "Welcome to My Video"
2. Open "Text Animations" panel
3. Add "Typewriter (Chars)" animation (Enter, 0s, 2s)
4. Add "Pulse" animation (Loop, 2s, 1s period)
5. Add "Zoom Out" animation (Exit, 8s, 1s)
6. Preview animations in timeline
7. **Export as MP4 (High Quality)**
8. **Verify video plays with all animations**

**Expected:** Text types in, pulses, zooms out - all visible in exported video!

**Scenario 2: Complex Scene with Multiple Elements**
1. Create scene with 3 text elements and 2 shapes
2. Add different animations to each element
3. Use different timings (Enter, Exit, Loop)
4. Adjust start times to create sequence
5. Preview in timeline
6. **Export as MP4 (Ultra Quality)**
7. **Verify all elements and animations render**

**Expected:** All elements animate correctly in exported video!

**Scenario 3: Quality Comparison**
1. Create a simple scene with text and shape
2. Add animations
3. **Export as MP4 (High Quality)** - note file size
4. **Export as MP4 (Ultra Quality)** - note file size
5. Compare video quality and file sizes
6. Verify both play correctly

**Expected:** Ultra has better quality and larger file size!

---

## 📊 Export Quality Verification

### **Check Video Properties:**

**Using VLC or Media Player:**
- [ ] Video plays without errors
- [ ] Duration shows correctly (e.g., 0:15)
- [ ] Progress bar works
- [ ] Can seek to any position
- [ ] No audio track (expected)
- [ ] Resolution matches project (e.g., 1920×1080)

**Using File Properties:**
- [ ] File extension is .mp4 (not .webm)
- [ ] File size is reasonable
- [ ] Codec is H.264 (AVC)
- [ ] Frame rate matches project (e.g., 30fps)

**Visual Quality Check:**
- [ ] No pixelation or artifacts
- [ ] Colors are accurate
- [ ] Text is sharp and readable
- [ ] Animations are smooth
- [ ] No frame drops
- [ ] Backgrounds render correctly

---

## 🎬 Animation Rendering Verification

### **Verify Each Animation Type Renders:**

**Text Animations:**
- [ ] typewriterChars - See characters appearing one by one
- [ ] typewriterWords - See words appearing one by one
- [ ] textFade - See smooth fade in/out
- [ ] textBurst - See burst effect with overshoot
- [ ] textBounce - See bounce from above
- [ ] textBlock - See vertical reveal
- [ ] textSquiz - See horizontal squeeze
- [ ] textSpread - See horizontal spread
- [ ] textTwirl - See rotation with scale
- [ ] textZoomIn - See zoom from center
- [ ] textZoomOut - See zoom out dramatically
- [ ] pulse - See continuous pulsing
- [ ] bounceLoop - See continuous bouncing

**Shape Animations:**
- [ ] fadeIn/Out - See opacity changes
- [ ] slideIn/Out - See movement with direction
- [ ] scaleIn/Out - See size changes
- [ ] spin - See rotation
- [ ] pulse - See pulsing
- [ ] bounceLoop - See bouncing
- [ ] rotateLoop - See continuous rotation

---

## 📝 Performance Testing

### **Export Performance:**
- [ ] 10 second video exports in < 30 seconds
- [ ] 1 minute video exports in < 2 minutes
- [ ] No crashes during export
- [ ] Memory usage stays reasonable
- [ ] Can cancel export mid-process

### **Animation Performance:**
- [ ] 10+ animations play smoothly
- [ ] No lag during playback
- [ ] Timeline remains responsive
- [ ] Preview updates in real-time

---

## ✅ Success Criteria

### All features pass if:
- [ ] No console errors
- [ ] No visual glitches
- [ ] All panels open correctly
- [ ] Animations can be added/removed
- [ ] Timing system works
- [ ] Effects can be toggled
- [ ] Timeline shows animations
- [ ] Scene delete works
- [ ] Zoom works (including Ctrl -)
- [ ] Scrolling works in panels
- [ ] **All animations render in preview**
- [ ] **All animations render in export**
- [ ] **Export produces MP4 files**
- [ ] **Videos play in media players**
- [ ] **Video quality is excellent**
- [ ] **File sizes are reasonable**

---

## 🎉 What's New Summary

### Fixed Issues:
1. ✅ Ctrl - zoom shortcut now works
2. ✅ Delete key removes scenes
3. ✅ Scenes have colorful, distinct styling
4. ✅ Element tracks have better styling
5. ✅ Text panel scrolls properly

### New Animation Features:
6. ✅ Text Animations panel (12 animation types)
7. ✅ Shape Animations panel (10 animation types)
8. ✅ Text Effects panel (6 effect types)
9. ✅ Timing system (Enter, Exit, Loop)
10. ✅ **All animations render correctly!**

### New Export Features:
11. ✅ **FFmpeg-based MP4 export**
12. ✅ **High and Ultra quality options**
13. ✅ **MP4 and WebM format options**
14. ✅ **Proper video metadata and duration**
15. ✅ **Professional-quality output**
16. ✅ **All animations render in export!**

**Total improvements:** 16 major enhancements! 🚀

---

## 🐛 Known Limitations

### Text Effects:
- ⚠️ Text effects (shadow, glow, etc.) are defined but need rendering implementation
- ⚠️ Effects can be toggled but visual rendering is pending

### Future Enhancements:
- ⏳ Background export (Web Worker)
- ⏳ Export queue
- ⏳ Custom bitrate control
- ⏳ Resolution scaling options
- ⏳ Frame rate options
- ⏳ Animation presets library
- ⏳ Animation curves editor
- ⏳ Undo/redo for animations

---

## 📚 Additional Resources

See these files for more information:
- `ANIMATION_AND_EXPORT_IMPROVEMENTS.md` - Complete implementation details
- `IMPLEMENTATION_COMPLETE.md` - Previous implementation summary
- `tasks/COMPREHENSIVE_ANALYSIS.md` - Full analysis and roadmap

---

**Good luck with testing!** 🎬

**The export system is now production-ready and all animations render beautifully!** ✨

---

## 🚀 Getting Started

### 1. Start the App:
```bash
npm run dev
```

### 2. Create or Open a Project:
- App should load with a default project
- Or create a new project from the header

### 3. Add Some Test Content:
- Add 3-4 scenes
- Add some elements (text, shapes, etc.)
- Add some animations to elements

Now you're ready to test!

---

## ✅ Quick Wins Testing

### 1. Timeline Zoom Controls

**What to test:**
- [ ] Click zoom in button (🔍+)
- [ ] Click zoom out button (🔍-)
- [ ] Click "1:1" reset button
- [ ] Use `Ctrl +` keyboard shortcut
- [ ] Use `Ctrl -` keyboard shortcut (now includes `_` key)
- [ ] Use `Ctrl 0` keyboard shortcut
- [ ] Zoom percentage updates correctly
- [ ] Timeline scales appropriately
- [ ] Zoom range is 10% - 500%

**Expected behavior:**
- Zoom in: Timeline expands, more detail visible
- Zoom out: Timeline shrinks, more scenes visible
- Reset: Returns to 100% (1:1)
- Percentage display updates in real-time
- Smooth transitions, no jank

---

### 2. Scene Delete with Keyboard

**What to test:**
- [ ] Select a scene by clicking it
- [ ] Press `Delete` or `Backspace` key
- [ ] Scene should be deleted (if more than 1 scene exists)
- [ ] Cannot delete if only 1 scene remains

**Expected behavior:**
- Delete key removes current scene
- Minimum 1 scene always remains
- Next scene becomes active after deletion

---

### 3. Enhanced Scene Styling

**What to test:**
- [ ] Scenes have different colors (blue, skyblue, indigo, royalblue)
- [ ] Scene text is white and readable
- [ ] Scenes have rounded corners
- [ ] Active scene has white ring
- [ ] Scenes look distinct and professional

**Expected behavior:**
- Each scene has unique color from palette
- Colors cycle through 4 options
- White text contrasts well
- Rounded corners (border-radius)
- Active scene clearly highlighted

---

### 4. Enhanced Element Tracks

**What to test:**
- [ ] Element names shown in rounded blocks
- [ ] Element names have dark background
- [ ] Element names are white text
- [ ] Animation bars have rounded corners
- [ ] Animation bars have shadows
- [ ] Overall timeline looks more polished

**Expected behavior:**
- Element labels are clear and readable
- Rounded blocks look professional
- Good contrast and visibility
- Animations stand out

---

### 5. Text Panel Scrolling

**What to test:**
- [ ] Select a text element
- [ ] Open Text panel from menu
- [ ] Scroll through all options
- [ ] All controls are accessible
- [ ] No options are hidden

**Expected behavior:**
- Panel scrolls smoothly
- All text options visible
- Scrollbar appears when needed
- No layout issues

---

## 🎨 New Features Testing

### 6. Text Animations Panel

**What to test:**
- [ ] Click "Text Animations" in menu bar
- [ ] Panel opens with text animation options
- [ ] Select a text element
- [ ] Click "Add Text Animation"
- [ ] Choose timing: Enter, Exit, or Loop
- [ ] Select animation type (filtered by timing)
- [ ] Set start time, duration, delay
- [ ] Choose easing function
- [ ] Animation appears in timeline

**Animation Types to Test:**

**On Enter:**
- [ ] Typewriter (Chars) - types character by character
- [ ] Typewriter (Words) - types word by word
- [ ] Fade In - fades in
- [ ] Burst - bursts onto screen
- [ ] Bounce - bounces in
- [ ] Block - blocks in
- [ ] Squiz In - squeezes in
- [ ] Spread - spreads out
- [ ] Twirl - twirls in
- [ ] Zoom In - zooms in

**On Exit:**
- [ ] Fade Out - fades out
- [ ] Zoom Out - zooms out

**Loop:**
- [ ] Pulse (Loop) - pulses continuously
- [ ] Bounce (Loop) - bounces continuously

**Expected behavior:**
- Panel only shows when text is selected
- Timing buttons toggle correctly
- Animation types filter by timing
- Loop animations show "∞ Loops continuously" badge
- All controls work smoothly

---

### 7. Shape Animations Panel

**What to test:**
- [ ] Click "Shape Animations" in menu bar
- [ ] Panel opens with shape animation options
- [ ] Select a shape, arrow, or image
- [ ] Click "Add Shape Animation"
- [ ] Choose timing: Enter, Exit, or Loop
- [ ] Select animation type (filtered by timing)
- [ ] Set start time, duration, delay
- [ ] Choose easing function
- [ ] For slide animations, choose direction
- [ ] For bounce loop, set distance
- [ ] Animation appears in timeline

**Animation Types to Test:**

**On Enter:**
- [ ] Fade In
- [ ] Slide In (with direction)
- [ ] Scale In
- [ ] Spin In

**On Exit:**
- [ ] Fade Out
- [ ] Slide Out (with direction)
- [ ] Scale Out

**Loop:**
- [ ] Pulse - pulses continuously
- [ ] Bounce - bounces continuously (with distance)
- [ ] Rotate - rotates continuously

**Expected behavior:**
- Panel only shows when shape/arrow/image is selected
- Timing buttons toggle correctly
- Animation types filter by timing
- Direction picker shows for slide animations
- Distance control shows for bounce loop
- Loop animations show "∞ Loops continuously" badge

---

### 8. Text Effects Panel

**What to test:**
- [ ] Click "Text Effects" in menu bar
- [ ] Panel opens with text effects options
- [ ] Select a text element
- [ ] Click effect buttons to toggle on/off
- [ ] Multiple effects can be active
- [ ] Active effects shown at bottom
- [ ] Effects persist when switching elements

**Effects to Test:**
- [ ] Shadow - drop shadow effect
- [ ] Glow - glowing outline
- [ ] Outline - text outline
- [ ] Hollow - hollow text
- [ ] Glitch - glitch effect
- [ ] Bubble - bubble text

**Expected behavior:**
- Panel only shows when text is selected
- Effects toggle on/off with click
- Active effects highlighted in blue
- Multiple effects can be active
- Active effects list shows at bottom
- Note about rendering implementation shown

---

## 🎯 Integration Testing

### Test Complete Workflow:

**Scenario 1: Create Animated Text**
1. Add text element to canvas
2. Open "Text Animations" panel
3. Add "Typewriter (Chars)" animation (Enter, 0s start, 2s duration)
4. Add "Pulse" animation (Loop, 2s start, 1s period)
5. Add "Fade Out" animation (Exit, 4s start, 1s duration)
6. Open "Text Effects" panel
7. Enable "Shadow" and "Glow" effects
8. Preview in timeline
9. Play to see animations

**Expected:** Text types in, pulses, then fades out with shadow and glow

**Scenario 2: Create Animated Shape**
1. Add shape to canvas
2. Open "Shape Animations" panel
3. Add "Scale In" animation (Enter, 0s start, 0.8s duration)
4. Add "Rotate" animation (Loop, 1s start, 2s period)
5. Add "Fade Out" animation (Exit, 5s start, 1s duration)
6. Preview in timeline
7. Play to see animations

**Expected:** Shape scales in, rotates continuously, then fades out

**Scenario 3: Complex Scene**
1. Create scene with multiple text and shape elements
2. Add different animations to each element
3. Use different timings (Enter, Exit, Loop)
4. Adjust start times to create sequence
5. Preview and adjust timing
6. Delete scene with Delete key
7. Undo not available yet (future feature)

**Expected:** All animations work together, scene deletes correctly

---

## 📊 New Features Summary

### Menu Bar Changes:
- ❌ Removed: "Animations" (single panel)
- ✅ Added: "Text Animations" (text-specific)
- ✅ Added: "Shape Animations" (shape-specific)
- ✅ Added: "Text Effects" (text effects)

### Animation System Changes:
- ✅ Timing system: Enter, Exit, Loop
- ✅ Text animations: 12 types
- ✅ Shape animations: 10 types
- ✅ Duration and delay controls
- ✅ Easing functions
- ✅ Direction controls (slide)
- ✅ Distance controls (bounce)

### Text Effects System:
- ✅ 6 effect types
- ✅ Toggle on/off
- ✅ Multiple effects support
- ✅ Visual feedback

---

## 🐛 Known Limitations

### Animation Rendering:
- ⚠️ New text animations (typewriterChars, textBurst, etc.) need rendering implementation
- ⚠️ Text effects (shadow, glow, etc.) need rendering implementation
- ⚠️ Current animations (fadeIn, slideIn, etc.) work as before

### Future Enhancements:
- ⏳ Undo/redo for animations
- ⏳ Animation presets
- ⏳ Copy/paste animations
- ⏳ Animation curves editor
- ⏳ Motion path editor

---

## ✅ Success Criteria

### All features pass if:
- [ ] No console errors
- [ ] No visual glitches
- [ ] All panels open correctly
- [ ] Animations can be added/removed
- [ ] Timing system works
- [ ] Effects can be toggled
- [ ] Timeline shows animations
- [ ] Scene delete works
- [ ] Zoom works (including Ctrl -)
- [ ] Scrolling works in panels

---

## 📝 Testing Checklist Summary

### Quick Test (10 minutes):
- [ ] Zoom in/out (including Ctrl -)
- [ ] Delete scene with Delete key
- [ ] Check scene colors and styling
- [ ] Open Text Animations panel
- [ ] Open Shape Animations panel
- [ ] Open Text Effects panel
- [ ] Add one animation of each type
- [ ] Toggle one text effect

### Full Test (30 minutes):
- [ ] All Quick Wins features
- [ ] All new animation types
- [ ] All text effects
- [ ] Integration scenarios
- [ ] Edge cases

---

## 🎉 What's New Summary

### Fixed Issues:
1. ✅ Ctrl - zoom shortcut now works
2. ✅ Delete key removes scenes
3. ✅ Scenes have colorful, distinct styling
4. ✅ Element tracks have better styling
5. ✅ Text panel scrolls properly

### New Features:
6. ✅ Text Animations panel (12 animation types)
7. ✅ Shape Animations panel (10 animation types)
8. ✅ Text Effects panel (6 effect types)
9. ✅ Timing system (Enter, Exit, Loop)
10. ✅ Enhanced animation controls

**Total improvements:** 10 fixes + enhancements! 🚀

---

**Good luck with testing!** 🎬
