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
            XElement? femaXml = null;
            try
            {
                femaXml = XElement.Parse(fmeaXml);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Invalid XML format.", ex);
            }

            var fmFaultEles = femaXml.XPathSelectElements("//FM-FAULT");
            importFMFaults(_dbContext, fmFaultEles.ToList());

            var fmFunctionEles = femaXml.XPathSelectElements("//FM-FUNCTION");
            importFMFunctions(_dbContext, fmFunctionEles.ToList());

            var fmStructureEles = femaXml.XPathSelectElements("//FM-STRUCTURE-ELEMENT");
            importFMStructures(_dbContext, fmStructureEles.ToList());

            return Ok("FMEA imported successfully.");
        }

        void importFMFaults(AppDbContext dbContext, IList<XElement> fmFaultEles)
        {
            var codeGenerator = new FmeaCodeGenerator(dbContext);
            // add FM-FAULT to database if not exist
            foreach (var fmFaultEle in fmFaultEles)
            {

                var (id,code) = codeGenerator.GenerateFmFaultCode();
                var fMFault = new FMFault
                {
                    Id = id,
                    Code = code,
                    ImportCode = fmFaultEle.Attribute("ID").Value,
                    LongName = fmFaultEle.Element("LONG-NAME").Element("L-4").Value,
                    ShortName = fmFaultEle.Element("SHORT-NAME").Value,
                };

                var riskFactorStr = fmFaultEle.Element("FM-SIGNIFICANCE")?.Element("RISK-PRIORITY-FACTOR")?.Value;
                if (riskFactorStr != null)
                {
                    fMFault.RiskPriorityFactor = int.Parse(riskFactorStr);
                }

                var existingFMFault = dbContext.FMFaults.FirstOrDefault(p => p.ImportCode == fMFault.Code);
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
                var curFault = _dbContext.FMFaults.FirstOrDefault(p => p.ImportCode == code);
                importedFMFaults.Add(curFault);

                var children = fmFaultEle.Element("FM-CAUSES")?.Elements("FM-FAULT-REF");
                if (children != null)
                {
                    foreach (var child in children)
                    {
                        var childCode = child.Attribute("ID-REF").Value;
                        var childFault = _dbContext.FMFaults.FirstOrDefault(p => p.ImportCode == childCode);
                        if (childFault != null)
                        {
                            childFault.ParentFaultId = curFault.Id;
                        }
                    }
                }
            }

            // set level
            var visitChecker = new VisitChecker();
            var level1List = importedFMFaults.Where(p => p.ParentFaultId == null).OrderBy(p => p.Id).ToList();
            var levelSeq = 0;
            foreach (var fMFault1 in level1List)
            {
                visitChecker.Visit(fMFault1.Code, "FM-FAULT");
                fMFault1.Level = 1;
                fMFault1.Seq = levelSeq++;
                var level2List = importedFMFaults.Where(p => p.ParentFaultId == fMFault1.Id).OrderBy(p => p.Id).ToList();
                var level2Seq = 0;
                foreach (var fMFault2 in level2List)
                {
                    visitChecker.Visit(fMFault2.Code, "FM-FAULT");
                    fMFault2.Level = 2;
                    fMFault2.Seq = level2Seq++;
                    var level3List = importedFMFaults.Where(p => p.ParentFaultId == fMFault2.Id).OrderBy(p => p.Id).ToList();
                    var level3Seq = 0;
                    foreach (var fMFault3 in level3List)
                    {
                        visitChecker.Visit(fMFault3.Code, "FM-FAULT");
                        fMFault3.Level = 3;
                        fMFault3.Seq = level3Seq++;
                    }
                }
            }

            dbContext.SaveChanges();
        }

        void importFMFunctions(AppDbContext dbContext, IList<XElement> fmFunctionEles)
        {
            var codeGenerator = new FmeaCodeGenerator(dbContext);

            // add FM-FUNCTION to database if not exist
            foreach (var fmFunctionEle in fmFunctionEles)
            {
                var (id,code)  = codeGenerator.GenerateFmFunctionCode();

                var fMFunction = new FMFunction
                {
                    Id = id,
                    Code = code,
                    ImportCode = fmFunctionEle.Attribute("ID").Value,
                    LongName = fmFunctionEle.Element("LONG-NAME").Element("L-4").Value,
                    ShortName = fmFunctionEle.Element("SHORT-NAME").Value,
                };

                var existingFMFunction = dbContext.FMFunctions.FirstOrDefault(p => p.ImportCode == fMFunction.Code);
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
                var curFunction = _dbContext.FMFunctions.FirstOrDefault(p => p.ImportCode == code);
                importedFMFunctions.Add(curFunction);

                var children = fmFunctionEle.Element("FM-PREREQUISITES")?.Elements("FM-FUNCTION-REF");
                if (children != null)
                {
                    foreach (var child in children)
                    {
                        var childCode = child.Attribute("ID-REF").Value;
                        var childFunction = _dbContext.FMFunctions.FirstOrDefault(p => p.ImportCode == childCode);
                        if (childFunction != null)
                        {
                            childFunction.ParentFMFunctionId = curFunction.Id;
                        }
                    }
                }
            }

            // set level
            var visitChecker = new VisitChecker();
            var level1List = importedFMFunctions.Where(p => p.ParentFMFunctionId == null).OrderBy(p => p.Id).ToList();
            var levelSeq = 0;
            foreach (var fMFunction1 in level1List)
            {
                visitChecker.Visit(fMFunction1.Code, "FM-FUNCTION");
                fMFunction1.Level = 1;
                fMFunction1.Seq = levelSeq++;
                var level2List = importedFMFunctions.Where(p => p.ParentFMFunctionId == fMFunction1.Id).OrderBy(p => p.Id).ToList();
                var level2Seq = 0;
                foreach (var fMFunction2 in level2List)
                {
                    visitChecker.Visit(fMFunction2.Code, "FM-FUNCTION");
                    fMFunction2.Level = 2;
                    fMFunction2.Seq = level2Seq++;
                    var level3List = importedFMFunctions.Where(p => p.ParentFMFunctionId == fMFunction2.Id).OrderBy(p => p.Id).ToList();
                    var level3Seq = 0;
                    foreach (var fMFunction3 in level3List)
                    {
                        visitChecker.Visit(fMFunction3.Code, "FM-FUNCTION");
                        fMFunction3.Level = 3;
                        fMFunction3.Seq = level3Seq++;
                    }
                }
            }

            // set FM-FAULT-REF
            foreach (var fmFunctionEle in fmFunctionEles)
            {
                var code = fmFunctionEle.Attribute("ID").Value;
                var curFunction = importedFMFunctions.First(p => p.ImportCode == code);
                if ( curFunction == null)
                {
                    throw new InvalidOperationException($"FMFunction with ImportCode {code} not found.");
                }

                var faultRefs = fmFunctionEle.Element("FM-FAULT-REFS")?.Elements("FM-FAULT-REF");
                if (faultRefs != null)
                {
                    foreach (var faultRef in faultRefs)
                    {
                        var faultCode = faultRef.Attribute("ID-REF").Value;
                        var childFault = _dbContext.FMFaults.First(p => p.ImportCode == faultCode);
                        childFault.FMFunctionId = curFunction.Id;
                    }
                }
            }

            dbContext.SaveChanges();
        }

        void importFMStructures(AppDbContext dbContext, IList<XElement> fmStructureEles)
        {
            var codeGenerator = new FmeaCodeGenerator(dbContext);

            // add FM-STRUCTURE-ELEMENT to database if not exist
            foreach (var fmStructureEle in fmStructureEles)
            {
                var (id,code) = codeGenerator.GenerateFmStructureCode();

                var fMStructure = new FMStructure
                {
                    Id = id,
                    Code = code,
                    ImportCode = fmStructureEle.Attribute("ID").Value,
                    LongName = fmStructureEle.Element("LONG-NAME").Element("L-4").Value,
                    ShortName = fmStructureEle.Element("SHORT-NAME").Value,
                    Category = fmStructureEle.Element("CATEGORY").Value,
                };

                var existingFMStructure = dbContext.FMStructures.FirstOrDefault(p => p.ImportCode == fMStructure.Code);
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
                var curStructure = _dbContext.FMStructures.FirstOrDefault(p => p.ImportCode == code);
                importedFMStructures.Add(curStructure);

                var children = fmStructureEle.Element("FM-SE-DECOMPOSITION")?.Elements("FM-STRUCTURE-ELEMENT-REF");
                if (children != null)
                {
                    foreach (var child in children)
                    {
                        var childCode = child.Attribute("ID-REF").Value;
                        var childStructure = _dbContext.FMStructures.FirstOrDefault(p => p.ImportCode == childCode);
                        if (childStructure != null)
                        {
                            childStructure.ParentFMStructureId = curStructure.Id;
                        }
                    }
                }
            }

            // set level
            var visitChecker = new VisitChecker();
            var level0List = importedFMStructures.Where(p => p.ParentFMStructureId == null).OrderBy(p => p.Id).ToList();
            // todo: level0List should be 1
            var levelSeq = 0;
            foreach (var fMStructure0 in level0List)
            {
                visitChecker.Visit(fMStructure0.Code, "FM-STRUCTURE");
                fMStructure0.Level = 0;
                fMStructure0.Seq = levelSeq++;
                var level1List = importedFMStructures.Where(p => p.ParentFMStructureId == fMStructure0.Id).OrderBy(p => p.Id).ToList();
                var level1Seq = 0;
                foreach (var fMStructure1 in level1List)
                {
                    visitChecker.Visit(fMStructure1.Code, "FM-STRUCTURE");
                    fMStructure1.Level = 1;
                    fMStructure1.Seq = level1Seq++;
                    var level2List = importedFMStructures.Where(p => p.ParentFMStructureId == fMStructure1.Id).OrderBy(p => p.Id).ToList();
                    var level2Seq = 0;
                    foreach (var fMStructure2 in level2List)
                    {
                        visitChecker.Visit(fMStructure2.Code, "FM-STRUCTURE");
                        fMStructure2.Level = 2;
                        fMStructure2.Seq = level2Seq++;
                        var level3List = importedFMStructures.Where(p => p.ParentFMStructureId == fMStructure2.Id).OrderBy(p => p.Id).ToList();
                        var level3Seq = 0;
                        foreach (var fMStructure3 in level3List)
                        {
                            visitChecker.Visit(fMStructure3.Code, "FM-STRUCTURE");
                            fMStructure3.Level = 3;
                            fMStructure3.Seq = level3Seq++;
                        }
                    }
                }
            }

            // set FM-FUNCTION-REF
            foreach (var fmStructureEle in fmStructureEles)
            {
                var code = fmStructureEle.Attribute("ID").Value;
                var curStructure = importedFMStructures.First(p => p.ImportCode == code);
                var functionRefs = fmStructureEle.Element("FM-SE-FUNCTIONS")?.Elements("FM-FUNCTION-REF");
                if (functionRefs != null)
                {
                    foreach (var functionRef in functionRefs)
                    {
                        var functionCode = functionRef.Attribute("ID-REF").Value;
                        var childFunction = _dbContext.FMFunctions.First(p => p.ImportCode == functionCode);
                        childFunction.FMStructureId = curStructure.Id;
                    }
                }
            }

            dbContext.SaveChanges();
        }
    }

    public class VisitChecker
    {
        private Hashtable _visited = new Hashtable();

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
