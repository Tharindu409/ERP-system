namespace ERP.Api.Models;

public class Payroll
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public int Year { get; set; }

    public int Month { get; set; }

    public decimal BasicSalary { get; set; }

    public decimal Allowances { get; set; }

    public decimal Deductions { get; set; }

    public decimal NetSalary { get; set; }

    public string Status { get; set; } = "Generated";

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public Employee? Employee { get; set; }
}