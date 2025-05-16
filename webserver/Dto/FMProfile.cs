namespace Rongke.Fema.Dto
{
    using AutoMapper;
    using Data;

    public class FMProfile : Profile
    {
        public FMProfile()
        {
            CreateMap<FMStructure, FMStructureDto>();
        }
    }

    public class FMStructureDto
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string ShortName { get; set; } = string.Empty;
        public int Level { get; set; }
        public int RiskPriorityFactor { get; set; }
        public List<FMStructureDto> SubStructures { get; set; } = new List<FMStructureDto>();
    }
}