using ERP.Api.Data;
using ERP.Api.DTOs;
using ERP.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeeController : ControllerBase
{
    private readonly AppDbContext _context;

    public EmployeeController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/employee
    [Authorize(Roles = "Admin,HR,Manager")]
    [HttpGet]
    public async Task<IActionResult> GetEmployees()
    {
        var employees = await _context.Employees
            .Select(e => new EmployeeDto
            {
                Id = e.Id,
                UserId = e.UserId,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Phone = e.Phone,
                Address = e.Address,
                HireDate = e.HireDate.AddDays(0), // Ensure DateOnly is returned correctly
                Salary = e.Salary,
                DepartmentId = e.DepartmentId,
                IsActive = e.IsActive
            })
            .ToListAsync();

        return Ok(employees);
    }

    // GET: api/employee/1
    [Authorize(Roles = "Admin,HR,Manager")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetEmployee(int id)
    {
        var employee = await _context.Employees
            .Where(e => e.Id == id)
            .Select(e => new EmployeeDto
            {
                Id = e.Id,
                UserId = e.UserId,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Phone = e.Phone,
                Address = e.Address,
                HireDate = e.HireDate.AddDays(0),
                Salary = e.Salary,
                DepartmentId = e.DepartmentId,
                IsActive = e.IsActive
            })
            .FirstOrDefaultAsync();

        if (employee == null)
        {
            return NotFound(new
            {
                message = "Employee not found."
            });
        }

        return Ok(employee);
    }
    [Authorize(Roles = "Admin,HR")]
    // POST: api/employee
    [HttpPost]
    public async Task<IActionResult> CreateEmployee(Employee employee)
    {
        // Check department exists
        var department = await _context.Departments
            .FindAsync(employee.DepartmentId);

        if (department == null)
        {
            return BadRequest(new
            {
                message = "Department not found."
            });
        }

        // Check user exists
        var user = await _context.Users
            .FindAsync(employee.UserId);

        if (user == null)
        {
            return BadRequest(new
            {
                message = "User not found."
            });
        }

        // Check if user is already an employee
        var existingEmployee = await _context.Employees
            .FirstOrDefaultAsync(e => e.UserId == employee.UserId);

        if (existingEmployee != null)
        {
            return BadRequest(new
            {
                message = "This user is already an employee."
            });
        }

        _context.Employees.Add(employee);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetEmployee),
            new { id = employee.Id },
            new EmployeeDto
            {
                Id = employee.Id,
                UserId = employee.UserId,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Phone = employee.Phone,
                Address = employee.Address,
                HireDate = employee.HireDate.AddDays(0),
                Salary = employee.Salary,
                DepartmentId = employee.DepartmentId,
                IsActive = employee.IsActive
            }
        );
    }
    [Authorize(Roles = "Admin,HR")]
    // PUT: api/employee/1
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEmployee(
        int id,
        Employee updatedEmployee)
    {
        var employee = await _context.Employees
            .FindAsync(id);

        if (employee == null)
        {
            return NotFound(new
            {
                message = "Employee not found."
            });
        }

        // Check department
        var department = await _context.Departments
            .FindAsync(updatedEmployee.DepartmentId);

        if (department == null)
        {
            return BadRequest(new
            {
                message = "Department not found."
            });
        }

        employee.FirstName = updatedEmployee.FirstName;
        employee.LastName = updatedEmployee.LastName;
        employee.Phone = updatedEmployee.Phone;
        employee.Address = updatedEmployee.Address;
        employee.HireDate = updatedEmployee.HireDate;
        employee.Salary = updatedEmployee.Salary;
        employee.DepartmentId = updatedEmployee.DepartmentId;
        employee.IsActive = updatedEmployee.IsActive;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Employee updated successfully.",
            employee = new EmployeeDto
            {
                Id = employee.Id,
                UserId = employee.UserId,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Phone = employee.Phone,
                Address = employee.Address,
                HireDate = employee.HireDate,
                Salary = employee.Salary,
                DepartmentId = employee.DepartmentId,
                IsActive = employee.IsActive
            }
        });
    }

    // DELETE: api/employee/1
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEmployee(int id)
    {
        var employee = await _context.Employees
            .FindAsync(id);

        if (employee == null)
        {
            return NotFound(new
            {
                message = "Employee not found."
            });
        }

        _context.Employees.Remove(employee);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Employee deleted successfully."
        });
    }
}