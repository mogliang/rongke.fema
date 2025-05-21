using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rongke.fema.Migrations
{
    /// <inheritdoc />
    public partial class addimportcode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImportCode",
                table: "FMStructures",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ImportCode",
                table: "FMFunctions",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ImportCode",
                table: "FMFaults",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImportCode",
                table: "FMStructures");

            migrationBuilder.DropColumn(
                name: "ImportCode",
                table: "FMFunctions");

            migrationBuilder.DropColumn(
                name: "ImportCode",
                table: "FMFaults");
        }
    }
}
