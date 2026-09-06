using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ERP.Api.Data;
using ERP.Api.DTOs;
using ERP.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace ERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(
        AppDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    // ==========================================
    // REGISTER
    // POST: api/auth/register
    // ==========================================
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto request)
    {
        // ------------------------------
        // 1. Validate input
        // ------------------------------
        if (request == null)
        {
            return BadRequest(new
            {
                message = "Registration data is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Username))
        {
            return BadRequest(new
            {
                message = "Username is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new
            {
                message = "Email is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Password is required."
            });
        }

        // ------------------------------
        // 2. Clean input
        // ------------------------------
        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        // ------------------------------
        // 3. Basic username validation
        // ------------------------------
        if (username.Length < 3)
        {
            return BadRequest(new
            {
                message = "Username must contain at least 3 characters."
            });
        }

        if (username.Length > 50)
        {
            return BadRequest(new
            {
                message = "Username cannot exceed 50 characters."
            });
        }

        // ------------------------------
        // 4. Basic email validation
        // ------------------------------
        if (!email.Contains("@") || !email.Contains("."))
        {
            return BadRequest(new
            {
                message = "Please provide a valid email address."
            });
        }

        // ------------------------------
        // 5. Password validation
        // ------------------------------
        if (request.Password.Length < 8)
        {
            return BadRequest(new
            {
                message = "Password must contain at least 8 characters."
            });
        }

        // ------------------------------
        // 6. Check duplicate username
        // ------------------------------
        var usernameExists = await _context.Users
            .AnyAsync(u => u.Username.ToLower() == username.ToLower());

        if (usernameExists)
        {
            return BadRequest(new
            {
                message = "Username already exists."
            });
        }

        // ------------------------------
        // 7. Check duplicate email
        // ------------------------------
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == email);

        if (emailExists)
        {
            return BadRequest(new
            {
                message = "Email already exists."
            });
        }

        // ------------------------------
        // 8. Get default Employee role
        // ------------------------------
        var role = await _context.Roles
            .SingleOrDefaultAsync(r => r.Name == "Employee");

        if (role == null)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "The default Employee role is not configured."
                });
        }

        // ------------------------------
        // 9. Hash password
        // ------------------------------
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(
            request.Password
        );

        // ------------------------------
        // 10. Create user
        // ------------------------------
        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = passwordHash,
            RoleId = role.Id,
            IsActive = true
        };

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        // ------------------------------
        // 11. Return safe response
        // ------------------------------
        return Ok(new
        {
            message = "User registered successfully.",
            userId = user.Id,
            username = user.Username,
            email = user.Email,
            role = role.Name
        });
    }


    // ==========================================
    // LOGIN
    // POST: api/auth/login
    // ==========================================
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Username and password are required."
            });
        }

        var username = request.Username.Trim();

        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u =>
                u.Username.ToLower() == username.ToLower());

        // Do not reveal whether username exists
        if (user == null)
        {
            return Unauthorized(new
            {
                message = "Invalid username or password."
            });
        }

        // Check account status
        if (!user.IsActive)
        {
            return Unauthorized(new
            {
                message = "This account is inactive."
            });
        }

        // Verify hashed password
        var passwordValid = BCrypt.Net.BCrypt.Verify(
            request.Password,
            user.PasswordHash
        );

        if (!passwordValid)
        {
            return Unauthorized(new
            {
                message = "Invalid username or password."
            });
        }

        // Generate JWT
        var token = GenerateJwtToken(user);

        return Ok(new
        {
            message = "Login successful.",
            token,
            user = new
            {
                user.Id,
                user.Username,
                user.Email,
                Role = user.Role?.Name
            }
        });
    }


    // ==========================================
    // GENERATE JWT
    // ==========================================
    private string GenerateJwtToken(User user)
    {
        var key = _configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(key))
        {
            throw new InvalidOperationException(
                "JWT key is not configured."
            );
        }

        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(key)
        );

        var credentials = new SigningCredentials(
            securityKey,
            SecurityAlgorithms.HmacSha256
        );

        var claims = new[]
        {
            new Claim(
                ClaimTypes.NameIdentifier,
                user.Id.ToString()
            ),

            new Claim(
                ClaimTypes.Name,
                user.Username
            ),

            new Claim(
                ClaimTypes.Email,
                user.Email
            ),

            new Claim(
                ClaimTypes.Role,
                user.Role?.Name ?? "Employee"
            )
        };

        var expiryMinutes = double.Parse(
            _configuration["Jwt:ExpiryMinutes"] ?? "60"
        );

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }

    [HttpPost("reset-admin-password")]
public async Task<IActionResult> ResetAdminPassword()
{
    var admin = await _context.Users
        .Include(u => u.Role)
        .FirstOrDefaultAsync(u => u.Role != null && u.Role.Name == "Admin");

    if (admin == null)
    {
        return NotFound(new { message = "Admin user not found." });
    }

    const string newPassword = "Admin@12345";

    admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
    admin.IsActive = true;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Admin password reset successfully.",
        username = admin.Username,
        password = newPassword
    });
}
}