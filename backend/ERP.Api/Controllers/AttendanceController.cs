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

    // =========================================================
    // WORK START TIME
    // 08:30 AM
    // =========================================================

    var workStartTime = new TimeOnly(8, 30);

    string status;

    if (currentTime <= workStartTime)
    {
        status = "Present";
    }
    else
    {
        status = "Late";
    }

    // =========================================================
    // CREATE ATTENDANCE
    // =========================================================

    var attendance = new Attendance
    {
        EmployeeId = employee.Id,
        Date = today,
        CheckIn = currentTime,
        Status = status
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
    // ATTENDANCE REPORT
    // Admin / HR / Manager
    //
    // Example:
    // GET /api/Attendance/report
    // GET /api/Attendance/report?fromDate=2026-09-01&toDate=2026-09-07
    // GET /api/Attendance/report?employeeId=5
    // GET /api/Attendance/report?fromDate=2026-09-01&toDate=2026-09-07&employeeId=5
    // =========================================================

    [HttpGet("report")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> GetAttendanceReport(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] int? employeeId)
    {
        var (reportFromDate, reportToDate) = ResolveReportDates(fromDate, toDate);
        if (reportToDate < reportFromDate)
        {
            return BadRequest(new { message = "toDate cannot be before fromDate." });
        }

        var records = await BuildAttendanceReportRecordsAsync(
            reportFromDate,
            reportToDate,
            employeeId);

        var summary = new AttendanceReportSummary
        {
            TotalRecords = records.Count,
            PresentCount = records.Count(record => IsStatus(record, "Present")),
            LateCount = records.Count(record => IsStatus(record, "Late")),
            AbsentCount = records.Count(record => IsStatus(record, "Absent")),
            LeaveCount = records.Count(record => IsStatus(record, "Leave")),
            CompletedCount = records.Count(record => record.CheckIn.HasValue && record.CheckOut.HasValue),
            NotCheckedOutCount = records.Count(record => record.CheckIn.HasValue && !record.CheckOut.HasValue)
        };

        return Ok(new AttendanceReportResponse
        {
            FromDate = fromDate,
            ToDate = toDate,
            EmployeeId = employeeId,
            Summary = summary,
            Records = records
        });
    }

    // =========================================================
    // ATTENDANCE SUMMARY BY EMPLOYEE
    // Admin / HR / Manager
    // =========================================================

    [HttpGet("report/employee-summary")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> GetEmployeeAttendanceSummary(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate)
    {
        var (reportFromDate, reportToDate) = ResolveReportDates(fromDate, toDate);
        if (reportToDate < reportFromDate)
        {
            return BadRequest(new { message = "toDate cannot be before fromDate." });
        }

        var records = await BuildAttendanceReportRecordsAsync(
            reportFromDate,
            reportToDate,
            employeeId: null);

        var summary = records
            .GroupBy(record => new
            {
                record.EmployeeId,
                record.EmployeeName,
                record.DepartmentName
            })
            .Select(group => new EmployeeAttendanceSummaryRecord
            {
                EmployeeId = group.Key.EmployeeId,
                EmployeeName = group.Key.EmployeeName ?? "Unknown",
                DepartmentName = group.Key.DepartmentName ?? "Unknown",
                TotalDays = group.Count(),
                PresentDays = group.Count(record => IsStatus(record, "Present")),
                LateDays = group.Count(record => IsStatus(record, "Late")),
                AbsentDays = group.Count(record => IsStatus(record, "Absent")),
                LeaveDays = group.Count(record => IsStatus(record, "Leave")),
                CompletedDays = group.Count(record => record.CheckIn.HasValue && record.CheckOut.HasValue)
            })
            .OrderBy(record => record.EmployeeName)
            .ToList();

        return Ok(new
        {
            fromDate,
            toDate,
            employees = summary
        });
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

    private static (DateOnly FromDate, DateOnly ToDate) ResolveReportDates(
        DateOnly? fromDate,
        DateOnly? toDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return (
            fromDate ?? toDate ?? today,
            toDate ?? fromDate ?? today);
    }

    private async Task<List<AttendanceReportRecord>> BuildAttendanceReportRecordsAsync(
        DateOnly reportFromDate,
        DateOnly reportToDate,
        int? employeeId)
    {
        var employeesQuery = _context.Employees
            .AsNoTracking()
            .Include(employee => employee.Department)
            .Where(employee => employee.IsActive);

        if (employeeId.HasValue)
        {
            employeesQuery = employeesQuery.Where(employee => employee.Id == employeeId.Value);
        }

        var employees = await employeesQuery.ToListAsync();
        var employeeIds = employees.Select(employee => employee.Id).ToList();

        var attendanceRecords = employeeIds.Count == 0
            ? []
            : await _context.Attendances
                .AsNoTracking()
                .Where(attendance => employeeIds.Contains(attendance.EmployeeId) &&
                                     attendance.Date >= reportFromDate &&
                                     attendance.Date <= reportToDate)
                .Select(attendance => new AttendanceReportRecord
                {
                    Id = attendance.Id,
                    EmployeeId = attendance.EmployeeId,
                    Date = attendance.Date,
                    CheckIn = attendance.CheckIn,
                    CheckOut = attendance.CheckOut,
                    Status = attendance.Status,
                    Remarks = attendance.Remarks
                })
                .ToListAsync();

        var approvedLeaveDates = employeeIds.Count == 0
            ? []
            : await _context.LeaveRequests
                .AsNoTracking()
                .Where(leave => employeeIds.Contains(leave.EmployeeId) &&
                                leave.Status == "Approved" &&
                                leave.StartDate <= reportToDate &&
                                leave.EndDate >= reportFromDate)
                .Select(leave => new ApprovedLeaveDate
                {
                    EmployeeId = leave.EmployeeId,
                    StartDate = leave.StartDate,
                    EndDate = leave.EndDate
                })
                .ToListAsync();

        var recordsByEmployeeAndDate = attendanceRecords
            .ToDictionary(record => (record.EmployeeId, record.Date));
        var leaveByEmployee = approvedLeaveDates
            .GroupBy(leave => leave.EmployeeId)
            .ToDictionary(group => group.Key, group => group.ToList());
        var records = new List<AttendanceReportRecord>();

        foreach (var employee in employees)
        {
            var firstWorkingDate = reportFromDate > employee.HireDate
                ? reportFromDate
                : employee.HireDate;

            for (var date = firstWorkingDate; date <= reportToDate; date = date.AddDays(1))
            {
                if (date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                {
                    continue;
                }

                if (recordsByEmployeeAndDate.TryGetValue((employee.Id, date), out var attendance))
                {
                    records.Add(CreateReportRecord(attendance, employee));
                    continue;
                }

                var isApprovedLeave = leaveByEmployee.TryGetValue(employee.Id, out var employeeLeaves) &&
                    employeeLeaves.Any(leave => date >= leave.StartDate && date <= leave.EndDate);

                records.Add(new AttendanceReportRecord
                {
                    Id = 0,
                    EmployeeId = employee.Id,
                    EmployeeName = $"{employee.FirstName} {employee.LastName}".Trim(),
                    DepartmentName = employee.Department?.Name,
                    Date = date,
                    Status = isApprovedLeave ? "Leave" : "Absent",
                    Remarks = isApprovedLeave ? "Approved leave." : "No attendance recorded."
                });
            }
        }

        return records
            .OrderByDescending(record => record.Date)
            .ThenBy(record => record.EmployeeName)
            .ToList();
    }

    private static AttendanceReportRecord CreateReportRecord(
        AttendanceReportRecord attendance,
        Employee employee)
    {
        return new AttendanceReportRecord
        {
            Id = attendance.Id,
            EmployeeId = attendance.EmployeeId,
            EmployeeName = $"{employee.FirstName} {employee.LastName}".Trim(),
            DepartmentName = employee.Department?.Name,
            Date = attendance.Date,
            CheckIn = attendance.CheckIn,
            CheckOut = attendance.CheckOut,
            Status = attendance.Status,
            Remarks = attendance.Remarks
        };
    }

    private static bool IsStatus(AttendanceReportRecord record, string status)
    {
        return string.Equals(record.Status, status, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class AttendanceReportRecord
    {
        public int Id { get; set; }

        public int EmployeeId { get; set; }

        public string? EmployeeName { get; set; }

        public string? DepartmentName { get; set; }

        public DateOnly Date { get; set; }

        public TimeOnly? CheckIn { get; set; }

        public TimeOnly? CheckOut { get; set; }

        public string Status { get; set; } = string.Empty;

        public string? Remarks { get; set; }
    }

    private sealed class ApprovedLeaveDate
    {
        public int EmployeeId { get; set; }

        public DateOnly StartDate { get; set; }

        public DateOnly EndDate { get; set; }
    }

    private sealed class AttendanceReportSummary
    {
        public int TotalRecords { get; set; }

        public int PresentCount { get; set; }

        public int LateCount { get; set; }

        public int AbsentCount { get; set; }

        public int LeaveCount { get; set; }

        public int CompletedCount { get; set; }

        public int NotCheckedOutCount { get; set; }
    }

    private sealed class EmployeeAttendanceSummaryRecord
    {
        public int EmployeeId { get; set; }

        public string EmployeeName { get; set; } = string.Empty;

        public string DepartmentName { get; set; } = string.Empty;

        public int TotalDays { get; set; }

        public int PresentDays { get; set; }

        public int LateDays { get; set; }

        public int AbsentDays { get; set; }

        public int LeaveDays { get; set; }

        public int CompletedDays { get; set; }
    }

    private sealed class AttendanceReportResponse
    {
        public DateOnly? FromDate { get; set; }

        public DateOnly? ToDate { get; set; }

        public int? EmployeeId { get; set; }

        public AttendanceReportSummary Summary { get; set; } = new();

        public IReadOnlyList<AttendanceReportRecord> Records { get; set; } = [];
    }
}

public class UpdateAttendanceRequest
{
    public TimeOnly? CheckIn { get; set; }

    public TimeOnly? CheckOut { get; set; }

    public string? Status { get; set; }

    public string? Remarks { get; set; }
}