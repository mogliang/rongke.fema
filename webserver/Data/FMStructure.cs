using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Rongke.Fema.Data
{
    [Index(nameof(Code), IsUnique = true)]
    public class FMStructure
    {
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }

        [Required]
        public string Code { get; set; }

        public string ImportCode { get; set; } = string.Empty;
        
        [Required]
        public string LongName { get; set; }

        public string ShortName { get; set; }

        public string Category { get; set; }

        [Required]
        [Range(1, 3)]
        public int Level { get; set; }

        [ForeignKey(nameof(ParentFMStructureRef))]
        public int? ParentFMStructureId { get; set; }
        public virtual FMStructure ParentFMStructureRef { get; set; }

        public virtual List<FMStructure> ChildFMStructures { get; set; } = new List<FMStructure>();

        public virtual List<FMFunction> SEFunctions { get; set; } = new List<FMFunction>();
    }

}