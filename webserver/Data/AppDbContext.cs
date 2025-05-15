using Microsoft.EntityFrameworkCore;

namespace Rongke.Fema.Data
{
    public class AppDbContext : DbContext
    {
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            base.OnConfiguring(optionsBuilder);
            // optionsBuilder.UseSeeding((ctx,_) =>
            // {
            //     var fmFaults=new List<FMFault>();
            //     fmFaults.Add(new FMFault
            //     {
            //         Code = "F00001",
            //         LongName = "Fault 1",
            //         ShortName = "F1",
            //         Level = 1,
            //         RiskPriorityFactor = 5,
            //     });
                
            //     foreach (var fmFault in fmFaults)
            //     {
            //         if (ctx.Set<FMFault>().Any(f => f.Code == fmFault.Code))
            //         {
            //             continue;
            //         }
            //         ctx.Set<FMFault>().Add(fmFault);
            //         ctx.SaveChanges();
            //     }
            //});
        }


        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Product> Products => Set<Product>();

        public DbSet<FMStructure> FMStructures => Set<FMStructure>();

        public DbSet<FMFunction> FMFunctions => Set<FMFunction>();

        public DbSet<FMFault> FMFaults => Set<FMFault>();
    }

}
