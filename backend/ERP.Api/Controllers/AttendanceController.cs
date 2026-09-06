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
public class AttendanceController : ControllerBase
{
    private readonly AppDbContext _context;

    public AttendanceController(AppDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET ALL ATTENDANCE
    // Admin / HR / Manager
    // =========================================================

    [HttpGet]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> GetAllAttendance()
    {
        var attendance = await _context.Attendances
            .Include(a => a.Employee)
            .OrderByDescending(a => a.Date)
            .ThenBy(a => a.Employee!.FirstName)
            .Select(a => new
            {
                a.Id,
                employeeId = a.EmployeeId,
                employeeName = a.Employee != null
                    ? a.Employee.FirstName + " " + a.Employee.LastName
                    : null,
                a.Date,
                a.CheckIn,
                a.CheckOut,
                a.Status,
                a.Remarks
            })
            .ToListAsync();

        return Ok(attendance);
    }

    // =========================================================
    // GET ATTENDANCE BY ID
    // =========================================================

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> GetAttendance(int id)
    {
        var attendance = await _context.Attendances
            .Include(a => a.Employee)
            .Where(a => a.Id == id)
            .Select(a => new
            {
                a.Id,
                employeeId = a.EmployeeId,
                employeeName = a.Employee != null
                    ? a.Employee.FirstName + " " + a.Employee.LastName
                    : null,
                a.Date,
                a.CheckIn,
                a.CheckOut,
                a.Status,
                a.Remarks
            })
            .FirstOrDefaultAsync();

        if (attendance == null)
        {
            return NotFound(new
            {
                message = "Attendance record not found."
            });
        }

        return Ok(attendance);
    }

    // =========================================================
    // CHECK IN
    // Employee / Admin / HR / Manager
    // =========================================================

    [HttpPost("check-in")]
    [Authorize(Roles = "Admin,HR,Manager,Employee")]
    public async Task<IActionResult> CheckIn()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

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
                message = "Employee profile not found for this user."
            });
        }

        if (!employee.IsActive)
        {
            return BadRequest(new
            {
                message = "Your employee account is inactive."
            });
        }

        var today = DateOnly.FromDateTime(DateTime.Now);
        var currentTime = TimeOnly.FromDateTime(DateTime.Now);

        var existingAttendance = await _context.Attendances
            .FirstOrDefaultAsync(a =>
                a.EmployeeId == employee.Id &&
                a.Date == today);

        if (existingAttendance != null)
        {
            return BadRequest(new
            {
                message = "Attendance has already been marked for today.",
                checkIn = existingAttendance.CheckIn,
                checkOut = existingAttendance.CheckOut
            });
        }

        var attendance = new Attendance
        {
            EmployeeId = employee.Id,
            Date = today,
            CheckIn = currentTime,
            Status = "Present"
        };

        _context.Attendances.Add(attendance);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Check-in successful.",
            attendanceId = attendance.Id,
            employeeId = employee.Id,
            date = attendance.Date,
            checkIn = attendance.CheckIn,
            status = attendance.Status
        });
    }

    // =========================================================
    // CHECK OUT
    // Employee / Admin / HR / Manager
    // =========================================================

    [HttpPut("check-out")]
    [Authorize(Roles = "Admin,HR,Manager,Employee")]
    public async Task<IActionResult> CheckOut()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

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
                message = "Employee profile not found for this user."
            });
        }

        var today = DateOnly.FromDateTime(DateTime.Now);
        var currentTime = TimeOnly.FromDateTime(DateTime.Now);

        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a =>
                a.EmployeeId == employee.Id &&
                a.Date == today);

        if (attendance == null)
        {
            return BadRequest(new
            {
                message = "You must check in before checking out."
            });
        }

        if (attendance.CheckOut != null)
        {
            return BadRequest(new
            {
                message = "You have already checked out today.",
                checkOut = attendance.CheckOut
            });
        }

        attendance.CheckOut = currentTime;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Check-out successful.",
            attendanceId = attendance.Id,
            employeeId = employee.Id,
            date = attendance.Date,
            checkIn = attendance.CheckIn,
            checkOut = attendance.CheckOut,
            status = attendance.Status
        });
    }

    // =========================================================
    // GET MY ATTENDANCE
    // =========================================================

    [HttpGet("my")]
    [Authorize(Roles = "Employee,Admin,HR,Manager")]
    public async Task<IActionResult> GetMyAttendance()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

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

        var attendance = await _context.Attendances
            .Where(a => a.EmployeeId == employee.Id)
            .OrderByDescending(a => a.Date)
            .Select(a => new
            {
                a.Id,
                a.Date,
                a.CheckIn,
                a.CheckOut,
                a.Status,
                a.Remarks
            })
            .ToListAsync();

        return Ok(attendance);
    }

    // =========================================================
    // GET ATTENDANCE BY EMPLOYEE
    // Admin / HR / Manager
    // =========================================================

    [HttpGet("employee/{employeeId:int}")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> GetEmployeeAttendance(int employeeId)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId);

        if (employee == null)
        {
            return NotFound(new
            {
                message = "Employee not found."
            });
        }

        var attendance = await _context.Attendances
            .Where(a => a.EmployeeId == employeeId)
            .OrderByDescending(a => a.Date)
            .Select(a => new
            {
                a.Id,
                a.Date,
                a.CheckIn,
                a.CheckOut,
                a.Status,
                a.Remarks
            })
            .ToListAsync();

        return Ok(new
        {
            employeeId = employee.Id,
            employeeName = employee.FirstName + " " + employee.LastName,
            attendance
        });
    }

    // =========================================================
    // GET ATTENDANCE BY DATE
    // Admin / HR / Manager
    // =========================================================

    [HttpGet("date/{date}")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> GetAttendanceByDate(DateOnly date)
    {
        var attendance = await _context.Attendances
            .Include(a => a.Employee)
            .Where(a => a.Date == date)
            .Select(a => new
            {
                a.Id,
                employeeId = a.EmployeeId,
                employeeName = a.Employee != null
                    ? a.Employee.FirstName + " " + a.Employee.LastName
                    : null,
                a.Date,
                a.CheckIn,
                a.CheckOut,
                a.Status,
                a.Remarks
            })
            .ToListAsync();

        return Ok(attendance);
    }

    // =========================================================
    // UPDATE ATTENDANCE
    // Admin / HR / Manager
    // =========================================================

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> UpdateAttendance(
        int id,
        [FromBody] UpdateAttendanceRequest request)
    {
        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attendance == null)
        {
            return NotFound(new
            {
                message = "Attendance record not found."
            });
        }

        if (request.CheckIn.HasValue)
        {
            attendance.CheckIn = request.CheckIn;
        }

        if (request.CheckOut.HasValue)
        {
            attendance.CheckOut = request.CheckOut;
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            attendance.Status = request.Status.Trim();
        }

        attendance.Remarks = request.Remarks;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Attendance updated successfully.",
            attendanceId = attendance.Id,
            employeeId = attendance.EmployeeId,
            date = attendance.Date,
            checkIn = attendance.CheckIn,
            checkOut = attendance.CheckOut,
            status = attendance.Status,
            remarks = attendance.Remarks
        });
    }

    // =========================================================
    // DELETE ATTENDANCE
    // Admin only
    // =========================================================

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAttendance(int id)
    {
        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attendance == null)
        {
            return NotFound(new
            {
                message = "Attendance record not found."
            });
        }

        _context.Attendances.Remove(attendance);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Attendance deleted successfully."
        });
    }
}

public class UpdateAttendanceRequest
{
    public TimeOnly? CheckIn { get; set; }

    public TimeOnly? CheckOut { get; set; }

    public string? Status { get; set; }

    public string? Remarks { get; set; }
}