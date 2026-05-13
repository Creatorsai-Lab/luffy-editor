# Quick Reference: Audio System

## For Users

### Upload Audio
1. Open **Audio Manager** from menu bar
2. Click **Add Audio**
3. Select audio file (MP3, WAV, OGG, AAC, M4A)

### Preview Audio
1. Click **Play button** next to audio name
2. Click **Pause** to stop

### Add to Timeline
1. Click **document icon** next to audio name
2. Audio appears on canvas and in timeline track

### Edit Audio
1. **Select audio** on canvas or timeline
2. **Properties panel** shows in right sidebar
3. Adjust: Volume, Trim, Fade, Loop, Track Type

### Apply Effects
1. **Select audio** element
2. Look for **Audio Effects** in right panel or menu
3. Expand sections: Volume, EQ, Effects, Advanced
4. Adjust controls as needed

---

## For Developers

### Import Path Utilities
```typescript
import { toFileUrl, fromFileUrl } from '@/utils/pathUtils'
```

### Use URL Conversion
```typescript
const imageUrl = toFileUrl(asset.path)  // Converts any path to file://
const imagePath = fromFileUrl(imageUrl) // Converts back to path
```

### Add Audio Element Programmatically
```typescript
import { makeAudio } from '@/utils/defaults'
const audioEl = makeAudio(filePath, assetId, duration)
addElement(audioEl)
```

### Access Audio Properties
```typescript
const audio: AudioElement = {
  type: 'audio',
  src: string,
  volume: number,        // 0-1
  fadeIn: number,        // seconds
  fadeOut: number,       // seconds
  startTime: number,     // trim start
  duration: number,      // trim length
  loop: boolean,
  track: 'background' | 'voiceover'
}
```

### Render Audio Element
```typescript
import AudioKonva from '@/components/canvas/elements/AudioKonva'

<AudioKonva el={audioElement} konvaProps={props} />
```

---

## File Locations

| Feature | File | Lines |
|---------|------|-------|
| Audio Manager | `AudioPanel.tsx` | 120 |
| Properties | `AudioPropertiesPanel.tsx` | 262 |
| Effects Panel | `AudioEffectsPanel.tsx` | 318 |
| Canvas Rendering | `AudioKonva.tsx` | 77 |
| Timeline Tracks | `Timeline.tsx` | +60 |
| Path Utilities | `pathUtils.ts` | 57 |

---

## Keyboard Shortcuts (Timeline)

| Action | Shortcut |
|--------|----------|
| Play/Pause | Space |
| Previous Frame | ← (Left Arrow) |
| Next Frame | → (Right Arrow) |
| Jump to Start | Home |
| Jump to End | End |
| Zoom In | Ctrl + + |
| Zoom Out | Ctrl + - |
| Reset Zoom | Ctrl + 0 |

---

## Troubleshooting

**Q: Audio not showing in sidebar**
A: Check that audio file is valid (MP3, WAV, OGG, AAC, M4A)

**Q: Can't see audio on timeline**
A: Make sure audio element is selected or timeline is zoomed in enough

**Q: Image/video preview broken**
A: Run build to apply path fixes, restart application

**Q: Path errors in console**
A: pathUtils.ts handles all path conversions automatically

---

## API Reference

### useEditorStore()
```typescript
// Audio operations
addElement(audioElement)        // Add to current scene
updateElement(id, patch)        // Update audio properties
removeElement(id)               // Delete audio from scene
addAsset(asset)                 // Add audio file metadata
removeAsset(id)                 // Remove audio file metadata
```

### AudioElement Properties
```typescript
{
  // Base properties (inherited)
  id: string
  type: 'audio'
  x, y: number
  width, height: number
  opacity: number
  
  // Audio-specific
  src: string                    // File path
  assetId: string               // Reference to uploaded asset
  volume: number                // 0-1
  fadeIn: number                // 0-5 seconds
  fadeOut: number               // 0-5 seconds
  startTime: number             // Trim start
  duration: number              // Trim duration
  loop: boolean
  track: 'background' | 'voiceover'
}
```

---

## Design Patterns

### Audio Preview
```tsx
<button onClick={() => handlePlayAudio(asset)}>
  {playingId === asset.id ? <Pause /> : <Play />}
</button>
```

### Volume Slider
```tsx
<input
  type="range"
  min={0}
  max={1}
  step={0.05}
  value={element.volume}
  onChange={(e) => updateElement(el.id, { volume: parseFloat(e.target.value) })}
/>
```

### Timeline Track
```tsx
<div
  className="absolute rounded-md"
  style={{
    left: audioStartPx,
    width: audioWidthPx,
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
  }}
>
  {/* Fade visualization */}
</div>
```

---

## Performance Tips

- Use `toFileUrl()` once, cache the result
- Audio properties don't trigger heavy re-renders
- Timeline tracks use CSS positioning (efficient)
- Effects panel UI is lightweight
- Consider debouncing slider changes for real-time updates

---

## Future API Changes (Planned)

- `pitchShift(semitones: number)`: Audio pitch adjustment
- `speedChange(percentage: number)`: Playback speed
- `applyEffect(type: EffectType, params: {}): Promise<void>`
- `exportAudio(format: 'mp3' | 'wav'): Promise<Blob>`

---

Last Updated: May 2026
