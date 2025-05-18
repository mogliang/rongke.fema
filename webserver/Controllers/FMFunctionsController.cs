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
    public class FMFunctionsController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IMapper _mapper;
        public FMFunctionsController(AppDbContext dbContext, IMapper mapper)
        {
            _mapper = mapper;
            _dbContext = dbContext;
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create(FMFunctionDto fMFunctionDto)
        {
            throw new NotImplementedException();
        }

        [HttpGet("tree/{code}")]
        public async Task<IActionResult> GetTree(string code)
        {
            var fmFunction = await _dbContext.FMFunctions.FirstOrDefaultAsync(s => s.Code == code);
            if (fmFunction == null)
            {
                return NotFound();
            }

            var loadQueue = new Queue<FMFunction>();
            loadQueue.Enqueue(fmFunction);
            while (loadQueue.Count > 0)
            {
                var current = loadQueue.Dequeue();
                await _dbContext.Entry(current).Collection(s => s.Prerequisites).LoadAsync();
                foreach (var child in current.Prerequisites)
                {
                    loadQueue.Enqueue(child);
                }
            }

            var fmFunctionDto = _mapper.Map<FMStructureDto>(fmFunction);
            return Ok(fmFunctionDto);
        }
    }
}
