using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rongke.fema.Migrations
{
    /// <inheritdoc />
    public partial class addseq : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Seq",
                table: "FMStructures",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Seq",
                table: "FMFunctions",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Seq",
                table: "FMFaults",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Seq",
                table: "FMStructures");

            migrationBuilder.DropColumn(
                name: "Seq",
                table: "FMFunctions");

            migrationBuilder.DropColumn(
                name: "Seq",
                table: "FMFaults");
        }
    }
}
