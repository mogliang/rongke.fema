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
                .ForMember(d => d.Decomposition, opt => opt.MapFrom(s => CommaStringToList(s.Decomposition)))
                .ForMember(d => d.Functions, opt => opt.MapFrom(s => CommaStringToList(s.Functions)));

            CreateMap<FMStructureDto2, FMStructure>()
                .ForMember(d => d.Decomposition, opt => opt.MapFrom(s => ListToCommaString(s.Decomposition)))
                .ForMember(d => d.Functions, opt => opt.MapFrom(s => ListToCommaString(s.Functions)));

            CreateMap<FMFunction, FMFunctionDto2>()
                .ForMember(d => d.Prerequisites, opt => opt.MapFrom(s => CommaStringToList(s.Prerequisites)))
                .ForMember(d => d.FaultRefs, opt => opt.MapFrom(s => CommaStringToList(s.FaultRefs)));

            CreateMap<FMFunctionDto2, FMFunction>()
                .ForMember(d => d.Prerequisites, opt => opt.MapFrom(s => ListToCommaString(s.Prerequisites)))
                .ForMember(d => d.FaultRefs, opt => opt.MapFrom(s => ListToCommaString(s.FaultRefs)));

            CreateMap<FMFault, FMFaultDto2>()
                .ForMember(d => d.Causes, opt => opt.MapFrom(s => CommaStringToList(s.Causes)));

            CreateMap<FMFaultDto2, FMFault>()
                .ForMember(d => d.Causes, opt => opt.MapFrom(s => ListToCommaString(s.Causes)));

            CreateMap<TeamMember, TeamMemberDto>();
            CreateMap<TeamMemberDto, TeamMember>();
            CreateMap<FMEA, FMEADto2>();
            CreateMap<FMEADto2, FMEA>();
        }

        List<string> CommaStringToList(string? input)
        {
            return input?.Split(',').Select(s => s.Trim()).ToList() ?? new List<string>();
        }

        string ListToCommaString(List<string>? input)
        {
            return input != null ? string.Join(",", input) : string.Empty;
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
        public int Seq { get; set; }

        [Required]
        public int Level { get; set; }

        [Required]
        public List<string> Decomposition { get; set; } = new List<string>();

        [Required]
        public List<string> Functions { get; set; } = new List<string>();
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
        public int Seq { get; set; }
        [Required]
        public int Level { get; set; }
        public string? FMStructureCode { get; set; }
        public string? ParentFMFunctionCode { get; set; }

        [Required]
        public List<string> Prerequisites { get; set; } = new List<string>();

        [Required]
        public List<string> FaultRefs { get; set; } = new List<string>();
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
        public int Seq { get; set; }
        [Required]
        public int Level { get; set; }
        public string? FMFunctionCode { get; set; }
        public string? FMFaultCode { get; set; }
        public FaultType FaultType { get; set; }
        [Required]
        public virtual List<string> Causes { get; set; } = new List<string>();

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

        [Required]
        public string RootStructureCode { get; set; }

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