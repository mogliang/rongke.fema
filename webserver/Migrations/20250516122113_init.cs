using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rongke.fema.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FMStructures",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    LongName = table.Column<string>(type: "TEXT", nullable: false),
                    ShortName = table.Column<string>(type: "TEXT", nullable: false),
                    Category = table.Column<string>(type: "TEXT", nullable: false),
                    Level = table.Column<int>(type: "INTEGER", nullable: false),
                    ParentFMStructureId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FMStructures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FMStructures_FMStructures_ParentFMStructureId",
                        column: x => x.ParentFMStructureId,
                        principalTable: "FMStructures",
                        principalColumn: "Id");
                });

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

            migrationBuilder.CreateTable(
                name: "FMFunctions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    LongName = table.Column<string>(type: "TEXT", nullable: false),
                    ShortName = table.Column<string>(type: "TEXT", nullable: false),
                    Level = table.Column<int>(type: "INTEGER", nullable: false),
                    FMStructureId = table.Column<int>(type: "INTEGER", nullable: true),
                    ParentFMFunctionId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FMFunctions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FMFunctions_FMFunctions_ParentFMFunctionId",
                        column: x => x.ParentFMFunctionId,
                        principalTable: "FMFunctions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FMFunctions_FMStructures_FMStructureId",
                        column: x => x.FMStructureId,
                        principalTable: "FMStructures",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "FMFaults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    LongName = table.Column<string>(type: "TEXT", nullable: false),
                    ShortName = table.Column<string>(type: "TEXT", nullable: false),
                    Level = table.Column<int>(type: "INTEGER", nullable: false),
                    RiskPriorityFactor = table.Column<int>(type: "INTEGER", nullable: false),
                    FMFunctionId = table.Column<int>(type: "INTEGER", nullable: true),
                    ParentFaultId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FMFaults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FMFaults_FMFaults_ParentFaultId",
                        column: x => x.ParentFaultId,
                        principalTable: "FMFaults",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FMFaults_FMFunctions_FMFunctionId",
                        column: x => x.FMFunctionId,
                        principalTable: "FMFunctions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_FMFaults_FMFunctionId",
                table: "FMFaults",
                column: "FMFunctionId");

            migrationBuilder.CreateIndex(
                name: "IX_FMFaults_ParentFaultId",
                table: "FMFaults",
                column: "ParentFaultId");

            migrationBuilder.CreateIndex(
                name: "IX_FMFunctions_FMStructureId",
                table: "FMFunctions",
                column: "FMStructureId");

            migrationBuilder.CreateIndex(
                name: "IX_FMFunctions_ParentFMFunctionId",
                table: "FMFunctions",
                column: "ParentFMFunctionId");

            migrationBuilder.CreateIndex(
                name: "IX_FMStructures_Code",
                table: "FMStructures",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FMStructures_ParentFMStructureId",
                table: "FMStructures",
                column: "ParentFMStructureId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FMFaults");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "FMFunctions");

            migrationBuilder.DropTable(
                name: "FMStructures");
        }
    }
}
