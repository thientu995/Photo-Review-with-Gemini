namespace PhotoReview.Services;

/// <summary>
/// Calls Google Gemini API with automatic model fallback.
/// Uses IHttpClientFactory to avoid socket exhaustion.
/// Models are tried in order — 429/404 triggers fallback to next model.
/// </summary>
public class GeminiClient(IHttpClientFactory httpFactory, IConfiguration config, ILogger<GeminiClient> logger)
{
    private const string ApiBase = "https://generativelanguage.googleapis.com/v1beta/models";
    private static readonly int[] RetryableStatusCodes = [429, 404];

    private string ApiKey => config["Gemini:ApiKey"] ?? "";

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ApiKey) && ApiKey != "YOUR_GEMINI_API_KEY_HERE";

    private string[] Models =>
        config.GetSection("Gemini:Models").Get<string[]>()
        ?? ["gemini-2.5-flash", "gemini-2.0-flash"];

    public async Task<GeminiResult> AnalyzeImageAsync(
        string base64Image, string mimeType, string prompt, CancellationToken ct = default)
    {
        var body = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = prompt },
                        new { inline_data = new { mime_type = mimeType, data = base64Image } }
                    }
                }
            }
        };

        using var http = httpFactory.CreateClient("Gemini");
        string lastError = "";

        foreach (var model in Models)
        {
            try
            {
                var url = $"{ApiBase}/{model}:generateContent?key={ApiKey}";
                var response = await http.PostAsJsonAsync(url, body, ct);
                var json = await response.Content.ReadAsStringAsync(ct);

                if (response.IsSuccessStatusCode)
                    return GeminiResult.Success(json);

                lastError = $"[{model}] {(int)response.StatusCode}: {json}";
                logger.LogWarning("Gemini model {Model} failed: {Status}", model, (int)response.StatusCode);

                if (!RetryableStatusCodes.Contains((int)response.StatusCode))
                    return GeminiResult.Failure($"Gemini API error: {json}");
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw; // Client disconnected — don't retry
            }
            catch (TaskCanceledException ex)
            {
                lastError = $"[{model}] Timeout: {ex.Message}";
                logger.LogWarning("Gemini model {Model} timed out", model);
                // Timeout on this model — try next
            }
            catch (HttpRequestException ex)
            {
                lastError = $"[{model}] Network error: {ex.Message}";
                logger.LogWarning(ex, "Gemini model {Model} network error", model);
                // Network issue — try next
            }
        }

        return GeminiResult.Failure($"All models unavailable. Last: {lastError}");
    }
}

public record GeminiResult(bool IsSuccess, string Json, string? Error)
{
    public static GeminiResult Success(string json) => new(true, json, null);
    public static GeminiResult Failure(string error) => new(false, "", error);
}
