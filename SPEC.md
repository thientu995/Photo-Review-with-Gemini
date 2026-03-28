# 📸 Photo Review AI — Đặc tả kỹ thuật (Spec)

## 1. Tổng quan

Photo Review AI là ứng dụng web cho phép người dùng upload ảnh và nhận đánh giá chi tiết về kỹ thuật nhiếp ảnh từ Google Gemini AI. Ứng dụng hướng đến người mới học chụp ảnh, giúp họ hiểu điểm mạnh/yếu và cách cải thiện.

## 2. Kiến trúc hệ thống

```
┌─────────────┐     POST /api/analyze     ┌──────────────────┐     HTTPS     ┌─────────────┐
│   Browser    │ ──────────────────────── │  ASP.NET Core 9  │ ────────────── │ Gemini API  │
│  (Frontend)  │ <─────── JSON ────────── │  (Minimal API)   │ <── JSON ──── │  (Google)   │
└─────────────┘                           └──────────────────┘               └─────────────┘
```

- Frontend gửi ảnh qua `multipart/form-data`
- Backend validate ảnh, chuyển sang base64, gọi Gemini API
- Gemini trả về markdown, frontend parse và hiển thị

## 3. API

### POST `/api/analyze`

Upload ảnh để phân tích.

**Request:**
- Content-Type: `multipart/form-data`
- Body: field `photo` chứa file ảnh

**Response thành công (200):**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          { "text": "## 📐 Bố cục & Góc máy\n..." }
        ]
      }
    }
  ]
}
```

**Response lỗi:**
- `400 Bad Request`: Không có ảnh, file quá lớn, sai định dạng, hoặc chưa cấu hình API key
- `500 Problem`: Gemini API lỗi hoặc tất cả model đều không khả dụng

### GET `/*` (Fallback)

Trả về `index.html` cho mọi route không khớp — hỗ trợ SPA.

## 4. Luồng xử lý chính

```
1. Người dùng upload ảnh
2. Frontend validate (type, size) → hiển thị preview
3. Người dùng nhấn "Phân tích ảnh"
4. Frontend gửi POST /api/analyze (FormData)
5. Backend:
   a. ImageValidator.Validate() — kiểm tra file
   b. Kiểm tra API key đã cấu hình
   c. ImageValidator.ReadAsBase64Async() — đọc ảnh thành base64
   d. PromptBuilder.Build() — tạo prompt từ appsettings.json
   e. GeminiClient.AnalyzeImageAsync() — gọi Gemini API
      - Thử lần lượt từng model trong danh sách
      - Nếu 429/404 → fallback sang model tiếp theo
      - Nếu lỗi khác → trả lỗi ngay
6. Frontend nhận response:
   a. Parse markdown thành các section
   b. Tách điểm tổng quan, điểm thành phần
   c. Hiển thị kết quả với collapsible sections
```

## 5. Các thành phần (Components)

### 5.1 Backend Services

| Service | File | Mô tả |
|---------|------|--------|
| `GeminiClient` | `Services/GeminiClient.cs` | Gọi Gemini API, tự động fallback model khi gặp lỗi 429/404 |
| `ImageValidator` | `Services/ImageValidator.cs` | Validate file upload (type, size), đọc ảnh thành base64 |
| `PromptBuilder` | `Services/PromptBuilder.cs` | Tạo prompt từ cấu hình `AI` trong appsettings.json |

### 5.2 Frontend

| File | Mô tả |
|------|--------|
| `index.html` | Layout chính với 4 bước: Upload → Preview → Loading → Result |
| `app.js` | Xử lý upload, gọi API, parse markdown, render kết quả |
| `style.css` | Dark theme, responsive, animation |

## 6. Tiêu chí đánh giá ảnh

Cấu hình trong `appsettings.json > AI > Criteria`. Mặc định gồm 12 tiêu chí:

| # | Tiêu chí | Mô tả ngắn |
|---|----------|-------------|
| 1 | 📐 Bố cục & Góc máy | Rule of thirds, leading lines, góc chụp |
| 2 | 💡 Ánh sáng | Chất lượng, hướng, độ cứng/mềm |
| 3 | 🎨 Màu sắc & Tông màu | Hài hòa màu, white balance, color grading |
| 4 | 🔍 Chủ thể & Nét | Focus, DOF, sharpness, bokeh |
| 5 | 🎭 Cảm xúc & Câu chuyện | Mood, narrative, decisive moment |
| 6 | 🖼️ Hậu cảnh & Tiền cảnh | Background, foreground, depth layers |
| 7 | ⚖️ Phơi sáng & Histogram | Exposure, dynamic range, contrast |
| 8 | ✂️ Cắt cúp & Tỷ lệ | Cropping, aspect ratio, headroom |
| 9 | 👤 Tư thế & Biểu cảm | Posing, expression (nếu có người) |
| 10 | 🔧 Kỹ thuật chụp | Shutter speed, aperture, ISO, lens |
| 11 | ⭐ Đánh giá tổng quan | Điểm tổng 1-10 với breakdown |
| 12 | 💡 Góp ý cải thiện | 5-7 tips cụ thể |

## 7. Ràng buộc & Giới hạn

| Hạng mục | Giá trị |
|----------|---------|
| Định dạng ảnh | JPEG, PNG, WebP, GIF |
| Dung lượng tối đa | 10 MB |
| Framework | .NET 9 |
| Gemini models | Cấu hình trong appsettings, fallback tự động |
| Ngôn ngữ phản hồi | Cấu hình được (mặc định: Vietnamese) |

## 8. Bảo mật

- API key lưu trong `appsettings.json` — không nên commit lên public repo
- Khuyến nghị sử dụng [User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets) hoặc biến môi trường cho production
- Validate file upload phía server (type + size) trước khi xử lý
- Không lưu trữ ảnh trên server — chỉ xử lý trong memory

## 9. Mở rộng

Một số hướng phát triển tiếp theo:

- Lưu lịch sử đánh giá (database)
- So sánh trước/sau khi chỉnh sửa ảnh
- Hỗ trợ batch upload nhiều ảnh
- Export kết quả ra PDF
- Thêm authentication
- Deploy lên cloud (Azure App Service, AWS, etc.)
