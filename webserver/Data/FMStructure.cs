using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Rongke.Fema.Data
{
    [Index(nameof(Code), IsUnique = true)]
    public class FMStructure
    {
        public int Id { get; set; }

        public int Seq { get; set; }

        [Required]
        public string Code { get; set; }

        public string ImportCode { get; set; } = string.Empty;
        
        [Required]
        public string LongName { get; set; }

        public string ShortName { get; set; }

        public string Category { get; set; }

        public string ParentCode { get; set; }

        [Required]
        [Range(0, 3)]
        public int Level { get; set; }
    }

}