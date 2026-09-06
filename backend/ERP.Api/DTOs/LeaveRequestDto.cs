namespace ERP.Api.DTOs;

public class LeaveRequestDto
{
    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public string Reason { get; set; } = string.Empty;
}