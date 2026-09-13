using System.Security.Claims;
using ERP.Api.Data;
using ERP.Api.Models;

namespace ERP.Api.Services;

public sealed class AuditLogService
{
    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditLogService(
        AppDbContext context,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(
        string action,
        string entityType,
        object? entityId,
        string details)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var actorId = user?.FindFirstValue(ClaimTypes.NameIdentifier);
        var actorUsername = user?.FindFirstValue(ClaimTypes.Name)
            ?? user?.Identity?.Name
            ?? "System";

        _context.AuditLogs.Add(new AuditLog
        {
            ActorUserId = int.TryParse(actorId, out var parsedActorId)
                ? parsedActorId
                : null,
            ActorUsername = actorUsername,
            Action = action,
            EntityType = entityType,
            EntityId = entityId?.ToString(),
            Details = details,
            OccurredAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
    }
}
