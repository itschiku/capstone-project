using MySql.Data.MySqlClient;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();
app.UseCors();

var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "3306";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "capstone_db";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "capstone_user";
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "capstone123";
var connectionString = $"Server={dbHost};Port={dbPort};Database={dbName};User Id={dbUser};Password={dbPassword};";

app.MapGet("/health", () => new
{
    status = "healthy",
    backend = ".NET",
    timestamp = DateTime.Now
});

app.MapGet("/users", async () =>
{
    var users = new List<object>();
    using var conn = new MySqlConnection(connectionString);
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("SELECT id, name, email, created_at FROM users ORDER BY id DESC", conn);
    using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        users.Add(new { id = reader.GetInt32(0), name = reader.GetString(1), email = reader.GetString(2), created_at = reader.GetDateTime(3) });
    }
    return users;
});

app.MapPost("/users", async (HttpRequest request) =>
{
    using var reader = new StreamReader(request.Body);
    var body = await reader.ReadToEndAsync();
    using var jsonDoc = JsonDocument.Parse(body);
    var root = jsonDoc.RootElement;

    // Accept both lowercase and uppercase property names
    string name = "";
    string email = "";

    if (root.TryGetProperty("name", out var nameProp))
        name = nameProp.GetString() ?? "";
    else if (root.TryGetProperty("Name", out var nameProp2))
        name = nameProp2.GetString() ?? "";

    if (root.TryGetProperty("email", out var emailProp))
        email = emailProp.GetString() ?? "";
    else if (root.TryGetProperty("Email", out var emailProp2))
        email = emailProp2.GetString() ?? "";

    if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email))
        return Results.BadRequest(new { error = "Name and email are required" });

    using var conn = new MySqlConnection(connectionString);
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("INSERT INTO users (name, email, created_at) VALUES (@name, @email, NOW()); SELECT LAST_INSERT_ID();", conn);
    cmd.Parameters.AddWithValue("@name", name);
    cmd.Parameters.AddWithValue("@email", email);
    var newId = Convert.ToInt32(await cmd.ExecuteScalarAsync());

    return Results.Ok(new { id = newId, name, email, created_at = DateTime.Now });
});

app.MapDelete("/users/{id}", async (int id) =>
{
    using var conn = new MySqlConnection(connectionString);
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("DELETE FROM users WHERE id = @id", conn);
    cmd.Parameters.AddWithValue("@id", id);
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok(new { message = "User deleted successfully" });
});

app.Run("http://0.0.0.0:7000");
