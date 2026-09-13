using ERP.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AuditController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuditController(AppDbContext context)
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
            .OrderByDescending(log => log.CreatedAt)
            .Take(limit)
            .Select(log => new
            {
                log.Id,
                actorUserId = log.ActorUserId,
                actorUsername = log.ActorUsername,
                log.Action,
                entityType = log.EntityType,
                entityId = log.EntityId,
                details = log.Details,
                createdAt = log.CreatedAt
            })
            .ToListAsync();

        return Ok(logs);
    }
}
