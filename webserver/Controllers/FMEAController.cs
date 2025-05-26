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

        /// <summary>
        /// Get FMEA by code
        /// </summary>
        /// <param name="code">The unique code of the FMEA</param>
        /// <returns>The FMEA DTO if found, otherwise 404 Not Found</returns>
        [HttpGet("code/{code}")]
        public async Task<ActionResult<FMEADto>> GetByCode(string code)
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

            var fmeaDto = _mapper.Map<FMEADto>(fmea);
            return Ok(fmeaDto);
        }

        /// <summary>
        /// Get all FMEAs
        /// </summary>
        /// <returns>List of all FMEAs as DTOs</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FMEADto>>> GetAll()
        {
            var fmeas = await _context.FMEAs.ToListAsync();
            var fmeaDtos = _mapper.Map<IEnumerable<FMEADto>>(fmeas);
            return Ok(fmeaDtos);
        }

        /// <summary>
        /// Get FMEA by ID
        /// </summary>
        /// <param name="id">The ID of the FMEA</param>
        /// <returns>The FMEA DTO if found, otherwise 404 Not Found</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<FMEADto>> GetById(int id)
        {
            var fmea = await _context.FMEAs
                .Where(f => f.Id == id)
                .FirstOrDefaultAsync();

            if (fmea == null)
            {
                return NotFound($"FMEA with ID {id} not found");
            }

            var fmeaDto = _mapper.Map<FMEADto>(fmea);
            return Ok(fmeaDto);
        }
    }
}