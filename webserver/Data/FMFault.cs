using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Rongke.Fema.Data
{
    public class FMFault
    {
        public int Id { get; set; }

        [Required]
        public string Code { get; set; }

        [Required]
        public string LongName { get; set; }

        public string ShortName { get; set; }

        [Required]
        [Range(1, 3)]
        public int Level { get; set; }
        
        public int RiskPriorityFactor { get; set; }

        [ForeignKey(nameof(FMFunctionRef))]
        public int FMFunctionId { get; set; }
        public virtual FMFunction FMFunctionRef { get; set; }

        [ForeignKey(nameof(ParentFaultRef))]
        public int? ParentFaultId { get; set; }
        public virtual FMFault ParentFaultRef { get; set; }

        public virtual List<FMFault> Causes { get; set; } = new List<FMFault>();

    }

}