# 📸 Photo Review AI

Ứng dụng web giúp phân tích và đánh giá ảnh nhiếp ảnh bằng AI (Google Gemini). Upload ảnh lên và nhận phản hồi chi tiết về kỹ thuật chụp, bố cục, ánh sáng, màu sắc cùng các gợi ý cải thiện.

## Demo

1. Upload ảnh (kéo thả hoặc click chọn)
2. Nhấn "Phân tích ảnh"
3. Nhận đánh giá chi tiết với điểm số và góp ý từ AI

## Yêu cầu

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- Google Gemini API Key ([lấy tại đây](https://aistudio.google.com/apikey))

## Cài đặt & Chạy

```bash
# 1. Clone repo
git clone <repo-url>
cd PhotoReview

# 2. Cấu hình API Key
#    Mở file src/PhotoReview/appsettings.json
#    Thay giá trị "ApiKey" trong section "Gemini" bằng key của bạn

# 3. Chạy ứng dụng
dotnet run --project src/PhotoReview
```

Ứng dụng sẽ chạy tại: `https://localhost:53864` (hoặc `http://localhost:53865`)

## Cấu hình

Toàn bộ cấu hình nằm trong `src/PhotoReview/appsettings.json`:

### Gemini API

```json
{
  "Gemini": {
    "ApiKey": "YOUR_GEMINI_API_KEY_HERE",
    "Models": ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"]
  }
}
```

- `ApiKey`: API key của Google Gemini
- `Models`: Danh sách model sử dụng, hệ thống sẽ tự động fallback sang model tiếp theo nếu model hiện tại bị rate limit (429) hoặc không tìm thấy (404)

### Tùy chỉnh AI

```json
{
  "AI": {
    "Language": "Vietnamese",
    "Role": "You are a world-class photography mentor...",
    "Criteria": [
      { "Icon": "📐", "Name": "Bố cục & Góc máy", "Description": "..." }
    ]
  }
}
```

- `Language`: Ngôn ngữ phản hồi của AI
- `Role`: Vai trò / persona của AI
- `Criteria`: Danh sách tiêu chí đánh giá, có thể thêm/bớt/sửa tùy ý

## Giới hạn upload

- Định dạng: JPG, PNG, WebP, GIF
- Dung lượng tối đa: 10MB

## Cấu trúc dự án

```
src/PhotoReview/
├── Program.cs                  # Entry point, API endpoint
├── Services/
│   ├── GeminiClient.cs         # Gọi Gemini API với auto fallback
│   ├── ImageValidator.cs       # Validate file upload
│   └── PromptBuilder.cs        # Tạo prompt từ config
├── wwwroot/
│   ├── index.html              # Giao diện chính
│   ├── app.js                  # Logic frontend
│   └── style.css               # Giao diện dark theme
├── appsettings.json            # Cấu hình API & tiêu chí đánh giá
└── PhotoReview.csproj          # Project file (.NET 9)
```

## Tech Stack

- Backend: ASP.NET Core 9 (Minimal API)
- Frontend: Vanilla HTML/CSS/JS (không framework)
- AI: Google Gemini API (multimodal — hỗ trợ phân tích ảnh)
