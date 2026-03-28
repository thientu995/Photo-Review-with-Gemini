using PhotoReview.Services;

var builder = WebApplication.CreateBuilder(args);

// HttpClient with 5-minute timeout for Gemini (image analysis can be slow)
builder.Services.AddHttpClient("Gemini", http =>
{
    http.Timeout = TimeSpan.FromMinutes(5);
});

builder.Services.AddSingleton<GeminiClient>();

var app = builder.Build();
app.UseStaticFiles();

app.MapPost("/api/analyze", async (HttpRequest request, GeminiClient gemini, IConfiguration config, CancellationToken ct) =>
{
    var form = await request.ReadFormAsync(ct);
    var file = form.Files.GetFile("photo");

    var (isValid, error) = ImageValidator.Validate(file);
    if (!isValid)
        return Results.BadRequest(new { error });

    if (!gemini.IsConfigured)
        return Results.BadRequest(new { error = "Gemini API key not configured. Update appsettings.json." });

    var (base64, mimeType) = await ImageValidator.ReadAsBase64Async(file!);
    var prompt = PromptBuilder.Build(config);
    var result = await gemini.AnalyzeImageAsync(base64, mimeType, prompt, ct);

    return result.IsSuccess
        ? Results.Content(result.Json, "application/json")
        : Results.Problem(result.Error);
});

app.MapFallbackToFile("index.html");
app.Run();
