namespace Rongke.Fema.Dto
{
    using System.ComponentModel.DataAnnotations;
    using AutoMapper;
    using Data;
    using Rongke.Fema.Domain;

    public class FMProfile2 : Profile
    {
        public FMProfile2()
        {
            CreateMap<FMStructure, FMStructureDto2>()
                .ForMember(d => d.ParentFMStructureCode, opt => opt.MapFrom(s => s.ParentFMStructureRef.Code))
                .ForMember(d => d.ChildFMStructures, opt => opt.Ignore())
                .ForMember(d => d.SEFunctions, opt => opt.Ignore());

            CreateMap<FMFunction, FMFunctionDto2>()
                .ForMember(d => d.FMStructureCode, opt => opt.MapFrom(s => s.FMStructureRef.Code))
                .ForMember(d => d.ParentFMFunctionCode, opt => opt.MapFrom(s => s.ParentFMFunctionRef.Code))
                .ForMember(d => d.Prerequisites, opt => opt.Ignore())
                .ForMember(d => d.FaultRefs, opt => opt.Ignore());

            CreateMap<FMFault, FMFaultDto2>()
                .ForMember(d => d.FMFunctionCode, opt => opt.MapFrom(s => s.FMFunctionRef.Code))
                .ForMember(d => d.ParentFaultCode, opt => opt.MapFrom(s => s.ParentFaultRef.Code))
                .ForMember(d => d.Causes, opt => opt.Ignore());

            CreateMap<FMEA, FMEADto2>();
        }
    }

    public class FMStructureDto2
    {
        [Required]
        public string Code { get; set; }
        [Required]
        public string LongName { get; set; }
        [Required]
        public string ShortName { get; set; }
        [Required]
        public string Category { get; set; }

        [Required]
        public string ParentFMStructureCode { get; set; }

        [Required]
        public List<FMStructureDto2> ChildFMStructures { get; set; } = new List<FMStructureDto2>();
        [Required]
        public List<FMFunctionDto2> SEFunctions { get; set; } = new List<FMFunctionDto2>();
    }

    public class FMFunctionDto2
    {

        [Required]
        public string Code { get; set; }
        [Required]
        public string LongName { get; set; }
        [Required]
        public string ShortName { get; set; }

        [Required]
        public string FMStructureCode { get; set; }
        [Required]
        public string ParentFMFunctionCode { get; set; }

        [Required]
        public List<FMFunctionDto2> Prerequisites { get; set; } = new List<FMFunctionDto2>();

        [Required]
        public virtual List<FMFaultDto2> FaultRefs { get; set; } = new List<FMFaultDto2>();
    }

    public class FMFaultDto2
    {
        [Required]
        public string Code { get; set; }
        [Required]
        public string LongName { get; set; }
        [Required]
        public string ShortName { get; set; }
        [Required]
        public int RiskPriorityFactor { get; set; }

        [Required]
        public string FMFunctionCode { get; set; }
        [Required]
        public string ParentFaultCode { get; set; }
        [Required]
        public virtual List<FMFaultDto2> Causes { get; set; } = new List<FMFaultDto2>();

    }

    public class FMEADto2
    {
        // Basic information
        public string Code { get; set; } = string.Empty;
        public FMEAType Type { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string FMEAVersion { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Stage { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Planning information
        public string? CustomerName { get; set; }
        public string? CompanyName { get; set; }
        public string? ProductType { get; set; }
        public string? Material { get; set; }
        public string? Project { get; set; }
        public string? ProjectLocation { get; set; }
        public DateTime? PlanKickOff { get; set; }
        public DateTime? PlanDeadline { get; set; }
        public string? SecretLevel { get; set; }
        public string? AccessLevel { get; set; }
        public string? DesignDepartment { get; set; }
        public string? DesignOwner { get; set; }

        // Members as nested objects instead of JSON fields
        public List<TeamMemberDto> CoreMembers { get; set; } = new List<TeamMemberDto>();
        public List<TeamMemberDto> ExtendedMembers { get; set; } = new List<TeamMemberDto>();

        public FMStructureDto2 RootFMStructure { get; set; }

        [Required]
        public List<FMStructureDto2> FMStructures { get; set; } = new List<FMStructureDto2>();
        [Required]
        public List<FMFunctionDto2> FMFunctions { get; set; } = new List<FMFunctionDto2>();
        [Required]
        public List<FMFaultDto2> FMFaults { get; set; } = new List<FMFaultDto2>();
    }

    public class TeamMemberDto
    {
        public string Name { get; set; } = string.Empty;
        public string EmployeeNo { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Department { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Note { get; set; }
    }
}