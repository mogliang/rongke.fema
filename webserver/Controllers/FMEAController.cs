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

        [HttpGet("doc")]
        public async Task<ActionResult<FMEADto2>> Doc()
        {
            // Get all structures with their relationships
            var structures = await _context.FMStructures
                .Include(s => s.ParentFMStructureRef)
                .ToListAsync();

            // Get all functions with their relationships
            var functions = await _context.FMFunctions
                .Include(f => f.ParentFMFunctionRef)
                .Include(f => f.FMStructureRef)
                .ToListAsync();

            // Get all faults with their relationships
            var faults = await _context.FMFaults
                .Include(f => f.ParentFaultRef)
                .Include(f => f.FMFunctionRef)
                .ToListAsync();

            // Create the DTO and map the data
            var fmeaDto = new FMEADto2
            {
                RootFMStructure = _mapper.Map<FMStructureDto2>(structures.FirstOrDefault(s => s.ParentFMStructureId == null)),
                FMStructures = _mapper.Map<List<FMStructureDto2>>(structures),
                FMFunctions = _mapper.Map<List<FMFunctionDto2>>(functions),
                FMFaults = _mapper.Map<List<FMFaultDto2>>(faults)
            };

            return fmeaDto;
        }

    }
}