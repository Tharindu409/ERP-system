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
    private static readonly IReadOnlyDictionary<string, int> LeaveAllocations =
        new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["Annual"] = 20,
            ["Sick"] = 10,
            ["Casual"] = 7,
            ["Unpaid"] = 0
        };

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

        var leaveType = NormalizeLeaveType(request.LeaveType);
        if (leaveType == null)
        {
            return BadRequest(new { message = "Leave type must be Annual, Sick, Casual, or Unpaid." });
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
            LeaveType = leaveType,
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

    // GET: api/Leave/balance
    [HttpGet("balance")]
    [Authorize(Roles = "Employee,Admin,HR,Manager")]
    public async Task<IActionResult> GetMyLeaveBalance()
    {
        var employee = await GetCurrentEmployeeAsync();
        if (employee == null)
        {
            return NotFound(new { message = "Employee profile not found." });
        }

        var year = DateTime.UtcNow.Year;
        var yearStart = new DateOnly(year, 1, 1);
        var yearEnd = new DateOnly(year, 12, 31);
        var leaves = await _context.LeaveRequests
            .Where(leave => leave.EmployeeId == employee.Id &&
                leave.StartDate <= yearEnd && leave.EndDate >= yearStart)
            .ToListAsync();

        var balances = LeaveAllocations.Select(allocation =>
        {
            var usedDays = CountLeaveDays(leaves, allocation.Key, year, "Approved");
            var pendingDays = CountLeaveDays(leaves, allocation.Key, year, "Pending");

            return new
            {
                leaveType = allocation.Key,
                totalDays = allocation.Value,
                usedDays,
                pendingDays,
                remainingDays = allocation.Value == 0
                    ? 0
                    : Math.Max(allocation.Value - usedDays - pendingDays, 0)
            };
        });

        return Ok(new
        {
            employeeId = employee.Id,
            employeeName = $"{employee.FirstName} {employee.LastName}".Trim(),
            year,
            balances
        });
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

        if (LeaveAllocations.TryGetValue(leave.LeaveType, out var allocation) && allocation > 0)
        {
            var year = DateTime.UtcNow.Year;
            var usedDays = await GetLeaveDaysForStatusAsync(leave.EmployeeId, leave.LeaveType, year, "Approved", leave.Id);
            var pendingDays = await GetLeaveDaysForStatusAsync(leave.EmployeeId, leave.LeaveType, year, "Pending", leave.Id);
            var requestedDays = GetLeaveDays(leave.StartDate, leave.EndDate, year);

            if (usedDays + pendingDays + requestedDays > allocation)
            {
                return BadRequest(new
                {
                    message = $"Cannot approve this request. The {leave.LeaveType} leave balance would exceed the {allocation}-day annual allowance."
                });
            }
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
    // UPDATE LEAVE
    // Employee can update own pending request; Admin / HR / Manager can update pending requests
    // =========================================================

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Employee,Admin,HR,Manager")]
    public async Task<IActionResult> UpdateLeave(
        int id,
        [FromBody] ApplyLeaveRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.LeaveType) ||
            request.StartDate == default ||
            request.EndDate == default ||
            request.EndDate < request.StartDate ||
            string.IsNullOrWhiteSpace(request.Reason))
        {
            return BadRequest(new
            {
                message = "Leave type, valid dates, and reason are required."
            });
        }

        var leaveType = NormalizeLeaveType(request.LeaveType);
        if (leaveType == null)
        {
            return BadRequest(new { message = "Leave type must be Annual, Sick, Casual, or Unpaid." });
        }

        var leave = await _context.LeaveRequests.FirstOrDefaultAsync(l => l.Id == id);
        if (leave == null)
        {
            return NotFound(new { message = "Leave request not found." });
        }

        if (leave.Status != "Pending")
        {
            return BadRequest(new { message = "Only pending leave requests can be updated." });
        }

        var overlappingLeave = await _context.LeaveRequests
            .AnyAsync(existing =>
                existing.Id != leave.Id &&
                existing.EmployeeId == leave.EmployeeId &&
                (existing.Status == "Pending" || existing.Status == "Approved") &&
                request.StartDate <= existing.EndDate &&
                request.EndDate >= existing.StartDate);

        if (overlappingLeave)
        {
            return BadRequest(new { message = "This leave period overlaps with another pending or approved leave." });
        }

        if (User.IsInRole("Employee"))
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid user information." });
            }

            var ownsRequest = await _context.Employees
                .AnyAsync(employee => employee.Id == leave.EmployeeId && employee.UserId == userId);
            if (!ownsRequest)
            {
                return Forbid();
            }
        }

        leave.LeaveType = leaveType;
        leave.StartDate = request.StartDate;
        leave.EndDate = request.EndDate;
        leave.Reason = request.Reason.Trim();

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Leave request updated successfully.",
            leaveRequestId = leave.Id,
            leave.LeaveType,
            leave.StartDate,
            leave.EndDate,
            leave.Reason,
            leave.Status
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

    private async Task<Employee?> GetCurrentEmployeeAsync()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId)
            ? await _context.Employees.FirstOrDefaultAsync(employee => employee.UserId == userId)
            : null;
    }

    private static string? NormalizeLeaveType(string leaveType)
    {
        return LeaveAllocations.Keys.FirstOrDefault(
            type => type.Equals(leaveType.Trim(), StringComparison.OrdinalIgnoreCase));
    }

    private static int CountLeaveDays(
        IEnumerable<LeaveRequest> leaves,
        string leaveType,
        int year,
        string status)
    {
        return leaves
            .Where(leave => leave.LeaveType.Equals(leaveType, StringComparison.OrdinalIgnoreCase) && leave.Status == status)
            .Sum(leave => GetLeaveDays(leave.StartDate, leave.EndDate, year));
    }

    private async Task<int> GetLeaveDaysForStatusAsync(
        int employeeId,
        string leaveType,
        int year,
        string status,
        int excludedLeaveId)
    {
        var yearStart = new DateOnly(year, 1, 1);
        var yearEnd = new DateOnly(year, 12, 31);
        var leaves = await _context.LeaveRequests
            .Where(leave => leave.EmployeeId == employeeId &&
                leave.Id != excludedLeaveId &&
                leave.Status == status &&
                leave.LeaveType == leaveType &&
                leave.StartDate <= yearEnd &&
                leave.EndDate >= yearStart)
            .ToListAsync();

        return leaves.Sum(leave => GetLeaveDays(leave.StartDate, leave.EndDate, year));
    }

    private static int GetLeaveDays(DateOnly startDate, DateOnly endDate, int year)
    {
        var yearStart = new DateOnly(year, 1, 1);
        var yearEnd = new DateOnly(year, 12, 31);
        var start = startDate < yearStart ? yearStart : startDate;
        var end = endDate > yearEnd ? yearEnd : endDate;
        return end < start ? 0 : end.DayNumber - start.DayNumber + 1;
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