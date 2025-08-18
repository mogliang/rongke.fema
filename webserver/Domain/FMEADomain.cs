
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
public class FMEADomain
{

    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public FMEADomain(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public List<string> Verify(FMEADto2 fmeaDto)
    {
        // verify basic information
        // TODO: no rule yet, just leave a placeholder

        // verify structure
        // 1. level is correct
        // 2. no circular reference

        // verify function
        // 1. level is correct
        // 2. no circular reference

        // verify fault
        // 1. level is correct
        // 2. faultType is correct (level1 is always FE, level2 is always FM, leverl3 is always FC)
        // 3. no circular reference

        // return all violations as string list

        return new List<string>();
    }

    public void SetupLevels(FMEADto2 fmeaDto)
    {
        // calculate structure levels
        var rootStructure = fmeaDto.FMStructures.First(s => s.Code == fmeaDto.RootStructureCode);
        SetStructureLevel(fmeaDto, rootStructure, 0);

        // calculate structure levels
        foreach (var structureDto in fmeaDto.FMStructures.Where(s => s.Level == 1))
        {
            foreach (var funcRef in structureDto.Functions)
            {
                var func = fmeaDto.FMFunctions.FirstOrDefault(s => s.Code == funcRef);
                if (func != null)
                {
                    SetFunctionLevel(fmeaDto, func, 1);
                }
            }
        }

        // calculate structure levels
        foreach (var functionDto in fmeaDto.FMFunctions.Where(f => f.Level == 1))
        {
            foreach (var faultRef in functionDto.FaultRefs)
            {
                var fault = fmeaDto.FMFaults.FirstOrDefault(f => f.Code == faultRef);
                if (fault != null)
                {
                    SetFaultLevel(fmeaDto, fault, 1);
                }
            }
        }
    }

    private void SetStructureLevel(FMEADto2 fmeaDto, FMStructureDto2 structureDto, int level)
    {
        structureDto.Level = level;
        foreach (var childRef in structureDto.Decomposition)
        {
            var child = fmeaDto.FMStructures.FirstOrDefault(s => s.Code == childRef);
            if (child != null)
            {
                SetStructureLevel(fmeaDto, child, level + 1);
            }
        }
    }

    private void SetFunctionLevel(FMEADto2 fmeaDto, FMFunctionDto2 functionDto, int level)
    {
        functionDto.Level = level;
        foreach (var childRef in functionDto.Prerequisites)
        {
            var child = fmeaDto.FMFunctions.FirstOrDefault(f => f.Code == childRef);
            if (child != null)
            {
                SetFunctionLevel(fmeaDto, child, level + 1);
            }
        }
    }

    private void SetFaultLevel(FMEADto2 fmeaDto, FMFaultDto2 faultDto, int level)
    {
        faultDto.Level = level;
        foreach (var childRef in faultDto.Causes)
        {
            var child = fmeaDto.FMFaults.FirstOrDefault(f => f.Code == childRef);
            if (child != null)
            {
                SetFaultLevel(fmeaDto, child, level + 1);
            }
        }
    }

    public async Task UpdateToDatabase(FMEADto2 fmeaDto)
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
            await _context.SaveChangesAsync();
        }

        foreach (var existingStructure in existingStructures)
        {
            var structureDto = fmeaDto.FMStructures.FirstOrDefault(s => s.Code == existingStructure.Code);
            if (structureDto != null)
            {
                _mapper.Map(structureDto, existingStructure);
            }
        }
        await _context.SaveChangesAsync();

        // add & update function
        var newFunctions = fmeaDto.FMFunctions
            .Where(dto => !existingFunctions.Any(e => e.Code == dto.Code))
            .ToList();

        foreach (var functionDto in newFunctions)
        {
            var function = _mapper.Map<FMFunction>(functionDto);
            _context.FMFunctions.Add(function);
        }

        foreach (var existingFunction in existingFunctions)
        {
            var functionDto = fmeaDto.FMFunctions.FirstOrDefault(f => f.Code == existingFunction.Code);
            if (functionDto != null)
            {
                _mapper.Map(functionDto, existingFunction);
            }
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

        foreach (var existingFault in existingFaults)
        {
            var faultDto = fmeaDto.FMFaults.FirstOrDefault(f => f.Code == existingFault.Code);
            if (faultDto != null)
            {
                _mapper.Map(faultDto, existingFault);
            }
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
}