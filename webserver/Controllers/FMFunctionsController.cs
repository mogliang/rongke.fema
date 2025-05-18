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

        [HttpGet("all")]
        public async Task<IActionResult> GetAll()
        {
            var fmFunctions = await _dbContext.FMFunctions.ToListAsync();
            var fmFunctionDtos = _mapper.Map<List<FMFunctionDto>>(fmFunctions);

            var level1List = fmFunctionDtos.Where(s => s.Level == 1).ToList();
            var result = new List<FMFunctionDto>();
            foreach (var level1 in level1List)
            {
                result.AddRange(DeepTraverse(level1));
            }

            return Ok(result);
        }

        List<FMFunctionDto> DeepTraverse(FMFunctionDto fmFunctionDto)
        {
            var result = new List<FMFunctionDto> { fmFunctionDto };
            foreach (var child in fmFunctionDto.Prerequisites)
            {
                result.AddRange(DeepTraverse(child));
            }
            return result;
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
