---
name: motion-engineering
description: >-
  Programmatic motion design and video engineering pipeline. Use when creating launch videos,
  product demos, social teasers, or animated UI showcases using Remotion, HTML/Canvas,
  Playwright frame captures, and FFmpeg H.264 encoding.
---

# Programmatic Motion Engineering Pipeline

## Overview
Treat code as the canvas: every frame is a pure mathematical function of time `seek(t)`.

## 1. Reference Video Analysis
Before writing code, decompose reference footage:
```bash
# Extract 2 fps overview frames
ffmpeg -i reference.mp4 -vf "fps=2,scale=960:-2" frames/ref-%04d.jpg
```
Extract timestamps, bounding boxes, entrance trajectories, landing holds, and cut points into `REFERENCE.md`.

## 2. Structured Motion Brief (`BRIEF.md`)
Specify exact parameters:
- **Canvas & Coordinates**: Top-left origin, dimensions (e.g., 1080×1080 @ 30fps / 600 frames).
- **Margins & Layout**: Outer margin (standard 64px), locked headline box, product card geometry.
- **Scene Boundaries**:
  - **Opening (Frames 0–119)**: Headline enters (0–18, offset 24 to 0, opacity 0 to 1), Card enters (18–42, offset 60 to 0, opacity 0 to 1, cubic ease-out), Settled hold (42–119).
  - **Product Action (Frames 120–419)**: Settled card at exact coordinates, cursor approaches button along text-clear path (150–180), button press registers at 195 (scale 1.0 -> 0.92 -> 1.0), response reveal (210–234), stationary hold through 419.
  - **Closing (Frames 420–599)**: Cut to brand monogram & closing copy at 420, fade in through 438, hold through 599.

## 3. Audio Cue Alignment
Align SFX transients to exact frames:
- `BUTTON PRESS     frame 195    click transient`
- `RESULT REVEAL    frame 210    reveal accent`
- `CLOSING HOLD     frame 438    music settles`

## 4. Stills & Video Rendering
```bash
# Render review stills at key frames
npx remotion still Launch out/still_195.png --frame=195
npx remotion still Launch out/still_210.png --frame=210

# Final H.264 encode
ffmpeg -framerate 30 -i out/frame_%05d.png -c:v libx264 -pix_fmt yuv420p -movflags +faststart out/launch.mp4
```

## 5. Scoped Repair Loop
When fixing animation defects:
`Observed defect → One scoped edit → Affected frame range → Surrounding boundary check → Normal-speed playback`.
Never allow full rewrite when adjusting a single element's trajectory.
