using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using Newtonsoft.Json.Linq;
using CVVisualizer.API.Extension;
using CVVisualizer.Core;

namespace CVVisualizer.API
{
    public static class HttpTriggerForReadOCR
    {
        readonly static HttpClient client = new HttpClient();

        [FunctionName("HttpTriggerForOCRAPI")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            var (reqParam, exc) = await req.ParseRequestParameter();
            if (exc != null) {
                return new BadRequestObjectResult(exc.Message);
            }
            
            using var binaryReader = new BinaryReader(reqParam.Value.Image.OpenReadStream());
            var imageByteData = binaryReader.ReadBytes((int)reqParam.Value.Image.Length);

            try {
                var result = await VisionOCRService.
                    AnalyzeAsync(client, reqParam.Value.Endpoint, reqParam.Value.SubscriptionKey, imageByteData)
                    .ConfigureAwait(false);
                
                var jsonContent = JToken.Parse(result);

                return new JsonResult(jsonContent);
            } catch (Exception e) {
                return new BadRequestObjectResult(e.Message);
            }
        }
    }
}
