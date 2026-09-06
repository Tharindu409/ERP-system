namespace ERP.Api.Models;

public class Employee
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public string? Address { get; set; }

    public DateOnly HireDate { get; set; }

    public decimal Salary { get; set; }

    public int DepartmentId { get; set; }

    public bool IsActive { get; set; } = true;

    // Relationships

    public User? User { get; set; }

    public Department? Department { get; set; }
}