using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rongke.Fema.Data;
using Rongke.Fema.Dto;
using Rongke.Fema.Domain;

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
            var structures = await _context.FMStructures.ToListAsync();
            fmeaDto.FMStructures = _mapper.Map<List<FMStructureDto2>>(structures);
            fmeaDto.RootFMStructure = fmeaDto.FMStructures.FirstOrDefault(s => s.ParentFMStructureCode == null) ?? new FMStructureDto2();

            // Get all functions with their relationships
            var functions = await _context.FMFunctions.ToListAsync();
            fmeaDto.FMFunctions = _mapper.Map<List<FMFunctionDto2>>(functions);

            // Get all faults with their relationships
            var faults = await _context.FMFaults.ToListAsync();
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

            // Update structures, functions, and faults following the specified rules
            try
            {
                await UpdateStructuresFunctionsFaults(fmeaDto);
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict($"FMEA with code {code} was updated by another user");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }

            // Return the updated FMEA DTO
            return await GetByCode(code);
        }

        // rules:
        // find new structure, create
        // loop updated structure, check no circular ref, update field and ref
        // find new func, create
        // loop updated func, check no circular ref, update field and ref
        // find new fault, create
        // loop updated fault, check no circular ref, update field and ref
        // remove deleted fault, then func, then structure
        private async Task UpdateStructuresFunctionsFaults(FMEADto2 fmeaDto)
        {
            // Get existing data
            var existingStructures = await _context.FMStructures.ToListAsync();
            var existingFunctions = await _context.FMFunctions.ToListAsync();
            var existingFaults = await _context.FMFaults.ToListAsync();

            // add & update structure
            var newStructures = fmeaDto.FMStructures
                .Where(dto => !existingStructures.Any(e => e.Code == dto.Code))
                .ToList();

            foreach (var structureDto in newStructures)
            {
                var structure = _mapper.Map<FMStructure>(structureDto);
                _context.FMStructures.Add(structure);
            }

            foreach (var structureDto in fmeaDto.FMStructures)
            {
                var structure = await _context.FMStructures.FirstAsync(s => s.Code == structureDto.Code);
                _mapper.Map(structureDto, structure);
            }

            // add & update function
            var newFunctions = fmeaDto.FMFunctions
                .Where(dto => !existingFunctions.Any(e => e.Code == dto.Code))
                .ToList();

            foreach (var functionDto in newFunctions)
            {
                var function = _mapper.Map<FMFunction>(functionDto);
                _context.FMFunctions.Add(function);
            }

            foreach (var functionDto in fmeaDto.FMFunctions)
            {
                var function = await _context.FMFunctions.FirstAsync(f => f.Code == functionDto.Code);
                _mapper.Map(functionDto, function);
            }

            // add & update fault
            var newFaults = fmeaDto.FMFaults
                .Where(dto => !existingFaults.Any(e => e.Code == dto.Code))
                .ToList();

            foreach (var faultDto in newFaults)
            {
                var fault = _mapper.Map<FMFault>(faultDto);
                _context.FMFaults.Add(fault);
            }

            foreach (var faultDto in fmeaDto.FMFaults)
            {
                var fault = await _context.FMFaults.FirstAsync(f => f.Code == faultDto.Code);
                _mapper.Map(faultDto, fault);
            }

            // remove deleted items
            var dtoCodes = new
            {
                StructureCodes = fmeaDto.FMStructures.Select(s => s.Code).ToHashSet(),
                FunctionCodes = fmeaDto.FMFunctions.Select(f => f.Code).ToHashSet(),
                FaultCodes = fmeaDto.FMFaults.Select(f => f.Code).ToHashSet()
            };

            // Remove deleted faults
            var faultsToRemove = existingFaults.Where(f => !dtoCodes.FaultCodes.Contains(f.Code)).ToList();
            _context.FMFaults.RemoveRange(faultsToRemove);

            // Remove deleted functions
            var functionsToRemove = existingFunctions.Where(f => !dtoCodes.FunctionCodes.Contains(f.Code)).ToList();
            _context.FMFunctions.RemoveRange(functionsToRemove);

            // Remove deleted structures
            var structuresToRemove = existingStructures.Where(s => !dtoCodes.StructureCodes.Contains(s.Code)).ToList();
            _context.FMStructures.RemoveRange(structuresToRemove);

            await _context.SaveChangesAsync(); 
        }

        // private bool HasCircularReference<T>(string code, string? parentCode, List<T> items) where T : class
        // {
        //     if (string.IsNullOrEmpty(parentCode) || code == parentCode)
        //         return code == parentCode; // Direct self-reference

        //     var visited = new HashSet<string>();
        //     var current = parentCode;

        //     while (!string.IsNullOrEmpty(current) && !visited.Contains(current))
        //     {
        //         if (current == code)
        //             return true; // Circular reference found

        //         visited.Add(current);

        //         // Get parent code based on type
        //         string? nextParent = null;
        //         if (typeof(T) == typeof(FMStructureDto2))
        //         {
        //             var item = items.Cast<FMStructureDto2>().FirstOrDefault(i => i.Code == current);
        //             nextParent = item?.ParentFMStructureCode;
        //         }
        //         else if (typeof(T) == typeof(FMFunctionDto2))
        //         {
        //             var item = items.Cast<FMFunctionDto2>().FirstOrDefault(i => i.Code == current);
        //             nextParent = item?.ParentFMFunctionCode;
        //         }
        //         else if (typeof(T) == typeof(FMFaultDto2))
        //         {
        //             var item = items.Cast<FMFaultDto2>().FirstOrDefault(i => i.Code == current);
        //             nextParent = item?.ParentFaultCode;
        //         }

        //         current = nextParent;
        //     }

        //     return false;
        // }

        // private int CalculateStructureLevel(FMStructureDto2 structure, List<FMStructureDto2> allStructures)
        // {
        //     var level = 0;
        //     var current = structure.ParentFMStructureCode;

        //     while (!string.IsNullOrEmpty(current))
        //     {
        //         level++;
        //         var parent = allStructures.FirstOrDefault(s => s.Code == current);
        //         current = parent?.ParentFMStructureCode;
        //     }

        //     return Math.Min(level, 3); // Cap at level 3
        // }

        // private int CalculateFunctionLevel(FMFunctionDto2 function, List<FMFunctionDto2> allFunctions)
        // {
        //     var level = 1;
        //     var current = function.ParentFMFunctionCode;

        //     while (!string.IsNullOrEmpty(current))
        //     {
        //         level++;
        //         var parent = allFunctions.FirstOrDefault(f => f.Code == current);
        //         current = parent?.ParentFMFunctionCode;
        //     }

        //     return Math.Min(level, 3); // Cap at level 3
        // }

        // private int CalculateFaultLevel(FMFaultDto2 fault, List<FMFaultDto2> allFaults)
        // {
        //     var level = 1;
        //     var current = fault.ParentFaultCode;

        //     while (!string.IsNullOrEmpty(current))
        //     {
        //         level++;
        //         var parent = allFaults.FirstOrDefault(f => f.Code == current);
        //         current = parent?.ParentFaultCode;
        //     }

        //     return Math.Min(level, 3); // Cap at level 3
        // }
    }
}