using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Rongke.Fema.Data
{
    public class FMFunction
    {
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }

        public int Seq { get; set; }

        [Required]
        public string Code { get; set; }

        public string ImportCode { get; set; } = string.Empty;

        [Required]
        public string LongName { get; set; }

        public string ShortName { get; set; }

        [Required]
        [Range(1, 3)]
        public int Level { get; set; }

        [ForeignKey(nameof(FMStructureRef))]
        public int? FMStructureId { get; set; }
        public virtual FMStructure FMStructureRef { get; set; }

        [ForeignKey(nameof(ParentFMFunctionRef))]
        public int? ParentFMFunctionId { get; set; }
        public virtual FMFunction ParentFMFunctionRef { get; set; }

        public virtual List<FMFunction> Prerequisites { get; set; } = new List<FMFunction>();

        public virtual List<FMFault> FaultRefs { get; set; } = new List<FMFault>();
    }

}