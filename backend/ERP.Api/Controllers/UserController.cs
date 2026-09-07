using ERP.Api.Data;
using ERP.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET: api/Users
    // Get all users
    // =========================================================
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .Include(u => u.Role)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.IsActive,
                Role = u.Role != null ? u.Role.Name : null
            })
            .ToListAsync();

        return Ok(users);
    }


    // =========================================================
    // GET: api/Users/{id}
    // Get single user
    // =========================================================
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.Id == id)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.IsActive,
                Role = u.Role != null ? u.Role.Name : null
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        return Ok(user);
    }


    // =========================================================
    // POST: api/Users
    // Create a new user
    // Admin only
    // =========================================================
    [HttpPost]
    public async Task<IActionResult> CreateUser(
        [FromBody] CreateUserRequest request)
    {
        if (request == null)
        {
            return BadRequest(new
            {
                message = "User data is required."
            });
        }

        // -------------------------
        // Validate username
        // -------------------------
        if (string.IsNullOrWhiteSpace(request.Username))
        {
            return BadRequest(new
            {
                message = "Username is required."
            });
        }

        // -------------------------
        // Validate email
        // -------------------------
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new
            {
                message = "Email is required."
            });
        }

        // -------------------------
        // Validate password
        // -------------------------
        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Password is required."
            });
        }

        // -------------------------
        // Validate role
        // -------------------------
        if (string.IsNullOrWhiteSpace(request.Role))
        {
            return BadRequest(new
            {
                message = "Role is required."
            });
        }

        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();
        var requestedRole = request.Role.Trim();

        // -------------------------
        // Username length
        // -------------------------
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

        // -------------------------
        // Basic email validation
        // -------------------------
        if (!email.Contains("@") || !email.Contains("."))
        {
            return BadRequest(new
            {
                message = "Please provide a valid email address."
            });
        }

        // -------------------------
        // Password validation
        // -------------------------
        if (request.Password.Length < 8)
        {
            return BadRequest(new
            {
                message = "Password must contain at least 8 characters."
            });
        }

        // -------------------------
        // Check duplicate username
        // -------------------------
        var usernameExists = await _context.Users
            .AnyAsync(u =>
                u.Username.ToLower() == username.ToLower());

        if (usernameExists)
        {
            return BadRequest(new
            {
                message = "Username already exists."
            });
        }

        // -------------------------
        // Check duplicate email
        // -------------------------
        var emailExists = await _context.Users
            .AnyAsync(u =>
                u.Email.ToLower() == email);

        if (emailExists)
        {
            return BadRequest(new
            {
                message = "Email already exists."
            });
        }

        // -------------------------
        // Find requested role
        // -------------------------
        var role = await _context.Roles
            .FirstOrDefaultAsync(r =>
                r.Name.ToLower() == requestedRole.ToLower());

        if (role == null)
        {
            return BadRequest(new
            {
                message = "Invalid role."
            });
        }

        // -------------------------
        // Hash password
        // -------------------------
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(
            request.Password
        );

        // -------------------------
        // Create user
        // -------------------------
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

        // -------------------------
        // Response
        // -------------------------
        return Ok(new
        {
            message = "User created successfully.",
            userId = user.Id,
            username = user.Username,
            email = user.Email,
            role = role.Name,
            isActive = user.IsActive
        });
    }


    // =========================================================
    // PUT: api/Users/{id}/role
    // Change user role
    // =========================================================
    [HttpPut("{id:int}/role")]
    public async Task<IActionResult> ChangeRole(
        int id,
        [FromBody] ChangeRoleRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.Role))
        {
            return BadRequest(new
            {
                message = "Role is required."
            });
        }

        var requestedRole = request.Role.Trim();

        // -------------------------
        // Find user
        // -------------------------
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        // -------------------------
        // Find role
        // -------------------------
        var role = await _context.Roles
            .FirstOrDefaultAsync(r =>
                r.Name.ToLower() == requestedRole.ToLower());

        if (role == null)
        {
            return BadRequest(new
            {
                message = "Invalid role."
            });
        }

        // -------------------------
        // Check current role
        // -------------------------
        if (user.RoleId == role.Id)
        {
            return BadRequest(new
            {
                message = $"User already has the {role.Name} role."
            });
        }

        // -------------------------
        // Update role
        // -------------------------
        user.RoleId = role.Id;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "User role updated successfully.",
            userId = user.Id,
            username = user.Username,
            role = role.Name
        });
    }


    // =========================================================
    // PUT: api/Users/{id}/activate
    // Activate / deactivate user
    // =========================================================
    [HttpPut("{id:int}/activate")]
    public async Task<IActionResult> ChangeStatus(
        int id,
        [FromBody] ChangeUserStatusRequest request)
    {
        if (request == null)
        {
            return BadRequest(new
            {
                message = "IsActive is required."
            });
        }

        // -------------------------
        // Find user
        // -------------------------
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        // -------------------------
        // Get current logged-in user
        // -------------------------
        var currentUserId = User.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier
        )?.Value;

        // -------------------------
        // Prevent self-deactivation
        // -------------------------
        if (currentUserId == user.Id.ToString() &&
            request.IsActive == false)
        {
            return BadRequest(new
            {
                message = "You cannot deactivate your own account."
            });
        }

        // -------------------------
        // Update status
        // -------------------------
        user.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = user.IsActive
                ? "User activated successfully."
                : "User deactivated successfully.",

            userId = user.Id,
            username = user.Username,
            isActive = user.IsActive
        });
    }


    // =========================================================
    // DELETE: api/Users/{id}
    // Delete user
    // =========================================================
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        // -------------------------
        // Find user
        // -------------------------
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        // -------------------------
        // Get current logged-in user
        // -------------------------
        var currentUserId = User.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier
        )?.Value;

        // -------------------------
        // Prevent deleting yourself
        // -------------------------
        if (currentUserId == user.Id.ToString())
        {
            return BadRequest(new
            {
                message = "You cannot delete your own account."
            });
        }

        // -------------------------
        // Delete user
        // -------------------------
        _context.Users.Remove(user);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "User deleted successfully.",
            userId = user.Id,
            username = user.Username
        });
    }
}


// =============================================================
// REQUEST MODELS
// =============================================================

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string Role { get; set; } = "Employee";
}


public class ChangeRoleRequest
{
    public string Role { get; set; } = string.Empty;
}


public class ChangeUserStatusRequest
{
    public bool IsActive { get; set; }
}