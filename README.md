# 📸 Photo Review AI

A web app that analyzes and reviews photography using AI (Google Gemini). Upload a photo and get detailed feedback on shooting technique, composition, lighting, color, and actionable improvement tips.

## Screenshots

| Upload | Analyzing | Result |
|--------|-----------|--------|
| ![Analyzing](image/Screenshot%202026-03-28%20151540.png) | ![Upload](image/Screenshot%202026-03-28%20151452.png) | ![Result](image/screencapture-localhost-53864-2026-03-28-15_22_15.png) |

## How It Works

1. Upload a photo (drag & drop or click to select)
2. Click "Analyze"
3. Get a detailed review with scores and tips from AI

## Requirements

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- Google Gemini API Key ([get one here](https://aistudio.google.com/apikey))

## Setup & Run

```bash
# 1. Clone the repo
git clone <repo-url>
cd PhotoReview

# 2. Configure your API Key
#    Open src/PhotoReview/appsettings.json
#    Replace the "ApiKey" value in the "Gemini" section with your own key

# 3. Run the app
dotnet run --project src/PhotoReview
```

The app will be available at: `https://localhost:53864` (or `http://localhost:53865`)

## Configuration

All configuration lives in `src/PhotoReview/appsettings.json`:

### Gemini API

```json
{
  "Gemini": {
    "ApiKey": "YOUR_GEMINI_API_KEY_HERE",
    "Models": ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"]
  }
}
```

- `ApiKey`: Your Google Gemini API key
- `Models`: List of models to use. The system automatically falls back to the next model if the current one hits a rate limit (429) or is not found (404)

### AI Customization

```json
{
  "AI": {
    "Language": "Vietnamese",
    "Role": "You are a world-class photography mentor...",
    "Criteria": [
      { "Icon": "📐", "Name": "Composition", "Description": "..." }
    ]
  }
}
```

- `Language`: AI response language
- `Role`: AI persona / system role
- `Criteria`: List of review criteria — add, remove, or edit as needed

## Upload Limits

- Formats: JPG, PNG, WebP, GIF
- Max file size: 10MB

## Project Structure

```
src/PhotoReview/
├── Program.cs                  # Entry point, API endpoint
├── Services/
│   ├── GeminiClient.cs         # Gemini API client with auto model fallback
│   ├── ImageValidator.cs       # File upload validation
│   └── PromptBuilder.cs        # Builds prompt from config
├── wwwroot/
│   ├── index.html              # Main UI
│   ├── app.js                  # Frontend logic
│   └── style.css               # Dark theme styling
├── appsettings.json            # API & review criteria config
└── PhotoReview.csproj          # Project file (.NET 9)
```

## Tech Stack

- Backend: ASP.NET Core 9 (Minimal API)
- Frontend: Vanilla HTML/CSS/JS (no framework)
- AI: Google Gemini API (multimodal — supports image analysis)
