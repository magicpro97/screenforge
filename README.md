# 📱 ScreenForge

[![npm version](https://img.shields.io/npm/v/screenforge.svg)](https://www.npmjs.com/package/screenforge)
[![license](https://img.shields.io/npm/l/screenforge.svg)](https://github.com/magicpro97/screenforge/blob/main/LICENSE)

**App Store Asset Generator CLI** — icons, splash screens, device frames, ASO metadata from your terminal.

Generate all required app store assets with a single command. One icon → 47+ sizes. One screenshot → device-framed mockup. One description → AI-optimized metadata in any language.

## Install

```bash
npm install -g screenforge
```

## Commands

### 📐 Icon Generation

Generate all icon sizes from a single 1024×1024 source image:

```bash
# All platforms (iOS + Android + Web + Favicon)
screenforge icon app-icon.png

# Specific platform
screenforge icon app-icon.png --platform ios
screenforge icon app-icon.png --platform android

# Custom output directory
screenforge icon app-icon.png --output ./assets/icons

# WebP format
screenforge icon app-icon.png --format webp
```

### 🌅 Splash Screens

Generate splash screens for all device sizes:

```bash
# All platforms
screenforge splash logo.png

# iOS only with custom background
screenforge splash logo.png --platform ios --background "#1a1a2e"

# Custom padding
screenforge splash logo.png --padding 30
```

### 📱 Device Frames

Add device mockup frames around screenshots:

```bash
# Default (iPhone 15 Pro)
screenforge frame screenshot.png

# Specific device
screenforge frame screenshot.png --device pixel-8
screenforge frame screenshot.png --device galaxy-s24

# List available devices
screenforge frame --list

# Custom output
screenforge frame screenshot.png --output framed.png
```

**Available devices:** `iphone-15-pro`, `iphone-15`, `iphone-se`, `ipad-pro-12`, `pixel-8`, `galaxy-s24`

### 🤖 ASO Metadata Generation

AI-powered App Store Optimization metadata:

```bash
# Generate metadata
screenforge meta generate -n "MyApp" -d "A productivity app for teams"

# With category and output file
screenforge meta generate -n "MyApp" -d "Task management" -c "Productivity" -o metadata.json

# Translate to other languages
screenforge meta translate -i metadata.json -l es
screenforge meta translate -i metadata.json -l ja
screenforge meta translate -i metadata.json -l fr
```

**Example output:**
```
📱 Title:       MyApp — Smart Team Productivity
📝 Subtitle:    Collaborate Better, Ship Faster
📖 Description: Transform your team's workflow with MyApp...
🔑 Keywords:    productivity, teams, tasks, collaboration, project, management
📋 Short Desc:  Smart productivity tool for modern teams
🎯 Promo Text:  Boost your team's productivity by 10x with AI-powered task management
```

### ✍️ Text Overlay

Add marketing text on screenshots:

```bash
# Add text at top
screenforge text screenshot.png "Your app, reimagined"

# Custom position and styling
screenforge text screenshot.png "Download Now" --position bottom --color "#ff6b6b" --font-size 48

# Custom font and stroke
screenforge text screenshot.png "Premium Features" --font "Helvetica" --stroke "#000000"
```

### 📦 Batch Processing

Process multiple assets from a YAML config:

```bash
screenforge batch assets.yml
screenforge batch assets.yml --dry-run
```

**Example `assets.yml`:**
```yaml
icon:
  input: ./src/icon-1024.png
  platforms: [ios, android]
  output: ./output/icons

splash:
  input: ./src/logo.png
  platforms: [ios, android]
  background: "#1a1a2e"
  output: ./output/splashes

frame:
  inputs:
    - ./screenshots/home.png
    - ./screenshots/profile.png
  device: iphone-15-pro
  output: ./output/frames

meta:
  appName: MyApp
  appDescription: A productivity app for modern teams
  category: Productivity
  locales: [en, es, ja, ko]

text:
  - input: ./screenshots/home.png
    text: "Smart Productivity"
    position: top
    color: "#ffffff"
    fontSize: 72
```

### ⚙️ Configuration

```bash
# Set AI provider (gemini or openai)
screenforge config set aiProvider gemini

# Set API key
screenforge config set apiKey your-api-key-here

# Set defaults
screenforge config set defaultOutput ./output
screenforge config set defaultPlatform ios

# View current config
screenforge config list
```

## Icon Sizes Reference

| Platform | Sizes (px) |
|----------|-----------|
| **iOS** | 1024, 180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20 |
| **Android** | 512, 432, 324, 216, 162, 108 |
| **Web/PWA** | 512, 384, 256, 192, 180, 152, 144, 128, 96, 72, 64, 48, 32, 16 |
| **Favicon** | 48, 32, 16 |

**Total: 47 icon sizes** from a single source image.

## Splash Screen Sizes

| Platform | Device | Resolution |
|----------|--------|-----------|
| **iOS** | iPhone 15 Pro Max | 1290×2796 |
| **iOS** | iPhone 15 Pro | 1179×2556 |
| **iOS** | iPhone 15 | 1170×2532 |
| **iOS** | iPhone SE | 750×1334 |
| **iOS** | iPad Pro 12.9" | 2048×2732 |
| **iOS** | iPad Pro 11" | 1668×2388 |
| **iOS** | iPad Air | 1640×2360 |
| **iOS** | iPad mini | 1488×2266 |
| **Android** | xxxhdpi | 1440×3120 |
| **Android** | xxhdpi | 1080×2340 |
| **Android** | xhdpi | 720×1560 |
| **Android** | hdpi | 540×1170 |
| **Android** | mdpi | 360×780 |

## Requirements

- Node.js 20+
- For AI features: Gemini or OpenAI API key

## License

MIT © [magicpro97](https://github.com/magicpro97)
