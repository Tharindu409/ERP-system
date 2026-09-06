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
            }
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