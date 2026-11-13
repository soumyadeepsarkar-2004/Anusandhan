---
name: motion-studio-2.5d
description: >-
  Build viral vertical 2.5D animated shorts (flat 2D characters inside lit 3D Blender sets)
  for YouTube Shorts, Instagram Reels, and TikTok.
---

# 2.5D Animated Short Studio Pipeline

## 1. Format & House Rules
- **Dimensions**: 1080×1920 (9:16 vertical), 30 fps, 55–70 seconds. Render at exact size, never crop or upscale.
- **Style Mix**: Flat 2D vector characters (clean dark outlines, unshaded) with floor contact shadows inside photorealistically lit 3D sets with depth of field.
- **Narrative**: True stories only (150–170 words). Hook in Line 1, twist at second 40, payoff in the final line. Every claim verified in `sources.md`.
- **Rhythm**: Cut every 1.5–3.0 seconds on each new idea. Intentional slow push-in or dolly camera moves; no random orbits or drifts.

## 2. 3-Pass Blender Set Construction via MCP
1. **Pass 1: BLOCK**: Grey untextured geometry for architecture, walls, floor. Place shot cameras and verify framing with `look` tool.
2. **Pass 2: LIGHT**: One motivated key light (windows), warm practicals (lamps/candles), CC0 HDRI fill. No sterile 3-point studio lighting.
3. **Pass 3: DRESS**: Worn textures, props, depth-of-field focused on character stand marks. Detailed 3D hero props (beveled edges, modeled geometry).

## 3. Speech & Caption Pipeline
```bash
# Word-level timestamps via Whisper
whisper voice.wav --model small --word_timestamps True --output_format json --output_dir captions/
```
Captions rendered center-low, 1–2 words at a time, bold white with dark outline.

## 4. Pre-Publish Review Loop
1. Generate contact sheet: 1 frame per second.
2. Phone screen test: review scaled to 360px width.
3. Fix top 3 defects before final render.
