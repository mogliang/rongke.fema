namespace Rongke.Fema.Dto
{
    using System.ComponentModel.DataAnnotations;
    using AutoMapper;
    using Data;

    public class FMProfile2 : Profile
    {
        public FMProfile2()
        {
            CreateMap<FMStructure, FMStructureDto2>();

            CreateMap<FMFunction, FMFunctionDto2>();

            CreateMap<FMFault, FMFaultDto2>();
        }
    }

    public class FMStructureDto2
    {
        public string Code { get; set; }
        public string LongName { get; set; }
        public string ShortName { get; set; }
        public string Category { get; set; }
        
        public string ParentFMStructureCode { get; set; }

        public List<FMStructureDto2> ChildFMStructures { get; set; } = new List<FMStructureDto2>();
        public List<FMFunctionDto2> SEFunctions { get; set; } = new List<FMFunctionDto2>();
    }

    public class FMFunctionDto2
    {

        public string Code { get; set; }
        public string LongName { get; set; }
        public string ShortName { get; set; }

        public string FMStructureCode { get; set; }
        public string ParentFMFunctionCode { get; set; }

        public List<FMFunctionDto2> Prerequisites { get; set; } = new List<FMFunctionDto2>();

        public virtual List<FMFaultDto2> FaultRefs { get; set; } = new List<FMFaultDto2>();
    }

    public class FMFaultDto2
    {
        public string Code { get; set; }
        public string LongName { get; set; }
        public string ShortName { get; set; }
        public int RiskPriorityFactor { get; set; }

        public string FMFunctionCode { get; set; }
        public string ParentFaultCode { get; set; }
        public virtual List<FMFaultDto2> Causes { get; set; } = new List<FMFaultDto2>();

    }
}