# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Build a lightweight, high-performance desktop application for video creation and editing, specifically optimized for educational and technical content (ML, AI, math, system design). Focus feature animation for text, codes, shapes and lines resembe architure and concepts.

Project Name: Luffy Editor

This is going to be a desktop application

### Core philosophy:
1. Application will open with a single dahsboard (editor dashboard) like microsoft powerpoint, we can add slides, add items on slide animate them, edit them. On dahsboard we will have few options bar on top and main area below it containing a canvas where user will create its video, add elements and edit and a left sidebar that show options to top bar menu and features functionality, ui will be very modern and minimal, not messy, very clean and spacious, use small fontsize, small icon size and small padding and margin
1. Application main ui gonna be a video creator and editor dashboard: header with logo and close and minimise option. then comes the top bar: project name, canvas size: (give present size like vertical video, horizental video, square all in hd dimension), canvas background options like gardient, solid color, grids or animated background, preview button to see peviw video and download button to download in mp4 format
2. After top bar, tere will be options/menu bar, contains main feature options like to add text, text fonts (multiple fonts drop down list) shapes add, line and arrow, code block, add table, upload button to upload any image, icon and video, (we will show the uploaded items in right sidebar), then text animation, shapes animation, slide animations like morphs and others and you can also add more that you think should be exist as a video creation and editor application
3. Left sidebar that will use customizable option for menu options, all menu options item customiazle option should be appear here 
4. At most bottm the timeline, however I am confused, how we will handle the timeline, for reference how powerpoin handle the timeline and video duration.

Core Features:

Scene-based architecture:
Video = sequence of scenes
Each scene contains objects (text, shapes, arrows, code blocks)
Animation Engine:
Keyframe-based animation system
Support:
fade, slide, transform, morph
path animations (lines/arrows drawing)
text reveal animations
Components:
Text blocks (rich typography, math support)
Code blocks (syntax highlighting)
Shapes (rectangles, circles,triangle arrows, graphs)
Flow diagrams
Background system:
grid / gradient / paper / animated
Slide & Transition System:
PowerPoint-like transitions (fade, morph, push, zoom)
Timeline + Layer System:
timeline-based editing
layering of elements
Export Engine:
high-quality video rendering (mp4/webm)
deterministic rendering (like programmatic animation)

Tech constraints:

Desktop app (Electron or Tauri preferred)
Frontend: React + Canvas/WebGL
Rendering: WebGL / WASM for performance
Modular architecture (plugin-friendly)

Goal:
To build a robust and correctly working application, most important, lightweight, fast working and high quality video exports.

Code standard: no bug, no hidden breaks and no bulky useless code, only optimized high quality concise code.

I am giving you free hand to build it, use any tech stack you think suits perfectly.