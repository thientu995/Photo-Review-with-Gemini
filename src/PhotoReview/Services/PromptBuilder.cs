namespace PhotoReview.Services;

/// <summary>
/// Builds the AI prompt from appsettings.json configuration.
/// Customize criteria in appsettings.json > AI > Criteria array.
/// </summary>
public static class PromptBuilder
{
    public static string Build(IConfiguration config)
    {
        var role = config["AI:Role"] ?? "You are an expert photography mentor.";
        var language = config["AI:Language"] ?? "Vietnamese";
        var criteria = config.GetSection("AI:Criteria").GetChildren().ToList();

        var sections = criteria.Count > 0
            ? string.Join("\n\n", criteria.Select(c =>
                $"## {c["Icon"]} {c["Name"]}\n{c["Description"]}"))
            : "Analyze composition, lighting, color, and provide improvement tips.";

        return $@"{role}
Analyze this photo and provide feedback in {language} with these sections:

{sections}

Be encouraging but honest. Use simple language suitable for beginners.";
    }
}
