
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using ERP.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using ERP.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// =====================================================
// CORS
// =====================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174"
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
var port = Environment.GetEnvironmentVariable("PORT") ?? "10000";

app.Urls.Add($"http://0.0.0.0:{port}");

// =====================================================
// START APPLICATION
// =====================================================
app.Run();