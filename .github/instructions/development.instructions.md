# ScreenForge Development Instructions

## Build & Run
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Build and run
```

## Code Style
- Use TypeScript strict mode
- ESM modules with `.js` imports
- Use `chalk` for colored output
- Use `ora` for spinners
- Handle errors gracefully with user-friendly messages

## Adding a New Command
1. Create `src/cli/commands/<name>.ts`
2. Export a `create<Name>Command()` function returning a `Command`
3. Register in `src/index.ts` with `program.addCommand()`

## Image Processing
- Always use `sharp` for image manipulation
- Support PNG output by default, WebP optional
- Use `lanczos3` kernel for best quality resizing
- Compress PNG with level 9

## AI Features
- Support both Gemini and OpenAI providers
- API keys stored in user config (`~/.screenforge/config.json`)
- Always parse AI responses as JSON
- Handle API errors with descriptive messages

## Testing
```bash
node dist/index.js --version
node dist/index.js --help
node dist/index.js icon --help
node dist/index.js splash --help
```
