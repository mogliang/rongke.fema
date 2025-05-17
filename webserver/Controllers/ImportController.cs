using System.Collections;
using System.Xml.Linq;
using System.Xml.XPath;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Abstractions;
using Rongke.Fema.Data;
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

            try
            {
                var femaXml = XElement.Parse(fmeaXml);

                var fmFaultEles = femaXml.XPathSelectElements("//FM-FAULT");
                importFMFaults(_dbContext, fmFaultEles.ToList());

                var fmFunctionEles = femaXml.XPathSelectElements("//FM-FUNCTION");
                importFMFunctions(_dbContext, fmFunctionEles.ToList());

                var fmStructureEles = femaXml.XPathSelectElements("//FM-STRUCTURE-ELEMENT");
                importFMStructures(_dbContext, fmStructureEles.ToList());

                return Ok("FMEA imported successfully.");
            }
            catch (Exception ex)
            {
                return BadRequest($"Invalid FEMA: {ex.Message}");
            }
        }

        void importFMFaults(AppDbContext dbContext, IList<XElement> fmFaultEles)
        {
            // add FM-FAULT to database if not exist
            foreach (var fmFaultEle in fmFaultEles)
            {
                var fMFault = new FMFault
                {
                    LongName = fmFaultEle.Element("LONG-NAME").Element("L-4").Value,
                    Code = fmFaultEle.Attribute("ID").Value,
                    ShortName = fmFaultEle.Element("SHORT-NAME").Value,
                };

                var riskFactorStr = fmFaultEle.Element("FM-SIGNIFICANCE")?.Element("RISK-PRIORITY-FACTOR")?.Value;
                if (riskFactorStr != null)
                {
                    fMFault.RiskPriorityFactor = int.Parse(riskFactorStr);
                }

                var existingFMFault = dbContext.FMFaults.FirstOrDefault(p => p.Code == fMFault.Code);
                if (existingFMFault != null)
                {
                    existingFMFault.LongName = fMFault.LongName;
                    existingFMFault.ShortName = fMFault.ShortName;
                    existingFMFault.RiskPriorityFactor = fMFault.RiskPriorityFactor;
                }
                else
                {
                    dbContext.FMFaults.Add(fMFault);
                }
            }
            dbContext.SaveChanges();

            // set parent FM-FAULT
            var importedFMFaults = new List<FMFault>();
            foreach (var fmFaultEle in fmFaultEles)
            {
                var code = fmFaultEle.Attribute("ID").Value;
                var curFault = _dbContext.FMFaults.FirstOrDefault(p => p.Code == code);
                importedFMFaults.Add(curFault);

                var children = fmFaultEle.Element("FM-CAUSES")?.Elements("FM-FAULT-REF");
                if (children != null)
                {
                    foreach (var child in children)
                    {
                        var childCode = child.Attribute("ID-REF").Value;
                        var childFault = _dbContext.FMFaults.FirstOrDefault(p => p.Code == childCode);
                        if (childFault != null)
                        {
                            childFault.ParentFaultId = curFault.Id;
                        }
                    }
                }
            }

            // set level
            var visitChecker = new VisitChecker();
            var level1List = importedFMFaults.Where(p => p.ParentFaultId == null).ToList();
            foreach (var fMFault1 in level1List)
            {
                visitChecker.Visit(fMFault1.Code, "FM-FAULT");
                fMFault1.Level = 1;
                var level2List = importedFMFaults.Where(p => p.ParentFaultId == fMFault1.Id).ToList();
                foreach (var fMFault2 in level2List)
                {
                    visitChecker.Visit(fMFault2.Code, "FM-FAULT");
                    fMFault2.Level = 2;
                    var level3List = importedFMFaults.Where(p => p.ParentFaultId == fMFault2.Id).ToList();
                    foreach (var fMFault3 in level3List)
                    {
                        visitChecker.Visit(fMFault3.Code, "FM-FAULT");
                        fMFault3.Level = 3;
                    }
                }
            }
            dbContext.SaveChanges();
        }

        void importFMFunctions(AppDbContext dbContext, IList<XElement> fmFunctionEles)
        {
            // add FM-FUNCTION to database if not exist
            foreach (var fmFunctionEle in fmFunctionEles)
            {
                var fMFunction = new FMFunction
                {
                    LongName = fmFunctionEle.Element("LONG-NAME").Element("L-4").Value,
                    Code = fmFunctionEle.Attribute("ID").Value,
                    ShortName = fmFunctionEle.Element("SHORT-NAME").Value,
                };

                var existingFMFunction = dbContext.FMFunctions.FirstOrDefault(p => p.Code == fMFunction.Code);
                if (existingFMFunction != null)
                {
                    existingFMFunction.LongName = fMFunction.LongName;
                    existingFMFunction.ShortName = fMFunction.ShortName;
                }
                else
                {
                    dbContext.FMFunctions.Add(fMFunction);
                }
            }
            dbContext.SaveChanges();

            // set parent FM-FUNCTION
            var importedFMFunctions = new List<FMFunction>();
            foreach (var fmFunctionEle in fmFunctionEles)
            {
                var code = fmFunctionEle.Attribute("ID").Value;
                var curFunction = _dbContext.FMFunctions.FirstOrDefault(p => p.Code == code);
                importedFMFunctions.Add(curFunction);

                var children = fmFunctionEle.Element("FM-PREREQUISITES")?.Elements("FM-FUNCTION-REF");
                if (children != null)
                {
                    foreach (var child in children)
                    {
                        var childCode = child.Attribute("ID-REF").Value;
                        var childFunction = _dbContext.FMFunctions.FirstOrDefault(p => p.Code == childCode);
                        if (childFunction != null)
                        {
                            childFunction.ParentFMFunctionId = curFunction.Id;
                        }
                    }
                }
            }

            // set level
            var visitChecker = new VisitChecker();
            var level1List = importedFMFunctions.Where(p => p.ParentFMFunctionId == null).ToList();
            foreach (var fMFunction1 in level1List)
            {
                visitChecker.Visit(fMFunction1.Code, "FM-FUNCTION");
                fMFunction1.Level = 1;
                var level2List = importedFMFunctions.Where(p => p.ParentFMFunctionId == fMFunction1.Id).ToList();
                foreach (var fMFunction2 in level2List)
                {
                    visitChecker.Visit(fMFunction2.Code, "FM-FUNCTION");
                    fMFunction2.Level = 2;
                    var level3List = importedFMFunctions.Where(p => p.ParentFMFunctionId == fMFunction2.Id).ToList();
                    foreach (var fMFunction3 in level3List)
                    {
                        visitChecker.Visit(fMFunction3.Code, "FM-FUNCTION");
                        fMFunction3.Level = 3;
                    }
                }
            }

            // set FM-FAULT-REF
            foreach (var fmFunctionEle in fmFunctionEles)
            {
                var code = fmFunctionEle.Attribute("ID").Value;
                var curFunction = importedFMFunctions.First(p => p.Code == code);
                var faultRefs = fmFunctionEle.Element("FM-FAULT-REFS")?.Elements("FM-FAULT-REF");
                if (faultRefs != null)
                {
                    foreach (var faultRef in faultRefs)
                    {
                        var faultCode = faultRef.Attribute("ID-REF").Value;
                        var childFault = _dbContext.FMFaults.First(p => p.Code == faultCode);
                        childFault.FMFunctionId = curFunction.Id;
                    }
                }
            }

            dbContext.SaveChanges();
        }

        void importFMStructures(AppDbContext dbContext, IList<XElement> fmStructureEles)
        {
            // add FM-STRUCTURE-ELEMENT to database if not exist
            foreach (var fmStructureEle in fmStructureEles)
            {
                var fMStructure = new FMStructure
                {
                    LongName = fmStructureEle.Element("LONG-NAME").Element("L-4").Value,
                    Code = fmStructureEle.Attribute("ID").Value,
                    ShortName = fmStructureEle.Element("SHORT-NAME").Value,
                    Category = fmStructureEle.Element("CATEGORY").Value,
                };

                var existingFMStructure = dbContext.FMStructures.FirstOrDefault(p => p.Code == fMStructure.Code);
                if (existingFMStructure != null)
                {
                    existingFMStructure.LongName = fMStructure.LongName;
                    existingFMStructure.ShortName = fMStructure.ShortName;
                    existingFMStructure.Category = fMStructure.Category;
                }
                else
                {
                    dbContext.FMStructures.Add(fMStructure);
                }
            }
            _dbContext.SaveChanges();

            // set parent FM-STRUCTURE-ELEMENT
            var importedFMStructures = new List<FMStructure>();
            foreach (var fmStructureEle in fmStructureEles)
            {
                var code = fmStructureEle.Attribute("ID").Value;
                var curStructure = _dbContext.FMStructures.FirstOrDefault(p => p.Code == code);
                importedFMStructures.Add(curStructure);

                var children = fmStructureEle.Element("FM-SE-DECOMPOSITION")?.Elements("FM-STRUCTURE-ELEMENT-REF");
                if (children != null)
                {
                    foreach (var child in children)
                    {
                        var childCode = child.Attribute("ID-REF").Value;
                        var childStructure = _dbContext.FMStructures.FirstOrDefault(p => p.Code == childCode);
                        if (childStructure != null)
                        {
                            childStructure.ParentFMStructureId = curStructure.Id;
                        }
                    }
                }
            }

            // set level
            var visitChecker = new VisitChecker();
            var level0List = importedFMStructures.Where(p => p.ParentFMStructureId == null).ToList();
            // todo: level0List should be 1
            foreach (var fMStructure0 in level0List)
            {
                visitChecker.Visit(fMStructure0.Code, "FM-STRUCTURE");
                fMStructure0.Level = 0;
                var level1List = importedFMStructures.Where(p => p.ParentFMStructureId == fMStructure0.Id).ToList();
                foreach (var fMStructure1 in level1List)
                {
                    visitChecker.Visit(fMStructure1.Code, "FM-STRUCTURE");
                    fMStructure1.Level = 1;
                    var level2List = importedFMStructures.Where(p => p.ParentFMStructureId == fMStructure1.Id).ToList();
                    foreach (var fMStructure2 in level2List)
                    {
                        visitChecker.Visit(fMStructure2.Code, "FM-STRUCTURE");
                        fMStructure2.Level = 2;
                        var level3List = importedFMStructures.Where(p => p.ParentFMStructureId == fMStructure2.Id).ToList();
                        foreach (var fMStructure3 in level3List)
                        {
                            visitChecker.Visit(fMStructure3.Code, "FM-STRUCTURE");
                            fMStructure3.Level = 3;
                        }
                    }
                }
            }

            // set FM-FUNCTION-REF
            foreach (var fmStructureEle in fmStructureEles)
            {
                var code = fmStructureEle.Attribute("ID").Value;
                var curStructure = importedFMStructures.First(p => p.Code == code);
                var functionRefs = fmStructureEle.Element("FM-SE-FUNCTIONS")?.Elements("FM-FUNCTION-REF");
                if (functionRefs != null)
                {
                    foreach (var functionRef in functionRefs)
                    {
                        var functionCode = functionRef.Attribute("ID-REF").Value;
                        var childFunction = _dbContext.FMFunctions.First(p => p.Code == functionCode);
                        childFunction.FMStructureId = curStructure.Id;
                    }
                }
            }

            dbContext.SaveChanges();
        }
    }

    public class VisitChecker {
        private Hashtable  _visited = new Hashtable();

        public void Visit(string code, string type)
        {
            if (_visited.Contains(code))
            {
                throw new Exception($"Circular reference detected, {type} code: {code} ");
            }
            _visited.Add(code, true);
        }
    }
}
