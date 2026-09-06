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
public class DepartmentController : ControllerBase
{
    private readonly AppDbContext _context;

    public DepartmentController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/department
    [HttpGet]
    public async Task<IActionResult> GetDepartments()
    {
        var departments = await _context.Departments
            .Select(d => new DepartmentDto
            {
                Id = d.Id,
                Name = d.Name,
                Description = d.Description
            })
            .ToListAsync();

        return Ok(departments);
    }

    // GET: api/department/1
    [HttpGet("{id}")]
    public async Task<IActionResult> GetDepartment(int id)
    {
        var department = await _context.Departments
            .Where(d => d.Id == id)
            .Select(d => new DepartmentDto
            {
                Id = d.Id,
                Name = d.Name,
                Description = d.Description
            })
            .FirstOrDefaultAsync();

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        return Ok(department);
    }

    // POST: api/department
    [Authorize(Roles = "Admin,HR")]
    [HttpPost]
    public async Task<IActionResult> CreateDepartment(Department department)
    {
        // Check duplicate department
        var existingDepartment = await _context.Departments
            .FirstOrDefaultAsync(d => d.Name == department.Name);

        if (existingDepartment != null)
        {
            return BadRequest(new
            {
                message = "Department already exists."
            });
        }

        _context.Departments.Add(department);

        await _context.SaveChangesAsync();

        var response = new DepartmentDto
        {
            Id = department.Id,
            Name = department.Name,
            Description = department.Description
        };

        return CreatedAtAction(
            nameof(GetDepartment),
            new { id = department.Id },
            response
        );
    }

    // PUT: api/department/1
    [Authorize(Roles = "Admin,HR")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDepartment(
        int id,
        Department updatedDepartment)
    {
        var department = await _context.Departments
            .FindAsync(id);

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        // Check duplicate name
        var duplicate = await _context.Departments
            .AnyAsync(d =>
                d.Id != id &&
                d.Name == updatedDepartment.Name);

        if (duplicate)
        {
            return BadRequest(new
            {
                message = "Another department already has this name."
            });
        }

        department.Name = updatedDepartment.Name;
        department.Description = updatedDepartment.Description;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Department updated successfully.",
            department = new DepartmentDto
            {
                Id = department.Id,
                Name = department.Name,
                Description = department.Description
            }
        });
    }

    // DELETE: api/department/1
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDepartment(int id)
    {
        var department = await _context.Departments
            .Include(d => d.Employees)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (department == null)
        {
            return NotFound(new
            {
                message = "Department not found."
            });
        }

        // Don't delete department if employees exist
        if (department.Employees.Any())
        {
            return BadRequest(new
            {
                message = "Cannot delete this department because it has employees."
            });
        }

        _context.Departments.Remove(department);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Department deleted successfully."
        });
    }
}