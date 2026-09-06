namespace ERP.Api.DTOs;

public class EmployeeDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateOnly HireDate { get; set; }
    public decimal Salary { get; set; }
    public int DepartmentId { get; set; }
    public bool IsActive { get; set; }
    public string DepartmentName { get; set; } = "";
}