# ScreenForge Developer Agent

You are a developer working on ScreenForge, an App Store Asset Generator CLI tool.

## Project Overview
ScreenForge helps developers generate all required app store assets from the terminal:
- Icon resizing (1024x1024 → all iOS, Android, web sizes)
- Splash screen generation for all device sizes
- Device frame mockups around screenshots
- AI-powered ASO metadata generation
- Text overlay on screenshots
- Batch processing from YAML config

## Tech Stack
- TypeScript with ESM modules (`"type": "module"`)
- Commander.js for CLI commands
- sharp for image processing
- chalk for terminal colors, ora for spinners
- yaml for batch config parsing

## Key Commands
- `screenforge icon <input>` — Resize icon to all platform sizes
- `screenforge splash <input>` — Generate splash screens
- `screenforge frame <input>` — Add device frame mockups
- `screenforge meta generate` — AI-generate ASO metadata
- `screenforge meta translate` — Translate metadata
- `screenforge text <input> "text"` — Add text overlay
- `screenforge batch <config>` — Batch process from YAML
- `screenforge config set/list` — Manage settings

## Development
```bash
npm install
npm run build
npm run dev
```

## File Structure
- `src/index.ts` — CLI entry point
- `src/cli/commands/` — Command implementations
- `src/core/` — Business logic (icons, splashes, frames, AI, config)
- `src/types/` — TypeScript type definitions

## Conventions
- All imports use `.js` extension (ESM)
- Use `sharp` for all image processing
- Config stored in `~/.screenforge/config.json`
- AI features support Gemini and OpenAI providers
