using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Net.Http.Headers;
using Newtonsoft.Json.Linq;
using CVVisualizer.API.Extension;

namespace CVVisualizer.API
{
    public static class HttpTriggerForReadOCR
    {
        readonly static string uriBase = "vision/v3.0/ocr";
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
            
            // ref: https://docs.microsoft.com/ja-jp/azure/cognitive-services/computer-vision/quickstarts/csharp-print-text#create-and-run-the-sample-application
            var requestParameters = "language=ja&detectOrientation=true";
            var request = new HttpRequestMessage(HttpMethod.Post, $"{reqParam.Value.Endpoint}{uriBase}?${requestParameters}");
            request.Headers.Add("ContentType", "application/json");
            request.Headers.Add("Ocp-Apim-Subscription-Key", reqParam.Value.SubscriptionKey.ToString());
            
            using var binaryReader = new BinaryReader(reqParam.Value.Image.OpenReadStream());
            var imageByteData = binaryReader.ReadBytes((int)reqParam.Value.Image.Length);
            using var content = new ByteArrayContent(imageByteData);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
            request.Content = content;

            try {
                var response = await client.SendAsync(request);
                var contentString = await response.Content.ReadAsStringAsync();
                var jsonContent = JToken.Parse(contentString);

                if (response.IsSuccessStatusCode)
                    return new JsonResult(jsonContent);
                else 
                    return new BadRequestObjectResult(contentString);
            } catch (Exception) {
                return new BadRequestObjectResult("Unexpected error");
            }
        }
    }
}
