# Gold AI Jewelry - Project Documentation

AI-powered custom jewelry design platform. Users describe their dream jewelry, see AI-generated designs, refine via chat, and order handcrafted pieces.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (Google, Facebook OAuth)
- **Storage**: Supabase Storage (images)
- **i18n**: next-intl (English + Hebrew with RTL support)

## External AI Services

| Service | Purpose | API Key Env Var |
|---------|---------|-----------------|
| **Nano Banana Flash** | Fast draft image generation (via Replicate) | `REPLICATE_API_KEY` |
| **Nano Banana Pro** | High-quality final images (via Replicate) | `REPLICATE_API_KEY` |
| **Tripo3D** | Image-to-3D model conversion | `TRIPO_API_KEY` |
| **Claude** | Design refinement chat assistant | `ANTHROPIC_API_KEY` |

## Project Structure

```
src/
├── app/
│   ├── [locale]/              # Locale-based routing (en, he)
│   │   ├── page.tsx           # Homepage - Design Studio (main app)
│   │   ├── about/             # Landing page with features
│   │   ├── design/            # Old wizard flow (legacy)
│   │   ├── checkout/          # Cart checkout
│   │   └── account/           # User account pages
│   └── api/
│       ├── designs/
│       │   ├── generate-variations/  # Generate 2 draft images (Flash)
│       │   ├── finalize/             # Upgrade to Pro quality
│       │   ├── convert-to-3d/        # Start Tripo3D conversion
│       │   ├── status/               # Poll 3D conversion status
│       │   └── refine/               # Chat-based refinement
│       ├── chat/design/       # Claude chat for design help
│       └── pricing/estimate/  # Price calculation
├── components/
│   ├── studio/                # Main design studio components
│   │   ├── DesignStudio.tsx   # Layout (3-panel desktop, sheet mobile)
│   │   ├── ControlPanel.tsx   # Left panel: selections + generate
│   │   ├── PreviewPanel.tsx   # Center: image/3D viewer
│   │   ├── ChatPanel.tsx      # Right panel: refinement chat
│   │   ├── MobileBottomSheet.tsx  # Mobile controls drawer
│   │   └── HistoryStrip.tsx   # Image history navigation
│   ├── design/                # Shared design components
│   │   ├── ModelViewer.tsx    # 3D GLB model viewer
│   │   └── AIChat.tsx         # Chat UI component
│   ├── common/                # Header, Footer, Switchers
│   ├── cart/                  # Cart drawer & button
│   └── ui/                    # Button, etc.
├── contexts/
│   ├── StudioContext.tsx      # Main state for design studio
│   ├── CartContext.tsx        # Shopping cart state
│   └── ThemeContext.tsx       # Dark/light/warm/cool themes
├── lib/
│   ├── ai/
│   │   ├── nano-banana.ts     # Replicate client for image gen
│   │   ├── tripo3d.ts         # Tripo3D client for 3D conversion
│   │   └── claude.ts          # Anthropic Claude client
│   ├── storage/
│   │   └── supabase.ts        # Image upload to Supabase
│   ├── i18n/
│   │   ├── config.ts          # Locale config (en, he)
│   │   └── request.ts         # next-intl setup
│   └── pricing/
│       └── calculator.ts      # Price estimation logic
└── messages/
    ├── en.json                # English translations
    └── he.json                # Hebrew translations (RTL)
```

## Core User Flow

```
1. SELECT OPTIONS
   ├── Gender: man | woman | unisex
   ├── Jewelry Type: ring | necklace | bracelet | earrings
   ├── Material: gold_14k | gold_18k | gold_24k | silver | platinum
   └── Description: min 10 chars

2. GENERATE (Nano Banana Flash)
   └── Creates 2 variations, uploaded to Supabase

3. SELECT FAVORITE
   └── Click image to choose, other goes to history

4. REFINE (optional)
   └── Chat with Claude to modify design
   └── Regenerate with refinements

5. ENHANCE (Nano Banana Pro)
   └── Upgrade selected image to Pro quality

6. CONVERT TO 3D (Tripo3D)
   └── Image-to-3D conversion (~2 min)
   └── Returns GLB model URL

7. ADD TO CART & CHECKOUT
```

## Key State: StudioContext

Located in `src/contexts/StudioContext.tsx`. Central state management for the design studio.

### Types
```typescript
type Gender = "man" | "woman" | "unisex";
type JewelryType = "ring" | "necklace" | "bracelet" | "earrings";
type Material = "gold_14k" | "gold_18k" | "gold_24k" | "silver" | "platinum";
type ConversionStep = "idle" | "enhancing" | "enhanced" | "converting" | "complete" | "error";
```

### Key State Properties
- `gender`, `jewelryType`, `material`, `description` - User selections
- `variations: [string | null, string | null]` - Two generated image URLs
- `selectedIndex: 0 | 1 | null` - Which variation is selected
- `isGenerating` - Loading state for image generation
- `imageHistory: string[]` - History of generated images
- `chatMessages: ChatMessage[]` - Refinement chat history
- `modelUrl: string | null` - Final 3D model GLB URL
- `enhancedImageUrl: string | null` - Pro-quality image URL
- `conversionStep` - Current step in 3D conversion flow
- `priceEstimate: number | null` - Calculated price in ILS

