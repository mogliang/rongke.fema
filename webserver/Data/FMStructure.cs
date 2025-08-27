using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Rongke.Fmea.Data
{
    [Index(nameof(Code), IsUnique = true)]
    public class FMStructure
    {
        public int Id { get; set; }

        public string FMEACode { get; set; } = string.Empty;

        public int Seq { get; set; }

        [Required]
        public string Code { get; set; }
        
        [Required]
        public string LongName { get; set; }

        public string ShortName { get; set; }

        public string Category { get; set; }

        public string Decomposition { get; set; }

        public string Functions { get; set; }

        [Required]
        [Range(0, 3)]
        public int Level { get; set; }
    }

}