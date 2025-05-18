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
            return CreatedAtAction(nameof(GetTree), new { id = fMStructure.Code }, fMStructure);
        }

        [HttpGet("tree/{code}")]
        public async Task<IActionResult> GetTree(string code)
        {
            var fMStructure = await _dbContext.FMStructures.FirstOrDefaultAsync(s => s.Code == code);
            if (fMStructure == null)
            {
                return NotFound();
            }

            var loadQueue = new Queue<FMStructure>();
            loadQueue.Enqueue(fMStructure);
            while (loadQueue.Count > 0)
            {
                var current = loadQueue.Dequeue();
                await _dbContext.Entry(current).Collection(s => s.ChildFMStructures).LoadAsync();
                await _dbContext.Entry(current).Collection(s => s.SEFunctions).LoadAsync();
                foreach (var child in current.ChildFMStructures)
                {
                    loadQueue.Enqueue(child);
                }
            }

            var fMStructureDto = _mapper.Map<FMStructureDto>(fMStructure);
            return Ok(fMStructureDto);
        }
    }
}