### Key Methods
- `canGenerate()` - Returns true if all required fields filled (10+ char description)
- `constructPrompt()` - Builds full prompt from selections
- `getSelectedImage()` - Returns currently selected variation URL
- `addToHistory(url)` - Adds image to history
- `resetConversion()` - Resets 3D conversion state

## PreviewPanel View Phases

The PreviewPanel (`src/components/studio/PreviewPanel.tsx`) has distinct view phases:

```typescript
type ViewPhase = "empty" | "selecting" | "working" | "enhanced" | "converting" | "complete";
```

- **empty**: No images yet, show placeholder
- **selecting**: 2 variations shown, user picks one (carousel on mobile)
- **working**: Single selected image, can refine or start conversion
- **enhanced**: Pro-quality image shown, ready for 3D
- **converting**: Loading spinner with progress
- **complete**: 3D model viewer with add-to-cart

## API Routes

### POST `/api/designs/generate-variations`
Generate 2 draft images using Nano Banana Flash.
```typescript
// Request
{ prompt: string, jewelryType, gender, material, count?: number }
// Response
{ images: string[] }
```

### POST `/api/designs/finalize`
Upgrade image to Pro quality before 3D conversion.
```typescript
// Request
{ sourceImageUrl: string, originalPrompt: string, jewelryType, targetGender, material? }
// Response
{ success: true, imageUrl: string, quality: "pro" }
```

### POST `/api/designs/convert-to-3d`
Start Tripo3D image-to-3D conversion.
```typescript
// Request
{ imageUrl: string }
// Response
{ taskId: string }
```

### GET `/api/designs/status?taskId=xxx`
Poll 3D conversion status.
```typescript
// Response
{ status: "queued" | "running" | "success" | "failed", progress: number, modelUrl?: string }
```

### GET `/api/pricing/estimate`
Calculate price estimate.
```typescript
// Query params: material, type, complexity, size
// Response
{ success: true, breakdown: { total: number, ... } }
```

## i18n & RTL Support

- Default locale: Hebrew (`he`) - Israel-first launch
- Supported: English (`en`), Hebrew (`he`)
- RTL handling in `src/lib/i18n/config.ts`:
  ```typescript
  export function isRTL(locale: Locale): boolean {
    return localeDirections[locale] === "rtl";
  }
  ```
- Translations in `messages/en.json` and `messages/he.json`
- Key namespaces: `common`, `nav`, `home`, `design`, `studio`, `cart`, `checkout`

## Theming

Four themes in `ThemeContext.tsx`:
- `light` - Light mode
- `dark` - Dark mode
- `warm` - Warm/golden tones
- `cool` - Cool/silver tones

CSS variables defined in `src/app/globals.css`.

## Image Storage

Images are stored in Supabase Storage bucket `jewelry-designs`:
- `drafts/{jewelryType}/` - Flash-generated images
- `enhanced/{jewelryType}/` - Pro-quality images

If Supabase is not configured, original Replicate URLs are used (temporary, expire).

## Environment Variables

Required for full functionality:
```bash
# AI Services
REPLICATE_API_KEY=       # Nano Banana (image generation)
TRIPO_API_KEY=           # Tripo3D (3D conversion)
ANTHROPIC_API_KEY=       # Claude (chat)

# Storage
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Database
DATABASE_URL=
```

## Common Tasks

### Adding a new translation key
1. Add to `messages/en.json`
2. Add to `messages/he.json`
3. Use with `useTranslations("namespace")`

### Modifying the design flow
1. Update `StudioContext.tsx` for state changes
2. Update `PreviewPanel.tsx` for UI changes
3. Update `ControlPanel.tsx` for input changes

### Adding a new jewelry type
1. Add to `JewelryType` in `StudioContext.tsx`
2. Add translations in `messages/*.json` under `design.wizard.step2`
3. Add to `jewelryTypes` array in `ControlPanel.tsx`
4. Add prompt descriptions in `nano-banana.ts` and `tripo3d.ts`

### Adding a new material
1. Add to `Material` type in `StudioContext.tsx`
2. Add to `materials` array in `ControlPanel.tsx`
3. Add material descriptions in `nano-banana.ts` and `tripo3d.ts`
4. Update pricing calculator if needed

## Mobile Responsiveness

- Desktop: 3-panel layout (controls | preview | chat)
- Mobile: Bottom sheet with controls, full-screen preview
- Mobile carousel for image selection (swipe between 2 options)
- `isMobile` prop passed to components for conditional rendering

## Debugging

### Image generation fails
1. Check `REPLICATE_API_KEY` is set
2. Check Replicate dashboard for rate limits
3. Look for errors in server console

### 3D conversion fails
1. Check `TRIPO_API_KEY` is set
2. Ensure image URL is publicly accessible (Supabase public bucket)
3. Check Tripo3D dashboard for task status

### Images expire/404
1. Ensure Supabase storage is configured
2. Check `SUPABASE_SERVICE_ROLE_KEY` has upload permissions
3. Verify bucket `jewelry-designs` exists and is public
