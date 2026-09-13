using ERP.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AuditLogsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuditLogsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? entityType,
        [FromQuery] string? action,
        [FromQuery] int limit = 100)
    {
        limit = Math.Clamp(limit, 1, 500);
        var query = _context.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(entityType))
        {
            query = query.Where(log => log.EntityType == entityType.Trim());
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(log => log.Action == action.Trim());
        }

        var logs = await query
            .OrderByDescending(log => log.OccurredAtUtc)
            .Take(limit)
            .Select(log => new
            {
                log.Id,
                actorUserId = log.ActorUserId,
                actorUsername = log.ActorUsername,
                log.Action,
                log.EntityType,
                log.EntityId,
                log.Details,
                occurredAtUtc = log.OccurredAtUtc
            })
            .ToListAsync();

        return Ok(logs);
    }
}
