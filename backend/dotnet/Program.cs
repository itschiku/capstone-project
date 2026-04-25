using MySql.Data.MySqlClient;

var builder = WebApplication.CreateBuilder(args);

// Load .env file
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "../.env");
if (File.Exists(envPath))
{
    foreach (var line in File.ReadAllLines(envPath))
    {
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
            continue;
        
        var parts = line.Split('=', 2);
        if (parts.Length == 2)
        {
            Environment.SetEnvironmentVariable(parts[0], parts[1]);
        }
    }
}

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "*")
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
    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
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
    var json = System.Text.Json.JsonSerializer.Deserialize<CreateUserRequest>(body);
    using var conn = new MySqlConnection(connectionString);
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("INSERT INTO users (name, email, created_at) VALUES (@name, @email, NOW()); SELECT LAST_INSERT_ID();", conn);
    cmd.Parameters.AddWithValue("@name", json!.Name);
    cmd.Parameters.AddWithValue("@email", json!.Email);
    var newId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
    return new { id = newId, name = json.Name, email = json.Email, created_at = DateTime.Now };
});

app.MapDelete("/users/{id}", async (int id) =>
{
    using var conn = new MySqlConnection(connectionString);
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("DELETE FROM users WHERE id = @id", conn);
    cmd.Parameters.AddWithValue("@id", id);
    await cmd.ExecuteNonQueryAsync();
    return new { message = "User deleted successfully" };
});

var port = Environment.GetEnvironmentVariable("DOTNET_PORT") ?? "7000";
app.Run($"http://0.0.0.0:{port}");

record CreateUserRequest(string Name, string Email);
