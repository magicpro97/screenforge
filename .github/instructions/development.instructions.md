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

## Color Analysis & Smart Background
New modules for color-aware marketing screenshots:

- **`src/core/color-analyzer.ts`** — K-means dominant color extraction using sharp
  - `extractDominantColors(imagePath, k=5)` → `{ colors, avgLuminance, isDark }`
- **`src/core/bg-generator.ts`** — Smart gradient backgrounds
  - `generateSmartBackground(colors, width, height, brandColors?)` → Buffer
  - isDark app → vibrant brand gradient; isLight → dark gradient
- **`src/cli/commands/analyze.ts`** — `screenforge analyze <image>` CLI command

### Auto-background in Composite
The `composite` command supports `--auto-bg` flag and `auto_background: true` in YAML config.
When enabled and no `background:` is specified for an item, the pipeline:
1. Extracts dominant colors from the screenshot
2. Generates a contrasting gradient background
3. Auto-selects text color for WCAG AA contrast

Color math utilities are in `forge-core/src/color.ts` (pure functions, no sharp dependency).
