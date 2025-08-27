using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rongke.fmea.Migrations
{
    /// <inheritdoc />
    public partial class AutoMigration_20250827_124224 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.RenameColumn(
                name: "ImportCode",
                table: "FMStructures",
                newName: "FMEACode");

            migrationBuilder.RenameColumn(
                name: "ImportCode",
                table: "FMFunctions",
                newName: "FMEACode");

            migrationBuilder.RenameColumn(
                name: "ImportCode",
                table: "FMFaults",
                newName: "FMEACode");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FMEACode",
                table: "FMStructures",
                newName: "ImportCode");

            migrationBuilder.RenameColumn(
                name: "FMEACode",
                table: "FMFunctions",
                newName: "ImportCode");

            migrationBuilder.RenameColumn(
                name: "FMEACode",
                table: "FMFaults",
                newName: "ImportCode");

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                });
        }
    }
}
