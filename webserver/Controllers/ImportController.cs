using System.Collections;
using System.Xml.Linq;
using System.Xml.XPath;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Abstractions;
using Rongke.Fema.Data;
using Rongke.Fema.Domain;
using Rongke.Fema.Dto;

namespace Rongke.Fema.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImportController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IMapper _mapper;
        public ImportController(AppDbContext dbContext, IMapper mapper)
        {
            _mapper = mapper;
            _dbContext = dbContext;
        }

        [HttpPost("fmea-xml")]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
        public async Task<IActionResult> FmeaXml([FromForm] string fmeaXml)
        {
            var domain = new FMEADomain(_dbContext, _mapper);
            var fmeaDto = ConvertXmlToDto2(fmeaXml);
            domain.SetupReferences(fmeaDto);
            var failedRules = domain.Verify(fmeaDto);
            if (failedRules.Count > 0)
            {
                throw new InvalidOperationException("FMEA import failed validation. " + string.Join(", ", failedRules));
            }

            await domain.UpdateToDatabase(fmeaDto);

            return Ok("FMEA imported successfully.");
        }

        private FMEADto2 ConvertXmlToDto2(string fmeaXml)
        {
            var fmeaDto = new FMEADto2();
            var doc = XDocument.Parse(fmeaXml);

            var structureEles = doc.XPathSelectElements("//FM-STRUCTURE-ELEMENT").ToList();
            foreach (var structureEle in structureEles)
            {
                var structureDto = new FMStructureDto2
                {
                    Code = structureEle.Attribute("ID").Value,
                    LongName = structureEle.Element("LONG-NAME").Element("L-4").Value,
                    ShortName = structureEle.Element("SHORT-NAME").Value,
                    Category = structureEle.Element("CATEGORY").Value,
                };
                fmeaDto.FMStructures.Add(structureDto);
            }

            var functionEles = doc.XPathSelectElements("//FM-FUNCTION").ToList();
            foreach (var functionEle in functionEles)
            {
                var functionDto = new FMFunctionDto2
                {
                    Code = functionEle.Attribute("ID").Value,
                    LongName = functionEle.Element("LONG-NAME").Element("L-4").Value,
                    ShortName = functionEle.Element("SHORT-NAME").Value,
                };
                fmeaDto.FMFunctions.Add(functionDto);
            }

            var faultEles = doc.XPathSelectElements("//FM-FAULT").ToList();
            foreach (var faultEle in faultEles)
            {
                var faultDto = new FMFaultDto2
                {
                    Code = faultEle.Attribute("ID").Value,
                    LongName = faultEle.Element("LONG-NAME").Element("L-4").Value,
                    ShortName = faultEle.Element("SHORT-NAME").Value,
                };
                var riskFactorStr = faultEle.Element("FM-SIGNIFICANCE")?.Element("RISK-PRIORITY-FACTOR")?.Value;
                if (riskFactorStr != null)
                {
                    faultDto.RiskPriorityFactor = int.Parse(riskFactorStr);
                }

                fmeaDto.FMFaults.Add(faultDto);
            }

            foreach (var structureEle in structureEles)
            {
                var parentCode = structureEle.Attribute("ID").Value;
                 var children = structureEle.Element("FM-SE-DECOMPOSITION")?.Elements("FM-STRUCTURE-ELEMENT-REF");
                if (children != null)
                {
                    foreach (var childRef in children)
                    {
                        var childCode = childRef.Attribute("ID-REF").Value;
                        var child = fmeaDto.FMStructures.FirstOrDefault(s => s.Code == childCode);
                        if (child != null)
                        {
                            child.ParentFMStructureCode = parentCode;
                        }
                    }
                }
            }

            foreach (var functionEle in functionEles)
            {
                var parentCode = functionEle.Attribute("ID").Value;
                var children = functionEle.Element("FM-SE-FUNCTIONS")?.Elements("FM-FUNCTION-REF");
                if (children != null)
                {
                    foreach (var childRef in children)
                    {
                        var childCode = childRef.Attribute("ID-REF").Value;
                        var child = fmeaDto.FMFunctions.FirstOrDefault(s => s.Code == childCode);
                        if (child != null)
                        {
                            child.ParentFMFunctionCode = parentCode;
                        }
                    }
                }
            }

            return fmeaDto;
        }
    }
}
