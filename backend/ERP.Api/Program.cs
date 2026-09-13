using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using ERP.Api.Data;
using ERP.Api.Models;
using ERP.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// =====================================================
// CORS
// =====================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "http://localhost:5174",
            "https://erp-system-lb31.onrender.com"
        )
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

// =====================================================
// CONTROLLERS
// =====================================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// =====================================================
// DATABASE - PostgreSQL / Neon
// =====================================================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// =====================================================
// SERVICES
// =====================================================
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuditService>();

// =====================================================
// JWT AUTHENTICATION
// =====================================================
builder.Services.AddAuthentication(
    JwtBearerDefaults.AuthenticationScheme
)
.AddJwtBearer(options =>
{
    var jwtKey = builder.Configuration["Jwt:Key"];

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,

        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey!)
        ),

        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],

        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],

        ValidateLifetime = true,

        ClockSkew = TimeSpan.Zero,

        RoleClaimType = ClaimTypes.Role
    };

    // =================================================
    // CHECK WHETHER USER IS ACTIVE
    // =================================================
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var userIdClaim = context.Principal?
                .FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out var userId))
            {
                context.Fail("Invalid user information.");
                return;
            }

            var dbContext = context.HttpContext.RequestServices
                .GetRequiredService<AppDbContext>();

            var isActive = await dbContext.Users
                .AsNoTracking()
                .Where(user => user.Id == userId)
                .Select(user => (bool?)user.IsActive)
                .SingleOrDefaultAsync();

            if (isActive != true)
            {
                context.Fail("User account is inactive.");
            }
        }
    };
});

// =====================================================
// AUTHORIZATION
// =====================================================
builder.Services.AddAuthorization();

// =====================================================
// SWAGGER
// =====================================================
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",

        Type = SecuritySchemeType.Http,

        Scheme = "bearer",

        BearerFormat = "JWT",

        In = ParameterLocation.Header,

        Description = "Enter your JWT token"
    });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },

                Array.Empty<string>()
            }
        }
    );
});

// =====================================================
// BUILD APPLICATION
// =====================================================
var app = builder.Build();

// =====================================================
// CREATE INITIAL ADMIN USER
// =====================================================
// This runs when the application starts.
//
// It creates an Admin only when:
// 1. Admin role exists
// 2. No Admin user currently exists
// 3. ADMIN_USERNAME is configured
// 4. ADMIN_EMAIL is configured
// 5. ADMIN_PASSWORD is configured
//
// Password is securely hashed using BCrypt.
// =====================================================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

    try
    {
        var adminRole = await db.Roles
            .FirstOrDefaultAsync(r => r.Name == "Admin");

        if (adminRole != null)
        {
            var adminUsername =
                builder.Configuration["ADMIN_USERNAME"];

            var adminEmail =
                builder.Configuration["ADMIN_EMAIL"];

            var adminPassword =
                builder.Configuration["ADMIN_PASSWORD"];

            if (!string.IsNullOrWhiteSpace(adminUsername) &&
                !string.IsNullOrWhiteSpace(adminEmail) &&
                !string.IsNullOrWhiteSpace(adminPassword))
            {
                var adminExists = await db.Users
                    .AnyAsync(u => u.RoleId == adminRole.Id);

                if (!adminExists)
                {
                    var adminUser = new User
                    {
                        Username = adminUsername.Trim(),

                        Email = adminEmail
                            .Trim()
                            .ToLowerInvariant(),

                        PasswordHash =
                            BCrypt.Net.BCrypt.HashPassword(
                                adminPassword
                            ),

                        RoleId = adminRole.Id,

                        IsActive = true
                    };

                    db.Users.Add(adminUser);

                    await db.SaveChangesAsync();

                    Console.WriteLine(
                        "=========================================="
                    );

                    Console.WriteLine(
                        "Initial Admin user created successfully."
                    );

                    Console.WriteLine(
                        $"Admin Username: {adminUsername}"
                    );

                    Console.WriteLine(
                        "=========================================="
                    );
                }
                else
                {
                    Console.WriteLine(
                        "Admin user already exists. No new Admin created."
                    );
                }
            }
            else
            {
                Console.WriteLine(
                    "Admin environment variables are not configured."
                );
            }
        }
        else
        {
            Console.WriteLine(
                "Admin role was not found."
            );
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine(
            "Error while creating initial Admin user:"
        );

        Console.WriteLine(ex.Message);
    }
}

// =====================================================
// SWAGGER
// Enabled for deployment/testing
// =====================================================
app.UseSwagger();

app.UseSwaggerUI();

// =====================================================
// HTTPS
// =====================================================
// Render handles HTTPS at the platform level.
// Therefore HTTPS redirection is disabled here.
//
// app.UseHttpsRedirection();

// =====================================================
// CORS
// =====================================================
app.UseCors("ReactApp");

// =====================================================
// AUTHENTICATION
// =====================================================
app.UseAuthentication();

// =====================================================
// AUTHORIZATION
// =====================================================
app.UseAuthorization();

// =====================================================
// CONTROLLERS
// =====================================================
app.MapControllers();

// =====================================================
// RENDER PORT
// =====================================================
// Render provides the PORT environment variable.
// If PORT is not available locally, use 10000.
// =====================================================
var port =
    Environment.GetEnvironmentVariable("PORT")
    ?? "10000";

app.Urls.Add(
    $"http://0.0.0.0:{port}"
);

// =====================================================
// START APPLICATION
// =====================================================
app.Run();