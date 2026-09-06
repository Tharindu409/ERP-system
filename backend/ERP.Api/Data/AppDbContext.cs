using ERP.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ERP.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Department> Departments => Set<Department>();  
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<Payroll> Payrolls => Set<Payroll>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Role>()
            .HasMany(r => r.Users)
            .WithOne(u => u.Role)
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "Admin" },
            new Role { Id = 2, Name = "Manager" },
            new Role { Id = 3, Name = "Employee" },
            new Role { Id = 4, Name = "HR" }
        );

        modelBuilder.Entity<Department>()
    .HasMany(d => d.Employees)
    .WithOne(e => e.Department)
    .HasForeignKey(e => e.DepartmentId)
    .OnDelete(DeleteBehavior.Restrict);

       modelBuilder.Entity<User>()
    .HasOne(u => u.Employee)
    .WithOne(e => e.User)
    .HasForeignKey<Employee>(e => e.UserId)
    .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Attendance>()
            .HasOne(attendance => attendance.Employee)
            .WithMany()
            .HasForeignKey(attendance => attendance.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LeaveRequest>()
            .HasOne(leave => leave.Employee)
            .WithMany()
            .HasForeignKey(leave => leave.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Payroll>()
            .HasOne(payroll => payroll.Employee)
            .WithMany()
            .HasForeignKey(payroll => payroll.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Attendance>()
            .HasIndex(attendance => new { attendance.EmployeeId, attendance.Date })
            .IsUnique();

        modelBuilder.Entity<Payroll>()
        .HasIndex(payroll => new
        {
            payroll.EmployeeId,
            payroll.Year,
            payroll.Month
        })
        .IsUnique();


    }

    
}