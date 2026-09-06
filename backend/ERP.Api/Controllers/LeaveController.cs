using System.Security.Claims;
using ERP.Api.Data;
using ERP.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeaveController : ControllerBase
{
    private readonly AppDbContext _context;

    public LeaveController(AppDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // APPLY FOR LEAVE
    // Employee / Admin / HR / Manager
    // =========================================================

    [HttpPost("apply")]
    [Authorize(Roles = "Employee,Admin,HR,Manager")]
    public async Task<IActionResult> ApplyLeave(
        [FromBody] ApplyLeaveRequest request)
    {
        if (request == null)
        {
            return BadRequest(new
            {
                message = "Leave request is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.LeaveType))
        {
            return BadRequest(new
            {
                message = "Leave type is required."
            });
        }

        if (request.StartDate == default ||
            request.EndDate == default)
        {
            return BadRequest(new
            {
                message = "Start date and end date are required."
            });
        }

        if (request.EndDate < request.StartDate)
        {
            return BadRequest(new
            {
                message = "End date cannot be before start date."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return BadRequest(new
            {
                message = "Reason is required."
            });
        }

        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user information."
            });
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.UserId == userId);

        if (employee == null)
        {
            return NotFound(new
            {
                message = "Employee profile not found."
            });
        }

        if (!employee.IsActive)
        {
            return BadRequest(new
            {
                message = "Your employee account is inactive."
            });
        }

        // Prevent overlapping pending/approved leave
        var overlappingLeave = await _context.LeaveRequests
            .AnyAsync(l =>
                l.EmployeeId == employee.Id &&
                (l.Status == "Pending" || l.Status == "Approved") &&
                request.StartDate <= l.EndDate &&
                request.EndDate >= l.StartDate);

        if (overlappingLeave)
        {
            return BadRequest(new
            {
                message = "You already have a pending or approved leave request for part of this period."
            });
        }

        var leaveRequest = new LeaveRequest
        {
            EmployeeId = employee.Id,
            LeaveType = request.LeaveType.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Reason = request.Reason.Trim(),
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.LeaveRequests.Add(leaveRequest);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Leave request submitted successfully.",
            leaveRequestId = leaveRequest.Id,
            employeeId = leaveRequest.EmployeeId,
            leaveType = leaveRequest.LeaveType,
            startDate = leaveRequest.StartDate,
            endDate = leaveRequest.EndDate,
            reason = leaveRequest.Reason,
            status = leaveRequest.Status,
            createdAt = leaveRequest.CreatedAt
        });
    }

    // =========================================================
    // GET MY LEAVE REQUESTS
    // =========================================================

    [HttpGet("my")]
    [Authorize(Roles = "Employee,Admin,HR,Manager")]
    public async Task<IActionResult> GetMyLeaves()
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user information."
            });
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.UserId == userId);

        if (employee == null)
        {
            return NotFound(new
            {
                message = "Employee profile not found."
            });
        }

        var leaves = await _context.LeaveRequests
            .Where(l => l.EmployeeId == employee.Id)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new
            {
                l.Id,
                l.LeaveType,
                l.StartDate,
                l.EndDate,
                l.Reason,
                l.Status,
                l.ManagerComment,
                l.CreatedAt
            })
            .ToListAsync();

        return Ok(leaves);
    }

    // =========================================================
    // GET ALL LEAVE REQUESTS
    // Admin / HR / Manager
    // =========================================================

    [HttpGet]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> GetAllLeaves()
    {
        var leaves = await _context.LeaveRequests
            .Include(l => l.Employee)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new
            {
                l.Id,
                employeeId = l.EmployeeId,
                employeeName = l.Employee != null
                    ? l.Employee.FirstName + " " + l.Employee.LastName
                    : null,
                l.LeaveType,
                l.StartDate,
                l.EndDate,
                l.Reason,
                l.Status,
                l.ManagerComment,
                l.CreatedAt
            })
            .ToListAsync();

        return Ok(leaves);
    }

    // =========================================================
    // GET LEAVE REQUEST BY ID
    // Admin / HR / Manager
    // =========================================================

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> GetLeave(int id)
    {
        var leave = await _context.LeaveRequests
            .Include(l => l.Employee)
            .Where(l => l.Id == id)
            .Select(l => new
            {
                l.Id,
                employeeId = l.EmployeeId,
                employeeName = l.Employee != null
                    ? l.Employee.FirstName + " " + l.Employee.LastName
                    : null,
                l.LeaveType,
                l.StartDate,
                l.EndDate,
                l.Reason,
                l.Status,
                l.ManagerComment,
                l.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (leave == null)
        {
            return NotFound(new
            {
                message = "Leave request not found."
            });
        }

        return Ok(leave);
    }

    // =========================================================
    // APPROVE LEAVE
    // Admin / HR / Manager
    // =========================================================

    [HttpPut("{id:int}/approve")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> ApproveLeave(
        int id,
        [FromBody] LeaveDecisionRequest request)
    {
        var leave = await _context.LeaveRequests
            .FirstOrDefaultAsync(l => l.Id == id);

        if (leave == null)
        {
            return NotFound(new
            {
                message = "Leave request not found."
            });
        }

        if (leave.Status != "Pending")
        {
            return BadRequest(new
            {
                message = $"Leave request is already {leave.Status.ToLower()}."
            });
        }

        // Check for another approved leave that overlaps
        var overlappingApprovedLeave = await _context.LeaveRequests
            .AnyAsync(l =>
                l.Id != leave.Id &&
                l.EmployeeId == leave.EmployeeId &&
                l.Status == "Approved" &&
                leave.StartDate <= l.EndDate &&
                leave.EndDate >= l.StartDate);

        if (overlappingApprovedLeave)
        {
            return BadRequest(new
            {
                message = "This leave period overlaps with another approved leave."
            });
        }

        leave.Status = "Approved";
        leave.ManagerComment =
            string.IsNullOrWhiteSpace(request?.Comment)
                ? null
                : request.Comment.Trim();

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Leave request approved successfully.",
            leaveRequestId = leave.Id,
            status = leave.Status,
            managerComment = leave.ManagerComment
        });
    }

    // =========================================================
    // REJECT LEAVE
    // Admin / HR / Manager
    // =========================================================

    [HttpPut("{id:int}/reject")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> RejectLeave(
        int id,
        [FromBody] LeaveDecisionRequest request)
    {
        var leave = await _context.LeaveRequests
            .FirstOrDefaultAsync(l => l.Id == id);

        if (leave == null)
        {
            return NotFound(new
            {
                message = "Leave request not found."
            });
        }

        if (leave.Status != "Pending")
        {
            return BadRequest(new
            {
                message = $"Leave request is already {leave.Status.ToLower()}."
            });
        }

        leave.Status = "Rejected";
        leave.ManagerComment =
            string.IsNullOrWhiteSpace(request?.Comment)
                ? null
                : request.Comment.Trim();

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Leave request rejected successfully.",
            leaveRequestId = leave.Id,
            status = leave.Status,
            managerComment = leave.ManagerComment
        });
    }

    // =========================================================
    // CANCEL MY LEAVE
    // =========================================================

    [HttpPut("{id:int}/cancel")]
    [Authorize(Roles = "Employee,Admin,HR,Manager")]
    public async Task<IActionResult> CancelLeave(int id)
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user information."
            });
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.UserId == userId);

        if (employee == null)
        {
            return NotFound(new
            {
                message = "Employee profile not found."
            });
        }

        var leave = await _context.LeaveRequests
            .FirstOrDefaultAsync(l =>
                l.Id == id &&
                l.EmployeeId == employee.Id);

        if (leave == null)
        {
            return NotFound(new
            {
                message = "Leave request not found."
            });
        }

        if (leave.Status != "Pending")
        {
            return BadRequest(new
            {
                message = "Only pending leave requests can be cancelled."
            });
        }

        leave.Status = "Cancelled";

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Leave request cancelled successfully.",
            leaveRequestId = leave.Id,
            status = leave.Status
        });
    }

    // =========================================================
    // DELETE LEAVE
    // Admin only
    // =========================================================

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteLeave(int id)
    {
        var leave = await _context.LeaveRequests
            .FirstOrDefaultAsync(l => l.Id == id);

        if (leave == null)
        {
            return NotFound(new
            {
                message = "Leave request not found."
            });
        }

        _context.LeaveRequests.Remove(leave);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Leave request deleted successfully."
        });
    }
}

// =============================================================
// REQUEST DTOs
// =============================================================

public class ApplyLeaveRequest
{
    public string LeaveType { get; set; } = string.Empty;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public string Reason { get; set; } = string.Empty;
}

public class LeaveDecisionRequest
{
    public string? Comment { get; set; }
}