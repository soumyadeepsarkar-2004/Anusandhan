# Motion Engineering & Animation Standards

## 1. Frame-Budgeted Deterministic Animation
- **Explicit Frame Assignment**: Every animation sequence MUST assign explicit frame numbers to key events:
  - Entrance / Reveal
  - Settling / Landing
  - Reading Hold
  - Interaction / Cursor waypoint action
  - Result reveal & Closing hold
- **Mandatory Reading Windows**:
  - Count reading windows from the exact frame words become legible.
  - At 30 fps, 8 frames is only 0.27s (unreadable).
  - Every headline, metric, or result label MUST have an audible read-aloud hold (minimum 1.5s to 2.5s / 45-75 frames at 30 fps).
- **Banned AI-Slop Defaults**:
  - NEVER use generic center-aligned text on unmotivated blurry gradient fades.
  - NEVER use linear interpolation, random orbital camera drifts, or uncalibrated slow zoom-ins.
  - ALWAYS use cubic-bezier curves with clamped endpoints (e.g., cubic ease-out) or spring physics with fixed destinations.
  - No continuous whoosh sound effects on every minor cut.

## 2. Audio-Visual Event Synchronization
- **Sound Has an Event Frame**:
  - Align sound transients directly with visual impact frames (e.g., button press at frame 195, data reveal hit at frame 210).
  - Offset audio clips to compensate for lead-in silence or soft attack envelopes using waveform peak analysis.
  - Keep music, voiceover, and SFX on separate tracks with independent gain control.

## 3. Scoped Repair Loop
- When correcting animation timing or defects, execute a localized loop:
  `Observed defect → One scoped edit → Affected frame range → Surrounding scene boundary verification → Normal-speed playback check`.
- Distinguish local scene frames from global sequence frames (e.g., local frame 30 in a sequence starting at global frame 120 = global frame 150).

## 4. Multi-Platform Container & Encoding Standards
- All motion video exports intended for web publishing (X, LinkedIn, Instagram) MUST strictly use:
  - Container: `.mp4`
  - Video Codec: `libx264` (H.264)
  - Pixel Format: `yuv420p`
  - Flags: `+faststart`
- Aspect ratios:
  - 16:9 (1920×1080) for X & desktop widescreen
  - 1:1 (1080×1080) for LinkedIn & square feed posts
  - 9:16 (1080×1920) for Instagram Reels, YouTube Shorts, and mobile feeds
