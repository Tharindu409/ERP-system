using ERP.Api.Data;
using ERP.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,HR,Manager")]
public class PayrollController : ControllerBase
{
    private readonly AppDbContext _context;

    public PayrollController(AppDbContext context)
    {
        _context = context;
    }

    // GET ALL PAYROLL
    [HttpGet]
    public async Task<IActionResult> GetAllPayroll()
    {
        var payrolls = await _context.Payrolls
            .Include(p => p.Employee)
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .Select(p => new
            {
                p.Id,
                employeeId = p.EmployeeId,
                employeeName = p.Employee != null
                    ? p.Employee.FirstName + " " + p.Employee.LastName
                    : null,
                p.Year,
                p.Month,
                p.BasicSalary,
                p.Allowances,
                p.Deductions,
                p.NetSalary,
                p.Status,
                p.GeneratedAt
            })
            .ToListAsync();

        return Ok(payrolls);
    }

    // GET PAYROLL BY ID
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPayroll(int id)
    {
        var payroll = await _context.Payrolls
            .Include(p => p.Employee)
            .Where(p => p.Id == id)
            .Select(p => new
            {
                p.Id,
                employeeId = p.EmployeeId,
                employeeName = p.Employee != null
                    ? p.Employee.FirstName + " " + p.Employee.LastName
                    : null,
                p.Year,
                p.Month,
                p.BasicSalary,
                p.Allowances,
                p.Deductions,
                p.NetSalary,
                p.Status,
                p.GeneratedAt
            })
            .FirstOrDefaultAsync();

        if (payroll == null)
        {
            return NotFound(new
            {
                message = "Payroll record not found."
            });
        }

        return Ok(payroll);
    }

    // GENERATE PAYROLL
    [HttpPost("generate")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> GeneratePayroll(
        [FromBody] GeneratePayrollRequest request)
    {
        if (request == null)
        {
            return BadRequest(new
            {
                message = "Payroll data is required."
            });
        }

        if (request.EmployeeId <= 0)
        {
            return BadRequest(new
            {
                message = "Valid employee ID is required."
            });
        }

        if (request.Year < 2000 || request.Year > 2100)
        {
            return BadRequest(new
            {
                message = "Invalid year."
            });
        }

        if (request.Month < 1 || request.Month > 12)
        {
            return BadRequest(new
            {
                message = "Month must be between 1 and 12."
            });
        }

        if (request.Allowances < 0 || request.Deductions < 0)
        {
            return BadRequest(new
            {
                message = "Allowances and deductions cannot be negative."
            });
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId);

        if (employee == null)
        {
            return NotFound(new
            {
                message = "Employee not found."
            });
        }

        if (!employee.IsActive)
        {
            return BadRequest(new
            {
                message = "Cannot generate payroll for an inactive employee."
            });
        }

        // Prevent duplicate payroll
        var existingPayroll = await _context.Payrolls
            .FirstOrDefaultAsync(p =>
                p.EmployeeId == request.EmployeeId &&
                p.Year == request.Year &&
                p.Month == request.Month);

        if (existingPayroll != null)
        {
            return BadRequest(new
            {
                message = "Payroll has already been generated for this employee and month.",
                payrollId = existingPayroll.Id
            });
        }

        var basicSalary = employee.Salary;

        var netSalary =
            basicSalary +
            request.Allowances -
            request.Deductions;

        if (netSalary < 0)
        {
            return BadRequest(new
            {
                message = "Net salary cannot be negative."
            });
        }

        var payroll = new Payroll
        {
            EmployeeId = employee.Id,
            Year = request.Year,
            Month = request.Month,
            BasicSalary = basicSalary,
            Allowances = request.Allowances,
            Deductions = request.Deductions,
            NetSalary = netSalary,
            Status = "Generated",
            GeneratedAt = DateTime.UtcNow
        };

        _context.Payrolls.Add(payroll);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Payroll generated successfully.",
            payrollId = payroll.Id,
            employeeId = employee.Id,
            employeeName = employee.FirstName + " " + employee.LastName,
            year = payroll.Year,
            month = payroll.Month,
            basicSalary = payroll.BasicSalary,
            allowances = payroll.Allowances,
            deductions = payroll.Deductions,
            netSalary = payroll.NetSalary,
            status = payroll.Status,
            generatedAt = payroll.GeneratedAt
        });
    }

    // UPDATE PAYROLL
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> UpdatePayroll(
        int id,
        [FromBody] UpdatePayrollRequest request)
    {
        if (request == null)
        {
            return BadRequest(new
            {
                message = "Payroll update data is required."
            });
        }

        var payroll = await _context.Payrolls
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payroll == null)
        {
            return NotFound(new
            {
                message = "Payroll record not found."
            });
        }

        if (request.Allowances < 0 || request.Deductions < 0)
        {
            return BadRequest(new
            {
                message = "Allowances and deductions cannot be negative."
            });
        }

        payroll.Allowances = request.Allowances;
        payroll.Deductions = request.Deductions;

        payroll.NetSalary =
            payroll.BasicSalary +
            payroll.Allowances -
            payroll.Deductions;

        if (payroll.NetSalary < 0)
        {
            return BadRequest(new
            {
                message = "Net salary cannot be negative."
            });
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            payroll.Status = request.Status.Trim();
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Payroll updated successfully.",
            payrollId = payroll.Id,
            basicSalary = payroll.BasicSalary,
            allowances = payroll.Allowances,
            deductions = payroll.Deductions,
            netSalary = payroll.NetSalary,
            status = payroll.Status
        });
    }

    // DELETE PAYROLL
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePayroll(int id)
    {
        var payroll = await _context.Payrolls
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payroll == null)
        {
            return NotFound(new
            {
                message = "Payroll record not found."
            });
        }

        _context.Payrolls.Remove(payroll);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Payroll deleted successfully."
        });
    }

    // GET PAYROLL BY EMPLOYEE
    [HttpGet("employee/{employeeId:int}")]
    public async Task<IActionResult> GetEmployeePayroll(int employeeId)
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

        var payrolls = await _context.Payrolls
            .Where(p => p.EmployeeId == employeeId)
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .Select(p => new
            {
                p.Id,
                p.Year,
                p.Month,
                p.BasicSalary,
                p.Allowances,
                p.Deductions,
                p.NetSalary,
                p.Status,
                p.GeneratedAt
            })
            .ToListAsync();

        return Ok(new
        {
            employeeId = employee.Id,
            employeeName = employee.FirstName + " " + employee.LastName,
            payrolls
        });
    }
}

// =============================================================
// REQUEST DTOs
// =============================================================

public class GeneratePayrollRequest
{
    public int EmployeeId { get; set; }

    public int Year { get; set; }

    public int Month { get; set; }

    public decimal Allowances { get; set; }

    public decimal Deductions { get; set; }
}

public class UpdatePayrollRequest
{
    public decimal Allowances { get; set; }

    public decimal Deductions { get; set; }

    public string? Status { get; set; }
}