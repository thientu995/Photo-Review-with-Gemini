# 📸 Photo Review AI — Technical Specification

## 1. Overview

Photo Review AI is a web application that lets users upload photos and receive detailed photography feedback from Google Gemini AI. It targets beginner photographers, helping them understand strengths, weaknesses, and how to improve.

## 2. Architecture

```
┌─────────────┐     POST /api/analyze     ┌──────────────────┐     HTTPS     ┌─────────────┐
│   Browser    │ ────────────────────────▶ │  ASP.NET Core 9  │ ────────────▶ │ Gemini API  │
│  (Frontend)  │ ◀──────── JSON ───────── │  (Minimal API)   │ ◀─── JSON ── │  (Google)   │
└─────────────┘                           └──────────────────┘               └─────────────┘
```

- Frontend sends the image via `multipart/form-data`
- Backend validates the image, converts to base64, and calls the Gemini API
- Gemini returns markdown; the frontend parses and renders it

## 3. API

### POST `/api/analyze`

Upload a photo for analysis.

**Request:**
- Content-Type: `multipart/form-data`
- Body: field `photo` containing the image file

**Success Response (200):**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          { "text": "## 📐 Composition\n..." }
        ]
      }
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: No image, file too large, unsupported format, or API key not configured
- `500 Problem`: Gemini API error or all models unavailable

### GET `/*` (Fallback)

Returns `index.html` for any unmatched route — SPA support.

## 4. Main Flow

```
1. User uploads a photo
2. Frontend validates (type, size) → shows preview
3. User clicks "Analyze"
4. Frontend sends POST /api/analyze (FormData) with AbortController
5. Backend:
   a. ImageValidator.Validate() — checks the file
   b. Checks API key is configured
   c. ImageValidator.ReadAsBase64Async() — reads image as base64
   d. PromptBuilder.Build() — builds prompt from appsettings.json
   e. GeminiClient.AnalyzeImageAsync() — calls Gemini API
      - Tries each model in order
      - On 429/404 → falls back to next model
      - On timeout/network error → falls back to next model
      - On other errors → returns error immediately
6. Frontend receives response:
   a. Parses markdown into sections
   b. Extracts overall score and sub-scores
   c. Renders results with collapsible sections
```

## 5. Components

### 5.1 Backend Services

| Service | File | Description |
|---------|------|-------------|
| `GeminiClient` | `Services/GeminiClient.cs` | Calls Gemini API via `IHttpClientFactory` with 5-min timeout, auto model fallback on 429/404/timeout, `CancellationToken` support |
| `ImageValidator` | `Services/ImageValidator.cs` | Validates file uploads (type, size), reads image as base64 |
| `PromptBuilder` | `Services/PromptBuilder.cs` | Builds the AI prompt from the `AI` section in appsettings.json |

### 5.2 Frontend

| File | Description |
|------|-------------|
| `index.html` | Main layout with 4 steps: Upload → Preview → Loading → Result |
| `app.js` | Handles upload, API calls (with `AbortController`), markdown parsing, result rendering |
| `style.css` | Dark theme, responsive design, animations |

## 6. Review Criteria

Configured in `appsettings.json > AI > Criteria`. Defaults to 12 criteria:

| # | Criterion | Summary |
|---|-----------|---------|
| 1 | 📐 Composition & Angle | Rule of thirds, leading lines, camera angle |
| 2 | 💡 Lighting | Quality, direction, hardness/softness |
| 3 | 🎨 Color & Tone | Color harmony, white balance, color grading |
| 4 | 🔍 Subject & Focus | Focus accuracy, DOF, sharpness, bokeh |
| 5 | 🎭 Emotion & Story | Mood, narrative, decisive moment |
| 6 | 🖼️ Background & Foreground | Background cleanliness, foreground interest, depth |
| 7 | ⚖️ Exposure & Histogram | Exposure accuracy, dynamic range, contrast |
| 8 | ✂️ Cropping & Ratio | Crop choices, aspect ratio, headroom |
| 9 | 👤 Pose & Expression | Posing, facial expression (if people present) |
| 10 | 🔧 Technical Execution | Shutter speed, aperture, ISO, lens |
| 11 | ⭐ Overall Rating | Score 1–10 with breakdown |
| 12 | 💡 Improvement Tips | 5–7 specific, actionable tips |

## 7. Constraints & Limits

| Item | Value |
|------|-------|
| Image formats | JPEG, PNG, WebP, GIF |
| Max file size | 10 MB |
| Framework | .NET 9 |
| HTTP client timeout | 5 minutes (configurable) |
| Gemini models | Configured in appsettings, auto fallback |
| Response language | Configurable (default: Vietnamese) |

## 8. Security

- API key stored in `appsettings.json` — should not be committed to public repos
- Recommended: use [User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets) or environment variables for production
- Server-side file validation (type + size) before processing
- No images stored on server — processed in memory only
- Frontend uses `AbortController` to cancel abandoned requests

## 9. Future Improvements

- Review history (database storage)
- Before/after photo comparison
- Batch upload support
- Export results to PDF
- Authentication
- Cloud deployment (Azure App Service, AWS, etc.)
