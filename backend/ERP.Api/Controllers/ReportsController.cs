using ERP.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,HR,Manager")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("employees")]
    public async Task<IActionResult> Employees()
    {
        return Ok(await _context.Employees
            .Include(employee => employee.Department)
            .Select(employee => new
            {
                employee.Id,
                name = employee.FirstName + " " + employee.LastName,
                department = employee.Department == null ? null : employee.Department.Name,
                employee.HireDate,
                employee.Salary,
                employee.IsActive
            })
            .OrderBy(employee => employee.name)
            .ToListAsync());
    }

    [HttpGet("attendance")]
    public async Task<IActionResult> Attendance()
    {
        return Ok(await _context.Attendances
            .GroupBy(attendance => attendance.Status)
            .Select(group => new { status = group.Key, count = group.Count() })
            .ToListAsync());
    }

    [HttpGet("leave")]
    public async Task<IActionResult> Leave()
    {
        return Ok(await _context.LeaveRequests
            .GroupBy(leave => leave.Status)
            .Select(group => new { status = group.Key, count = group.Count() })
            .ToListAsync());
    }

    [HttpGet("payroll")]
    public async Task<IActionResult> Payroll()
    {
        return Ok(await _context.Payrolls
            .GroupBy(payroll => new { payroll.Year, payroll.Month })
            .Select(group => new
            {
                group.Key.Year,
                group.Key.Month,
                records = group.Count(),
                totalBasicSalary = group.Sum(payroll => payroll.BasicSalary),
                totalAllowances = group.Sum(payroll => payroll.Allowances),
                totalDeductions = group.Sum(payroll => payroll.Deductions),
                totalNetSalary = group.Sum(payroll => payroll.NetSalary)
            })
            .OrderByDescending(report => report.Year)
            .ThenByDescending(report => report.Month)
            .Take(12)
            .ToListAsync());
    }

    [HttpGet("departments")]
    public async Task<IActionResult> Departments()
    {
        return Ok(await _context.Departments
            .Select(department => new
            {
                department.Id,
                department.Name,
                employeeCount = department.Employees.Count(),
                activeEmployees = department.Employees.Count(employee => employee.IsActive)
            })
            .OrderByDescending(department => department.employeeCount)
            .ToListAsync());
    }
}