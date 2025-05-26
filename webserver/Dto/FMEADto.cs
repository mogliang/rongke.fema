using System.ComponentModel.DataAnnotations;
using Rongke.Fema.Data;

namespace Rongke.Fema.Dto
{
    public class FMEADto
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
