using AutoMapper;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rongke.Fmea.Data;
using Rongke.Fmea.Dto;

namespace Rongke.Fmea.Controllers
{
    [ApiController]
    [ApiExplorerSettings(IgnoreApi = true)]
    public class ErrorController : ControllerBase
    {
        [Route("/error")]
        public IActionResult HandleError()
        {
            var exceptionHandlerFeature = HttpContext.Features.Get<IExceptionHandlerFeature>()!;

            var code = StatusCodes.Status500InternalServerError;

            if (exceptionHandlerFeature.Error is InvalidDataException)
            {
                code = StatusCodes.Status400BadRequest;
            }

            return Problem(
                statusCode: code,
                detail: exceptionHandlerFeature.Error.StackTrace,
                title: exceptionHandlerFeature.Error.Message);
        }
    }
}
