namespace Rongke.Fema.Domain
{
    using System.ComponentModel.DataAnnotations;
    using AutoMapper;
    using Data;

    // Fmea code: F{id}, e.g. F1, F31, F377
    // Fmea structure code: {FemaCode}S{id}, e.g. F1S1, F31S12, F377S123
    // Fmea function code: {FemaCode}F{id}
    // Fmea Fault code: {FemaCode}T{id}
    // Fmea Action code: {FemaCode}A{id}
    public class FmeaCodeGenerator
    {
        private string fmeaCode;
        private int fmeaStructureStartCode;
        private int fmeaFunctionStartCode;
        private int fmeaFaultStartCode;
        public FmeaCodeGenerator(AppDbContext dbContext)
        {
            fmeaCode = "F1";
            fmeaStructureStartCode = dbContext.FMStructures.Any() ? dbContext.FMStructures.Max(s => s.Id) : 0;
            fmeaFunctionStartCode = dbContext.FMFunctions.Any() ? dbContext.FMFunctions.Max(s => s.Id) : 0;
            fmeaFaultStartCode = dbContext.FMFaults.Any() ? dbContext.FMFaults.Max(s => s.Id) : 0;
        }


        public (int, string) GenerateFmStructureCode()
        {
            fmeaStructureStartCode++;
            return (fmeaStructureStartCode, $"{fmeaCode}S{fmeaStructureStartCode}");
        }

        public (int, string) GenerateFmFunctionCode()
        {
            fmeaFunctionStartCode++;
            return (fmeaFunctionStartCode, $"{fmeaCode}F{fmeaFunctionStartCode}");
        }

        public (int, string) GenerateFmFaultCode()
        {
            fmeaFaultStartCode++;
            return (fmeaFaultStartCode, $"{fmeaCode}T{fmeaFaultStartCode}");
        }
    }

}