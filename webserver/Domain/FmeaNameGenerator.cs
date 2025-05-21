namespace Rongke.Fema.Domain
{
    using System.ComponentModel.DataAnnotations;
    using AutoMapper;
    using Data;

    public static class FmeaNameGenerator 
    {
        // Fmea code: F{id}, e.g. F1, F31, F377
        // Fmea structure code: {FemaCode}S{id}, e.g. F1S1, F31S12, F377S123
        // Fmea function code: {FemaCode}F{id}
        // Fmea Fault code: {FemaCode}T{id}
        // Fmea Action code: {FemaCode}A{id}
        public static string GenerateFmStructureCode()
        {
            throw new NotImplementedException();
        }
    }

}