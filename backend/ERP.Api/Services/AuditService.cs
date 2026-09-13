using System.Security.Claims;
using System.Text.Json;
using ERP.Api.Data;
using ERP.Api.Models;

namespace ERP.Api.Services;

public sealed class AuditService
{
    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public void Record(
        string action,
        string entityType,
        object? entityId = null,
        object? details = null)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var actorId = httpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var actorName = httpContext?.User.Identity?.Name
            ?? httpContext?.User.FindFirstValue(ClaimTypes.Email)
            ?? "System";

        _context.AuditLogs.Add(new AuditLog
        {
            ActorUserId = int.TryParse(actorId, out var parsedActorId) ? parsedActorId : null,
            ActorUsername = actorName,
            Action = action,
            EntityType = entityType,
            EntityId = entityId?.ToString(),
            Details = JsonSerializer.Serialize(details ?? new { }),
            CreatedAt = DateTime.UtcNow
        });
    }
}
