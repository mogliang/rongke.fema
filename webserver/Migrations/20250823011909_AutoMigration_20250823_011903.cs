using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rongke.fmea.Migrations
{
    /// <inheritdoc />
    public partial class AutoMigration_20250823_011903 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FaultType",
                table: "FMFaults");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FaultType",
                table: "FMFaults",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }
    }
}
