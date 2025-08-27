using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Rongke.Fmea.Data
{
    public class FMFunction
    {
        public int Id { get; set; }

        public string FMEACode { get; set; } = string.Empty;

        public int Seq { get; set; }

        [Required]
        public string Code { get; set; }

        [Required]
        public string LongName { get; set; }

        public string ShortName { get; set; }

        public string Prerequisites { get; set; }

        public string FaultRefs { get; set; }

        [Required]
        [Range(1, 3)]
        public int Level { get; set; }
    }

}