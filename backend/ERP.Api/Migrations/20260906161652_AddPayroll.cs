using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERP.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPayroll : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payrolls_EmployeeId",
                table: "Payrolls");

            migrationBuilder.DropColumn(
                name: "Overtime",
                table: "Payrolls");

            migrationBuilder.DropColumn(
                name: "PaidAt",
                table: "Payrolls");

            migrationBuilder.DropColumn(
                name: "PeriodEnd",
                table: "Payrolls");

            migrationBuilder.DropColumn(
                name: "PeriodStart",
                table: "Payrolls");

            migrationBuilder.RenameColumn(
                name: "PaymentStatus",
                table: "Payrolls",
                newName: "Status");

            migrationBuilder.AddColumn<DateTime>(
                name: "GeneratedAt",
                table: "Payrolls",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "Month",
                table: "Payrolls",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Year",
                table: "Payrolls",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Payrolls_EmployeeId_Year_Month",
                table: "Payrolls",
                columns: new[] { "EmployeeId", "Year", "Month" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payrolls_EmployeeId_Year_Month",
                table: "Payrolls");

            migrationBuilder.DropColumn(
                name: "GeneratedAt",
                table: "Payrolls");

            migrationBuilder.DropColumn(
                name: "Month",
                table: "Payrolls");

            migrationBuilder.DropColumn(
                name: "Year",
                table: "Payrolls");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Payrolls",
                newName: "PaymentStatus");

            migrationBuilder.AddColumn<decimal>(
                name: "Overtime",
                table: "Payrolls",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaidAt",
                table: "Payrolls",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "PeriodEnd",
                table: "Payrolls",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<DateOnly>(
                name: "PeriodStart",
                table: "Payrolls",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.CreateIndex(
                name: "IX_Payrolls_EmployeeId",
                table: "Payrolls",
                column: "EmployeeId");
        }
    }
}
