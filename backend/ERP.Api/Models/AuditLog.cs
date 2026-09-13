namespace ERP.Api.Models;

public class AuditLog
{
    public long Id { get; set; }

    public int? ActorUserId { get; set; }

    public string ActorUsername { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty;

    public string EntityType { get; set; } = string.Empty;

    public string? EntityId { get; set; }

    public string Details { get; set; } = string.Empty;

    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
}
