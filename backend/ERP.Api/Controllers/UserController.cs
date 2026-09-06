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
    // GET: api/users
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
    // GET: api/users/{id}
    // Get user by ID
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
    // PUT: api/users/{id}/role
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

        // Find user
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

        // Find role
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

        // Prevent unnecessary update
        if (user.RoleId == role.Id)
        {
            return BadRequest(new
            {
                message = $"User already has the {role.Name} role."
            });
        }

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
    // PUT: api/users/{id}/activate
    // Activate or deactivate user
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

        // Prevent an Admin from accidentally disabling
        // the currently logged-in Admin account.
        var currentUserId = User.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier
        )?.Value;

        if (currentUserId == user.Id.ToString() &&
            request.IsActive == false)
        {
            return BadRequest(new
            {
                message = "You cannot deactivate your own account."
            });
        }

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
    // DELETE: api/users/{id}
    // Delete user
    // =========================================================
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
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

        // Get currently logged-in user ID
        var currentUserId = User.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier
        )?.Value;

        // Prevent deleting yourself
        if (currentUserId == user.Id.ToString())
        {
            return BadRequest(new
            {
                message = "You cannot delete your own account."
            });
        }

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
// Request Models
// =============================================================

public class ChangeRoleRequest
{
    public string Role { get; set; } = string.Empty;
}


public class ChangeUserStatusRequest
{
    public bool IsActive { get; set; }
}