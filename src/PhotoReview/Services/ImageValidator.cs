namespace PhotoReview.Services;

/// <summary>
/// Validates uploaded image files.
/// Adjust MaxFileSizeBytes and AllowedMimeTypes to customize.
/// </summary>
public static class ImageValidator
{
    public const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB

    private static readonly string[] AllowedMimeTypes =
        ["image/jpeg", "image/png", "image/webp", "image/gif"];

    public static (bool IsValid, string? Error) Validate(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return (false, "No photo uploaded.");

        if (file.Length > MaxFileSizeBytes)
            return (false, $"File too large. Max {MaxFileSizeBytes / 1024 / 1024}MB.");

        var mime = file.ContentType?.ToLower() ?? "";
        if (!AllowedMimeTypes.Contains(mime))
            return (false, $"Unsupported format. Allowed: {string.Join(", ", AllowedMimeTypes)}");

        return (true, null);
    }

    public static async Task<(string Base64, string MimeType)> ReadAsBase64Async(IFormFile file)
    {
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        return (Convert.ToBase64String(ms.ToArray()), file.ContentType ?? "image/jpeg");
    }
}
