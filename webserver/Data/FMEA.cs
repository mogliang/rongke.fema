using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Rongke.Fema.Data
{
    public class FMEA
    {
        public int Id { get; set; }

        // Basic information
        [Required]
        public string Code { get; set; }
        [Required]
        public FMEAType Type { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public string Version { get; set; }
        [Required]
        public string FMEAVersion { get; set; }
        public string Description { get; set; }
        public string Stage { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Planning information
        public string CustomerName { get; set; }
        public string CompanyName { get; set; }
        public string ProductType { get; set; }
        public string Material { get; set; }
        public string Project { get; set; }
        public string ProjectLocation { get; set; }
        public DateTime? PlanKickOff { get; set; }
        public DateTime? PlanDeadline { get; set; }
        public string SecretLevel { get; set; }
        public string AccessLevel { get; set; }
        public string DesignDepartment { get; set; }
        public string DesignOwner { get; set; }
        public string RootStructureCode { get; set; }

        public string CoreMembersJson { get; set; }

        [NotMapped]
        public List<TeamMember> CoreMembers
        {
            get => string.IsNullOrEmpty(CoreMembersJson) ? new List<TeamMember>() : System.Text.Json.JsonSerializer.Deserialize<List<TeamMember>>(CoreMembersJson);
            set => CoreMembersJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        public string ExtendedMembersJson { get; set; }

        [NotMapped]
        public List<TeamMember> ExtendedMembers
        {
            get => string.IsNullOrEmpty(ExtendedMembersJson) ? new List<TeamMember>() : System.Text.Json.JsonSerializer.Deserialize<List<TeamMember>>(ExtendedMembersJson);
            set => ExtendedMembersJson = System.Text.Json.JsonSerializer.Serialize(value);
        }
    }

    public class TeamMember
    {
        [Required]
        public string Name { get; set; }
        [Required]
        public string EmployeeNo { get; set; }
        [Required]
        public string Role { get; set; }
        public string Department { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Note { get; set; }
    }

    public enum FMEAType
    {
        DFMEA,
        PFMEA,
    }

}