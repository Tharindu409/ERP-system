namespace ERP.Api.DTOs;

public class PayrollDto
{
    public int EmployeeId { get; set; }

    public DateOnly PeriodStart { get; set; }

    public DateOnly PeriodEnd { get; set; }

    public decimal BasicSalary { get; set; }

    public decimal Allowances { get; set; }

    public decimal Overtime { get; set; }

    public decimal Deductions { get; set; }
}