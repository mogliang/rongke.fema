using Microsoft.EntityFrameworkCore;

namespace Rongke.Fema.Data
{
    public class AppDbContext : DbContext
    {
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            base.OnConfiguring(optionsBuilder);
        }


        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Product> Products => Set<Product>();

        public DbSet<FMStructure> FMStructures => Set<FMStructure>();

        public DbSet<FMFunction> FMFunctions => Set<FMFunction>();

        public DbSet<FMFault> FMFaults => Set<FMFault>();
    }

}
