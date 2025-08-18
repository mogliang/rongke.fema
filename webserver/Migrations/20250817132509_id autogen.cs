using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace rongke.fema.Migrations
{
    /// <inheritdoc />
    public partial class idautogen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FMFaults_FMFaults_ParentFaultId",
                table: "FMFaults");

            migrationBuilder.DropForeignKey(
                name: "FK_FMFaults_FMFunctions_FMFunctionId",
                table: "FMFaults");

            migrationBuilder.DropForeignKey(
                name: "FK_FMFunctions_FMFunctions_ParentFMFunctionId",
                table: "FMFunctions");

            migrationBuilder.DropForeignKey(
                name: "FK_FMFunctions_FMStructures_FMStructureId",
                table: "FMFunctions");

            migrationBuilder.DropForeignKey(
                name: "FK_FMStructures_FMStructures_ParentFMStructureId",
                table: "FMStructures");

            migrationBuilder.DropIndex(
                name: "IX_FMStructures_ParentFMStructureId",
                table: "FMStructures");

            migrationBuilder.DropIndex(
                name: "IX_FMFunctions_FMStructureId",
                table: "FMFunctions");

            migrationBuilder.DropIndex(
                name: "IX_FMFunctions_ParentFMFunctionId",
                table: "FMFunctions");

            migrationBuilder.DropIndex(
                name: "IX_FMFaults_FMFunctionId",
                table: "FMFaults");

            migrationBuilder.DropIndex(
                name: "IX_FMFaults_ParentFaultId",
                table: "FMFaults");

            migrationBuilder.DropColumn(
                name: "ParentFMStructureId",
                table: "FMStructures");

            migrationBuilder.DropColumn(
                name: "FMStructureId",
                table: "FMFunctions");

            migrationBuilder.DropColumn(
                name: "ParentFMFunctionId",
                table: "FMFunctions");

            migrationBuilder.DropColumn(
                name: "FMFunctionId",
                table: "FMFaults");

            migrationBuilder.DropColumn(
                name: "ParentFaultId",
                table: "FMFaults");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "FMStructures",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .Annotation("Sqlite:Autoincrement", true);

            migrationBuilder.AddColumn<string>(
                name: "ParentCode",
                table: "FMStructures",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "FMFunctions",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .Annotation("Sqlite:Autoincrement", true);

            migrationBuilder.AddColumn<string>(
                name: "ParentCode",
                table: "FMFunctions",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "StructureCode",
                table: "FMFunctions",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "FMFaults",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .Annotation("Sqlite:Autoincrement", true);

            migrationBuilder.AddColumn<string>(
                name: "FMTypeFaultCode",
                table: "FMFaults",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "FaultType",
                table: "FMFaults",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "FunctionCode",
                table: "FMFaults",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ParentCode",
                table: "FMStructures");

            migrationBuilder.DropColumn(
                name: "ParentCode",
                table: "FMFunctions");

            migrationBuilder.DropColumn(
                name: "StructureCode",
                table: "FMFunctions");

            migrationBuilder.DropColumn(
                name: "FMTypeFaultCode",
                table: "FMFaults");

            migrationBuilder.DropColumn(
                name: "FaultType",
                table: "FMFaults");

            migrationBuilder.DropColumn(
                name: "FunctionCode",
                table: "FMFaults");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "FMStructures",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .OldAnnotation("Sqlite:Autoincrement", true);

            migrationBuilder.AddColumn<int>(
                name: "ParentFMStructureId",
                table: "FMStructures",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "FMFunctions",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .OldAnnotation("Sqlite:Autoincrement", true);

            migrationBuilder.AddColumn<int>(
                name: "FMStructureId",
                table: "FMFunctions",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ParentFMFunctionId",
                table: "FMFunctions",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "FMFaults",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .OldAnnotation("Sqlite:Autoincrement", true);

            migrationBuilder.AddColumn<int>(
                name: "FMFunctionId",
                table: "FMFaults",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ParentFaultId",
                table: "FMFaults",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_FMStructures_ParentFMStructureId",
                table: "FMStructures",
                column: "ParentFMStructureId");

            migrationBuilder.CreateIndex(
                name: "IX_FMFunctions_FMStructureId",
                table: "FMFunctions",
                column: "FMStructureId");

            migrationBuilder.CreateIndex(
                name: "IX_FMFunctions_ParentFMFunctionId",
                table: "FMFunctions",
                column: "ParentFMFunctionId");

            migrationBuilder.CreateIndex(
                name: "IX_FMFaults_FMFunctionId",
                table: "FMFaults",
                column: "FMFunctionId");

            migrationBuilder.CreateIndex(
                name: "IX_FMFaults_ParentFaultId",
                table: "FMFaults",
                column: "ParentFaultId");

            migrationBuilder.AddForeignKey(
                name: "FK_FMFaults_FMFaults_ParentFaultId",
                table: "FMFaults",
                column: "ParentFaultId",
                principalTable: "FMFaults",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_FMFaults_FMFunctions_FMFunctionId",
                table: "FMFaults",
                column: "FMFunctionId",
                principalTable: "FMFunctions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_FMFunctions_FMFunctions_ParentFMFunctionId",
                table: "FMFunctions",
                column: "ParentFMFunctionId",
                principalTable: "FMFunctions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_FMFunctions_FMStructures_FMStructureId",
                table: "FMFunctions",
                column: "FMStructureId",
                principalTable: "FMStructures",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_FMStructures_FMStructures_ParentFMStructureId",
                table: "FMStructures",
                column: "ParentFMStructureId",
                principalTable: "FMStructures",
                principalColumn: "Id");
        }
    }
}
