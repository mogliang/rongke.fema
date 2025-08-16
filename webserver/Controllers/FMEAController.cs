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
            var structures = await _context.FMStructures
                .Include(s => s.ParentFMStructureRef)
                .ToListAsync();
            fmeaDto.FMStructures = _mapper.Map<List<FMStructureDto2>>(structures);
            fmeaDto.RootFMStructure = fmeaDto.FMStructures.FirstOrDefault(s => s.ParentFMStructureCode == null) ?? new FMStructureDto2();

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

            // 1. Find new structures and create them
            var newStructures = fmeaDto.FMStructures
                .Where(dto => !existingStructures.Any(e => e.Code == dto.Code))
                .ToList();

            foreach (var structureDto in newStructures)
            {
                var newId = FmeaCodeGenerator.ParseIdFromCode(structureDto.Code);
                var structure = new FMStructure
                {
                    Id = newId,
                    Code = structureDto.Code,
                    LongName = structureDto.LongName,
                    ShortName = structureDto.ShortName,
                    Category = structureDto.Category,
                    Seq = structureDto.Seq,
                    Level = CalculateStructureLevel(structureDto, fmeaDto.FMStructures)
                };
                _context.FMStructures.Add(structure);
            }

            await _context.SaveChangesAsync(); // Save to get IDs for references

            // 2. Loop through updated structures, check for circular references, and update fields and references
            foreach (var structureDto in fmeaDto.FMStructures)
            {
                var structure = await _context.FMStructures.FirstOrDefaultAsync(s => s.Code == structureDto.Code);
                if (structure != null)
                {
                    // Check for circular reference
                    if (HasCircularReference(structureDto.Code, structureDto.ParentFMStructureCode, fmeaDto.FMStructures))
                    {
                        throw new InvalidOperationException($"Circular reference detected for structure {structureDto.Code}");
                    }

                    // Update fields
                    structure.LongName = structureDto.LongName;
                    structure.ShortName = structureDto.ShortName;
                    structure.Category = structureDto.Category;
                    structure.Seq = structureDto.Seq;
                    structure.Level = CalculateStructureLevel(structureDto, fmeaDto.FMStructures);

                    // Update parent reference
                    if (!string.IsNullOrEmpty(structureDto.ParentFMStructureCode))
                    {
                        var parentStructure = await _context.FMStructures
                            .FirstAsync(s => s.Code == structureDto.ParentFMStructureCode);
                        structure.ParentFMStructureId = parentStructure.Id;
                    }
                    else
                    {
                        structure.ParentFMStructureId = null;
                    }
                }
            }

            // 3. Find new functions and create them
            var newFunctions = fmeaDto.FMFunctions
                .Where(dto => !existingFunctions.Any(e => e.Code == dto.Code))
                .ToList();

            foreach (var functionDto in newFunctions)
            {
                var newId = FmeaCodeGenerator.ParseIdFromCode(functionDto.Code);
                var function = new FMFunction
                {
                    Id = newId,
                    Code = functionDto.Code,
                    LongName = functionDto.LongName,
                    ShortName = functionDto.ShortName,
                    Seq = functionDto.Seq,
                    Level = CalculateFunctionLevel(functionDto, fmeaDto.FMFunctions)
                };
                _context.FMFunctions.Add(function);
            }

            await _context.SaveChangesAsync(); // Save to get IDs for references

            // 4. Loop through updated functions, check for circular references, and update fields and references  
            foreach (var functionDto in fmeaDto.FMFunctions)
            {
                var function = await _context.FMFunctions.FirstOrDefaultAsync(f => f.Code == functionDto.Code);
                if (function != null)
                {
                    // Check for circular reference
                    if (HasCircularReference(functionDto.Code, functionDto.ParentFMFunctionCode, fmeaDto.FMFunctions))
                    {
                        throw new InvalidOperationException($"Circular reference detected for function {functionDto.Code}");
                    }

                    // Update fields
                    function.LongName = functionDto.LongName;
                    function.ShortName = functionDto.ShortName;
                    function.Seq = functionDto.Seq;
                    function.Level = CalculateFunctionLevel(functionDto, fmeaDto.FMFunctions);

                    // Update structure reference
                    if (!string.IsNullOrEmpty(functionDto.FMStructureCode))
                    {
                        var structureRef = await _context.FMStructures
                            .FirstAsync(s => s.Code == functionDto.FMStructureCode);
                        function.FMStructureId = structureRef.Id;
                    }
                    else
                    {
                        function.FMStructureId = null;
                    }

                    // Update parent function reference
                    if (!string.IsNullOrEmpty(functionDto.ParentFMFunctionCode))
                    {
                        var parentFunction = await _context.FMFunctions
                            .FirstAsync(f => f.Code == functionDto.ParentFMFunctionCode);
                        function.ParentFMFunctionId = parentFunction.Id;
                    }
                    else
                    {
                        function.ParentFMFunctionId = null;
                    }
                }
            }

            // 5. Find new faults and create them
            var newFaults = fmeaDto.FMFaults
                .Where(dto => !existingFaults.Any(e => e.Code == dto.Code))
                .ToList();

            foreach (var faultDto in newFaults)
            {
                var newId = FmeaCodeGenerator.ParseIdFromCode(faultDto.Code);
                var fault = new FMFault
                {
                    Id = newId,
                    Code = faultDto.Code,
                    LongName = faultDto.LongName,
                    ShortName = faultDto.ShortName,
                    Seq = faultDto.Seq,
                    RiskPriorityFactor = faultDto.RiskPriorityFactor,
                    Level = CalculateFaultLevel(faultDto, fmeaDto.FMFaults)
                };
                _context.FMFaults.Add(fault);
            }

            await _context.SaveChangesAsync(); // Save to get IDs for references

            // 6. Loop through updated faults, check for circular references, and update fields and references
            foreach (var faultDto in fmeaDto.FMFaults)
            {
                var fault = await _context.FMFaults.FirstOrDefaultAsync(f => f.Code == faultDto.Code);
                if (fault != null)
                {
                    // Check for circular reference
                    if (HasCircularReference(faultDto.Code, faultDto.ParentFaultCode, fmeaDto.FMFaults))
                    {
                        throw new InvalidOperationException($"Circular reference detected for fault {faultDto.Code}");
                    }

                    // Update fields
                    fault.LongName = faultDto.LongName;
                    fault.ShortName = faultDto.ShortName;
                    fault.Seq = faultDto.Seq;
                    fault.RiskPriorityFactor = faultDto.RiskPriorityFactor;
                    fault.Level = CalculateFaultLevel(faultDto, fmeaDto.FMFaults);

                    // Update function reference
                    if (!string.IsNullOrEmpty(faultDto.FMFunctionCode))
                    {
                        var functionRef = await _context.FMFunctions
                            .FirstAsync(f => f.Code == faultDto.FMFunctionCode);
                        fault.FMFunctionId = functionRef.Id;
                    }
                    else
                    {
                        fault.FMFunctionId = null;
                    }

                    // Update parent fault reference
                    if (!string.IsNullOrEmpty(faultDto.ParentFaultCode))
                    {
                        var parentFault = await _context.FMFaults
                            .FirstAsync(f => f.Code == faultDto.ParentFaultCode);
                        fault.ParentFaultId = parentFault.Id;
                    }
                    else
                    {
                        fault.ParentFaultId = null;
                    }
                }
            }

            // 7. Remove deleted items (fault first, then function, then structure)
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

        private bool HasCircularReference<T>(string code, string? parentCode, List<T> items) where T : class
        {
            if (string.IsNullOrEmpty(parentCode) || code == parentCode)
                return code == parentCode; // Direct self-reference

            var visited = new HashSet<string>();
            var current = parentCode;

            while (!string.IsNullOrEmpty(current) && !visited.Contains(current))
            {
                if (current == code)
                    return true; // Circular reference found

                visited.Add(current);

                // Get parent code based on type
                string? nextParent = null;
                if (typeof(T) == typeof(FMStructureDto2))
                {
                    var item = items.Cast<FMStructureDto2>().FirstOrDefault(i => i.Code == current);
                    nextParent = item?.ParentFMStructureCode;
                }
                else if (typeof(T) == typeof(FMFunctionDto2))
                {
                    var item = items.Cast<FMFunctionDto2>().FirstOrDefault(i => i.Code == current);
                    nextParent = item?.ParentFMFunctionCode;
                }
                else if (typeof(T) == typeof(FMFaultDto2))
                {
                    var item = items.Cast<FMFaultDto2>().FirstOrDefault(i => i.Code == current);
                    nextParent = item?.ParentFaultCode;
                }

                current = nextParent;
            }

            return false;
        }

        private int CalculateStructureLevel(FMStructureDto2 structure, List<FMStructureDto2> allStructures)
        {
            var level = 0;
            var current = structure.ParentFMStructureCode;

            while (!string.IsNullOrEmpty(current))
            {
                level++;
                var parent = allStructures.FirstOrDefault(s => s.Code == current);
                current = parent?.ParentFMStructureCode;
            }

            return Math.Min(level, 3); // Cap at level 3
        }

        private int CalculateFunctionLevel(FMFunctionDto2 function, List<FMFunctionDto2> allFunctions)
        {
            var level = 1;
            var current = function.ParentFMFunctionCode;

            while (!string.IsNullOrEmpty(current))
            {
                level++;
                var parent = allFunctions.FirstOrDefault(f => f.Code == current);
                current = parent?.ParentFMFunctionCode;
            }

            return Math.Min(level, 3); // Cap at level 3
        }

        private int CalculateFaultLevel(FMFaultDto2 fault, List<FMFaultDto2> allFaults)
        {
            var level = 1;
            var current = fault.ParentFaultCode;

            while (!string.IsNullOrEmpty(current))
            {
                level++;
                var parent = allFaults.FirstOrDefault(f => f.Code == current);
                current = parent?.ParentFaultCode;
            }

            return Math.Min(level, 3); // Cap at level 3
        }
    }
}