namespace Rongke.Fmea.Domain
{
    using System.ComponentModel.DataAnnotations;
    using System.Text.RegularExpressions;
    using AutoMapper;
    using Data;

    // Fmea code: F{id}, e.g. F1, F31, F377
    // Fmea structure code: {FmeaCode}S{id}, e.g. F1S1, F31S12, F377S123
    // Fmea function code: {FmeaCode}F{id}
    // Fmea Fault code: {FmeaCode}T{id}
    // Fmea Action code: {FmeaCode}A{id}
    public class FmeaCodeGenerator
    {
        private int fmeaCode;
        private int fmeaStructureStartCode;
        private int fmeaFunctionStartCode;
        private int fmeaFaultStartCode;
        public FmeaCodeGenerator(AppDbContext dbContext)
        {
            fmeaCode = 1;
            fmeaStructureStartCode = dbContext.FMStructures.Any() ? dbContext.FMStructures.Max(s => s.Id) : 0;
            fmeaFunctionStartCode = dbContext.FMFunctions.Any() ? dbContext.FMFunctions.Max(s => s.Id) : 0;
            fmeaFaultStartCode = dbContext.FMFaults.Any() ? dbContext.FMFaults.Max(s => s.Id) : 0;
        }

        public static int ParseIdFromCode(string code)
        {
            var regexPattern = @"^[FTS](\d+)-(\d+)$";
            if (!Regex.IsMatch(code, regexPattern))
            {
                throw new ArgumentException("Invalid FMEA code format", nameof(code));
            }

            var strId = Regex.Match(code, regexPattern).Groups[2].Value;
            return int.Parse(strId);
        }

        public (int, string) GenerateFmStructureCode()
        {
            fmeaStructureStartCode++;
            return (fmeaStructureStartCode, $"S{fmeaCode:000}-{fmeaStructureStartCode:000}");
        }

        public (int, string) GenerateFmFunctionCode()
        {
            fmeaFunctionStartCode++;
            return (fmeaFunctionStartCode, $"F{fmeaCode:000}-{fmeaFunctionStartCode:000}");
        }

        public (int, string) GenerateFmFaultCode()
        {
            fmeaFaultStartCode++;
            return (fmeaFaultStartCode, $"T{fmeaCode:000}-{fmeaFaultStartCode:000}");
        }
    }

}