using Microsoft.EntityFrameworkCore;

namespace Rongke.Fema.Data
{
    public class AppDbContext : DbContext
    {
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSeeding((ctx, _) =>
            {
                var fmea = new FMEA
                {
                    Code = "FMEA-0001",
                    Type = FMEAType.DFMEA,
                    Name = "Sample FMEA",
                    Version = "1.0",
                    FMEAVersion = "1.0",
                    Description = "This is a sample FMEA for demonstration purposes.",
                    Stage = "Design Phase",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CustomerName = "Sample Customer",
                    CompanyName = "Sample Company",
                    ProductType = "Sample Product",
                    Material = "Aluminum",
                    Project = "Sample Project",
                    ProjectLocation = "Sample Location",
                    PlanKickOff = DateTime.UtcNow.AddDays(7),
                    PlanDeadline = DateTime.UtcNow.AddMonths(1),
                    SecretLevel = "Confidential",
                    AccessLevel = "Restricted",
                    DesignDepartment = "Engineering",
                    DesignOwner = "John Doe",
                };
                fmea.CoreMembers = new List<TeamMember>
                {
                    new TeamMember { Name = "Alice", EmployeeNo = "E001", Role = "Lead Engineer" },
                    new TeamMember { Name = "Bob", EmployeeNo = "E002", Role = "Quality Manager" }
                };
                fmea.ExtendedMembers = new List<TeamMember>
                {
                    new TeamMember { Name = "Charlie", EmployeeNo = "E003", Role = "Supplier Representative" }
                };
                ctx.Set<FMEA>().Add(fmea);
                ctx.SaveChanges();
            });
            base.OnConfiguring(optionsBuilder);
        }


        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Product> Products => Set<Product>();

        public DbSet<FMStructure> FMStructures => Set<FMStructure>();

        public DbSet<FMFunction> FMFunctions => Set<FMFunction>();

        public DbSet<FMFault> FMFaults => Set<FMFault>();

        public DbSet<FMEA> FMEAs => Set<FMEA>();
    }

}
