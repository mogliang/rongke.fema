using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rongke.Fema.Data;
using Rongke.Fema.Dto;

namespace Rongke.Fema.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FMStructuresController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IMapper _mapper;
        public FMStructuresController(AppDbContext dbContext, IMapper mapper)
        {
            _mapper = mapper;
            _dbContext = dbContext;
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create(FMStructureDto fMStructureDto)
        {
            var fMStructure = _mapper.Map<FMStructure>(fMStructureDto);
            _dbContext.FMStructures.Add(fMStructure);
            await _dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = fMStructure.Id }, fMStructure);
        }

        [HttpGet("{id}")]
        public async  Task<IActionResult> GetById(int id)
        {
            var fMStructure = await _dbContext.FMStructures.Where(p => p.Id == id).FirstOrDefaultAsync();
            if (fMStructure == null)
            {
                return NotFound();
            }

            return Ok(_mapper.Map<FMStructureDto>(fMStructure));
        }
    }
}
