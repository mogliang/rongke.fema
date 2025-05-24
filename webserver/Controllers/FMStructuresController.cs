using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rongke.Fema.Data;
using Rongke.Fema.Domain;
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
        public async Task<ActionResult> Create(FMStructureCreateDto fMStructureCreateDto)
        {
            var codeGenerator = new FmeaCodeGenerator(_dbContext);

            var fMStructure = _mapper.Map<FMStructure>(fMStructureCreateDto);
            if (fMStructureCreateDto.ParentCode != null)
            {
                var parent = await _dbContext.FMStructures.FirstOrDefaultAsync(s => s.Code == fMStructureCreateDto.ParentCode);
                if (parent == null)
                {
                    throw new InvalidDataException($"Parent FMStructure with code {fMStructureCreateDto.ParentCode} not found.");
                }

                var (id, code) = codeGenerator.GenerateFmStructureCode();
                fMStructure.Id = id;
                fMStructure.Code = code;
                fMStructure.ParentFMStructureId = parent.Id;
            }
            else if (_dbContext.FMStructures.Any(s => s.ParentFMStructureId == null))
            {
                throw new InvalidDataException("Root FMStructure already exists. Please specify a parent code.");
            }

            _dbContext.FMStructures.Add(fMStructure);
            await _dbContext.SaveChangesAsync();

            _dbContext.FMStructures.Add(fMStructure);
            var dto = _mapper.Map<FMStructureDto>(fMStructure);
            return Ok(dto);
        }

        [HttpGet("tree/{code}")]
        public async Task<ActionResult<FMFunctionDto>> GetTree(string code, TreeType type)
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
                foreach (var child in current.ChildFMStructures)
                {
                    loadQueue.Enqueue(child);
                }

                if (type == TreeType.StructureAndFunction)
                {
                    await _dbContext.Entry(current).Collection(s => s.SEFunctions).LoadAsync();
                }
            }

            var fMStructureDto = _mapper.Map<FMStructureDto>(fMStructure);
            return Ok(fMStructureDto);
        }
    }

    public enum TreeType
    {
        Structure,
        StructureAndFunction,
    }
}
