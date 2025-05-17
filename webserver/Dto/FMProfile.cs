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
        public string Code { get; set; } = string.Empty;
        public string LongName { get; set; } = string.Empty;
        public string ShortName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int Level { get; set; }
        public List<FMStructureDto> ChildFMStructures { get; set; } = new List<FMStructureDto>();
    }
}