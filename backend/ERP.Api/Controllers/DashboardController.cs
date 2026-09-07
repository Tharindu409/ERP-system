using System.Security.Claims;
using ERP.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET: api/dashboard
    // Dashboard summary
    // =========================================================
    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        // Employee statistics
        var totalEmployees = await _context.Employees.CountAsync();

        var activeEmployees = await _context.Employees
            .CountAsync(e => e.IsActive);

        var inactiveEmployees = await _context.Employees
            .CountAsync(e => !e.IsActive);

        // Department statistics
        var totalDepartments = await _context.Departments.CountAsync();

        // User statistics
        var totalUsers = await _context.Users.CountAsync();

        var activeUsers = await _context.Users
            .CountAsync(u => u.IsActive);

        var inactiveUsers = await _context.Users
            .CountAsync(u => !u.IsActive);

        var today = DateOnly.FromDateTime(DateTime.Now);
        var monthlyPayroll = await _context.Payrolls
            .Where(payroll => payroll.Year == today.Year && payroll.Month == today.Month)
            .Select(payroll => (decimal?)payroll.NetSalary)
            .SumAsync() ?? 0m;

        return Ok(new
        {
            employees = new
            {
                total = totalEmployees,
                active = activeEmployees,
                inactive = inactiveEmployees
            },

            departments = new
            {
                total = totalDepartments
            },

            users = new
            {
                total = totalUsers,
                active = activeUsers,
                inactive = inactiveUsers
            },
            today = new
            {
                attendance = await _context.Attendances.CountAsync(attendance => attendance.Date == today),
                present = await _context.Attendances.CountAsync(attendance => attendance.Date == today && attendance.Status == "Present"),
                absent = await _context.Attendances.CountAsync(attendance => attendance.Date == today && attendance.Status == "Absent"),
                leave = await _context.Attendances.CountAsync(attendance => attendance.Date == today && attendance.Status == "Leave")
            },
            pendingLeave = await _context.LeaveRequests.CountAsync(leave => leave.Status == "Pending"),
            monthlyPayroll
        });
    }

    [HttpGet("analytics")]
    [Authorize(Roles = "Admin,HR,Manager,Employee")]
    public async Task<IActionResult> GetAnalytics()
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var managementRole = User.IsInRole("Admin") || User.IsInRole("HR") || User.IsInRole("Manager");
        var employeesQuery = _context.Employees
            .AsNoTracking()
            .Where(employee => employee.IsActive && employee.HireDate <= today);

        if (!managementRole)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid user information." });
            }

            employeesQuery = employeesQuery.Where(employee => employee.UserId == userId);
        }

        var employees = await employeesQuery
            .Select(employee => new { employee.Id })
            .ToListAsync();
        var employeeIds = employees.Select(employee => employee.Id).ToList();

        var attendance = employeeIds.Count == 0
            ? []
            : await _context.Attendances
                .AsNoTracking()
                .Where(record => employeeIds.Contains(record.EmployeeId) && record.Date == today)
                .ToListAsync();
        var approvedLeaveEmployeeIds = employeeIds.Count == 0
            ? []
            : await _context.LeaveRequests
                .AsNoTracking()
                .Where(leave => employeeIds.Contains(leave.EmployeeId) &&
                                leave.Status == "Approved" &&
                                leave.StartDate <= today &&
                                leave.EndDate >= today)
                .Select(leave => leave.EmployeeId)
                .Distinct()
                .ToListAsync();

        var presentToday = attendance.Count(record => record.Status == "Present");
        var lateToday = attendance.Count(record => record.Status == "Late");
        var completedToday = attendance.Count(record => record.CheckIn.HasValue && record.CheckOut.HasValue);
        var checkedInToday = attendance.Count(record => record.CheckIn.HasValue);
        var leaveToday = approvedLeaveEmployeeIds
            .Except(attendance.Select(record => record.EmployeeId))
            .Count();
        var absentToday = today.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday
            ? 0
            : Math.Max(employeeIds.Count - attendance.Select(record => record.EmployeeId)
                .Concat(approvedLeaveEmployeeIds)
                .Distinct()
                .Count(), 0);
        var workingEmployees = employeeIds.Count;
        var attendancePercentage = workingEmployees == 0
            ? 0
            : Math.Round((decimal)(presentToday + lateToday) / workingEmployees * 100, 2);

        var pendingLeaveQuery = _context.LeaveRequests
            .AsNoTracking()
            .Where(leave => leave.Status == "Pending");
        var approvedLeaveQuery = _context.LeaveRequests
            .AsNoTracking()
            .Where(leave => leave.Status == "Approved");
        var rejectedLeaveQuery = _context.LeaveRequests
            .AsNoTracking()
            .Where(leave => leave.Status == "Rejected");

        if (!managementRole)
        {
            pendingLeaveQuery = pendingLeaveQuery.Where(leave => employeeIds.Contains(leave.EmployeeId));
            approvedLeaveQuery = approvedLeaveQuery.Where(leave => employeeIds.Contains(leave.EmployeeId));
            rejectedLeaveQuery = rejectedLeaveQuery.Where(leave => employeeIds.Contains(leave.EmployeeId));
        }

        var currentPayrollQuery = _context.Payrolls
            .AsNoTracking()
            .Where(payroll => payroll.Year == today.Year && payroll.Month == today.Month);
        if (!managementRole)
        {
            currentPayrollQuery = currentPayrollQuery.Where(payroll => employeeIds.Contains(payroll.EmployeeId));
        }

        return Ok(new DashboardAnalyticsResponse
        {
            IsManagement = managementRole,
            TotalEmployees = managementRole ? await _context.Employees.CountAsync(employee => employee.IsActive) : workingEmployees,
            PresentToday = presentToday,
            LateToday = lateToday,
            AbsentToday = absentToday,
            OnLeaveToday = leaveToday,
            AttendancePercentage = attendancePercentage,
            CompletedCheckOuts = completedToday,
            NotCheckedOut = Math.Max(checkedInToday - completedToday, 0),
            PendingLeaveRequests = await pendingLeaveQuery.CountAsync(),
            ApprovedLeaveRequests = await approvedLeaveQuery.CountAsync(),
            RejectedLeaveRequests = await rejectedLeaveQuery.CountAsync(),
            PayrollProcessed = await currentPayrollQuery.CountAsync(),
            PayrollTotal = await currentPayrollQuery.Select(payroll => (decimal?)payroll.NetSalary).SumAsync() ?? 0m
        });
    }


    // =========================================================
    // GET: api/dashboard/departments
    // Department employee statistics
    // =========================================================
    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartmentStatistics()
    {
        var departments = await _context.Departments
            .Select(d => new
            {
                departmentId = d.Id,
                departmentName = d.Name,
                totalEmployees = d.Employees.Count(),
                activeEmployees = d.Employees.Count(e => e.IsActive),
                inactiveEmployees = d.Employees.Count(e => !e.IsActive)
            })
            .ToListAsync();

        return Ok(departments);
    }


    // =========================================================
    // GET: api/dashboard/recent-employees
    // Recently hired employees
    // =========================================================
    [HttpGet("recent-employees")]
    public async Task<IActionResult> GetRecentEmployees()
    {
        var employees = await _context.Employees
            .Include(e => e.Department)
            .OrderByDescending(e => e.HireDate)
            .Take(5)
            .Select(e => new
            {
                employeeId = e.Id,
                firstName = e.FirstName,
                lastName = e.LastName,
                hireDate = e.HireDate,
                department = e.Department != null
                    ? e.Department.Name
                    : null,
                isActive = e.IsActive
            })
            .ToListAsync();

        return Ok(employees);
    }
}

public sealed class DashboardAnalyticsResponse
{
    public bool IsManagement { get; set; }

    public int TotalEmployees { get; set; }

    public int PresentToday { get; set; }

    public int LateToday { get; set; }

    public int AbsentToday { get; set; }

    public int OnLeaveToday { get; set; }

    public decimal AttendancePercentage { get; set; }

    public int CompletedCheckOuts { get; set; }

    public int NotCheckedOut { get; set; }

    public int PendingLeaveRequests { get; set; }

    public int ApprovedLeaveRequests { get; set; }

    public int RejectedLeaveRequests { get; set; }

    public int PayrollProcessed { get; set; }

    public decimal PayrollTotal { get; set; }
}