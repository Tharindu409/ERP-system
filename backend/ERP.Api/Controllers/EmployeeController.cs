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

    // GET: api/Employee
    [Authorize(Roles = "Admin,HR,Manager")]
    [HttpGet]
    public async Task<IActionResult> GetEmployees()
    {
        var employees = await _context.Employees
            .Include(e => e.Department)
            .Select(e => new EmployeeDto
            {
                Id = e.Id,
                UserId = e.UserId,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Phone = e.Phone,
                Address = e.Address,
                HireDate = e.HireDate,
                Salary = e.Salary,
                DepartmentId = e.DepartmentId,
                DepartmentName = e.Department!.Name,
                IsActive = e.IsActive
            })
            .ToListAsync();

        return Ok(employees);
    }

    // GET: api/Employee/1
    [Authorize(Roles = "Admin,HR,Manager")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetEmployee(int id)
    {
        var employee = await _context.Employees
            .Include(e => e.Department)
            .Where(e => e.Id == id)
            .Select(e => new EmployeeDto
            {
                Id = e.Id,
                UserId = e.UserId,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Phone = e.Phone,
                Address = e.Address,
                HireDate = e.HireDate,
                Salary = e.Salary,
                DepartmentId = e.DepartmentId,
                DepartmentName = e.Department!.Name,
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

    // POST: api/Employee
    [Authorize(Roles = "Admin,HR")]
    [HttpPost]
    public async Task<IActionResult> CreateEmployee(Employee employee)
    {
        var department = await _context.Departments
            .FindAsync(employee.DepartmentId);

        if (department == null)
        {
            return BadRequest(new
            {
                message = "Department not found."
            });
        }

        var user = await _context.Users
            .FindAsync(employee.UserId);

        if (user == null)
        {
            return BadRequest(new
            {
                message = "User not found."
            });
        }

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
                HireDate = employee.HireDate,
                Salary = employee.Salary,
                DepartmentId = employee.DepartmentId,
                DepartmentName = department.Name,
                IsActive = employee.IsActive
            }
        );
    }

    // PUT: api/Employee/1
    [Authorize(Roles = "Admin,HR")]
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
                DepartmentName = department.Name,
                IsActive = employee.IsActive
            }
        });
    }

    // DELETE: api/Employee/1
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