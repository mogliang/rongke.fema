using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rongke.Fema.Data;
using Rongke.Fema.Dto;

namespace Rongke.Fema.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FMEAController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public FMEAController(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        /// <summary>
        /// Get FMEA by code
        /// </summary>
        /// <param name="code">The unique code of the FMEA</param>
        /// <returns>The FMEA DTO if found, otherwise 404 Not Found</returns>
        [HttpGet("code/{code}")]
        public async Task<ActionResult<FMEADto2>> GetByCode(string code)
        {
            if (string.IsNullOrEmpty(code))
            {
                return BadRequest("Code cannot be null or empty");
            }

            var fmea = await _context.FMEAs
                .Where(f => f.Code == code)
                .FirstOrDefaultAsync();

            if (fmea == null)
            {
                return NotFound($"FMEA with code {code} not found");
            }

            var fmeaDto = _mapper.Map<FMEADto2>(fmea);

            // Get all structures with their relationships
            var structures = await _context.FMStructures
                .Include(s => s.ParentFMStructureRef)
                .ToListAsync();
            fmeaDto.FMStructures = _mapper.Map<List<FMStructureDto2>>(structures);
            fmeaDto.RootFMStructure = fmeaDto.FMStructures.FirstOrDefault(s => s.ParentFMStructureCode == null);

            // Get all functions with their relationships
            var functions = await _context.FMFunctions
                .Include(f => f.ParentFMFunctionRef)
                .Include(f => f.FMStructureRef)
                .ToListAsync();
            fmeaDto.FMFunctions = _mapper.Map<List<FMFunctionDto2>>(functions);

            // Get all faults with their relationships
            var faults = await _context.FMFaults
                .Include(f => f.ParentFaultRef)
                .Include(f => f.FMFunctionRef)
                .ToListAsync();
            fmeaDto.FMFaults = _mapper.Map<List<FMFaultDto2>>(faults);

            return Ok(fmeaDto);
        }

        /// <summary>
        /// Save FMEA by code
        /// </summary>
        /// <param name="code">The unique code of the FMEA</param>
        /// <param name="fmeaDto">The FMEA data to save</param>
        /// <returns>The updated FMEA DTO if successful, otherwise appropriate error response</returns>
        [HttpPut("code/{code}")]
        public async Task<ActionResult<FMEADto2>> SaveByCode(string code, FMEADto2 fmeaDto)
        {
            if (string.IsNullOrEmpty(code))
            {
                return BadRequest("Code cannot be null or empty");
            }

            if (fmeaDto == null)
            {
                return BadRequest("FMEA data cannot be null");
            }

            if (code != fmeaDto.Code)
            {
                return BadRequest("Code in URL must match code in FMEA data");
            }

            var fmea = await _context.FMEAs
                .Where(f => f.Code == code)
                .FirstOrDefaultAsync();

            if (fmea == null)
            {
                return NotFound($"FMEA with code {code} not found");
            }

            // Update basic information
            //fmea.Type = fmeaDto.Type;
            fmea.Name = fmeaDto.Name ?? fmea.Name;
            fmea.Version = fmeaDto.Version ?? fmea.Version;
            fmea.FMEAVersion = fmeaDto.FMEAVersion ?? fmea.FMEAVersion;
            fmea.Description = fmeaDto.Description ?? fmea.Description;
            fmea.Stage = fmeaDto.Stage ?? fmea.Stage;
            fmea.UpdatedAt = DateTime.UtcNow;

            // Update planning information
            fmea.CustomerName = fmeaDto.CustomerName ?? fmea.CustomerName;
            fmea.CompanyName = fmeaDto.CompanyName ?? fmea.CompanyName;
            fmea.ProductType = fmeaDto.ProductType ?? fmea.ProductType;
            fmea.Material = fmeaDto.Material ?? fmea.Material;
            fmea.Project = fmeaDto.Project ?? fmea.Project;
            fmea.ProjectLocation = fmeaDto.ProjectLocation ?? fmea.ProjectLocation;
            
            // Handle date times
            if (fmeaDto.PlanKickOff != null)
            {
                fmea.PlanKickOff = fmeaDto.PlanKickOff;
            }
            
            if (fmeaDto.PlanDeadline != null)
            {
                fmea.PlanDeadline = fmeaDto.PlanDeadline;
            }

            fmea.SecretLevel = fmeaDto.SecretLevel ?? fmea.SecretLevel;
            fmea.AccessLevel = fmeaDto.AccessLevel ?? fmea.AccessLevel;
            fmea.DesignDepartment = fmeaDto.DesignDepartment ?? fmea.DesignDepartment;
            fmea.DesignOwner = fmeaDto.DesignOwner ?? fmea.DesignOwner;

            // Check for duplicate members between CoreMembers and ExtendedMembers
            var duplicateMembers = fmeaDto.CoreMembers
                .Select(cm => cm.EmployeeNo)
                .Intersect(fmeaDto.ExtendedMembers.Select(em => em.EmployeeNo))
                .ToList();

            if (duplicateMembers.Any())
            {
                return BadRequest($"Duplicate members found with EmployeeNo: {string.Join(", ", duplicateMembers)}");
            }

            // Update team members
            if (fmeaDto.CoreMembers != null)
            {
                fmea.CoreMembers = _mapper.Map<List<TeamMember>>(fmeaDto.CoreMembers);
            }
            
            if (fmeaDto.ExtendedMembers != null)
            {
                fmea.ExtendedMembers = _mapper.Map<List<TeamMember>>(fmeaDto.ExtendedMembers);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!FMEAExists(code))
                {
                    return NotFound($"FMEA with code {code} not found");
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }

            // Return the updated FMEA DTO
            return await GetByCode(code);
        }

        private bool FMEAExists(string code)
        {
            return _context.FMEAs.Any(e => e.Code == code);
        }
    }
}