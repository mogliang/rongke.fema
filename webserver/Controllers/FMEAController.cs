// filepath: /home/seed/repo/personal/rongke.fema/webserver/Controllers/FMEAController.cs
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
        private readonly AppDbContext _dbContext;
        private readonly IMapper _mapper;

        public FMEAController(AppDbContext dbContext, IMapper mapper)
        {
            _dbContext = dbContext;
            _mapper = mapper;
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

            var fmea = await _dbContext.FMEAs
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
            var fmeas = await _dbContext.FMEAs.ToListAsync();
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
            var fmea = await _dbContext.FMEAs
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