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
using System.Linq;

namespace CVVisualizer.API
{
    public static class HttpTriggerForReadAPI
    {
        readonly static string uriBase = "vision/v3.1-preview.2/read/analyze";
        readonly static HttpClient client = new HttpClient();

        [FunctionName("HttpTriggerForReadAPI")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            var (reqParam, exc) = await req.ParseRequestParameter();
            if (exc != null) {
                return new BadRequestObjectResult(exc.Message);
            }
            
            // ref: https://docs.microsoft.com/ja-jp/azure/cognitive-services/computer-vision/quickstarts/csharp-hand-text#create-and-run-the-sample-application
            var request = new HttpRequestMessage(HttpMethod.Post, $"{reqParam.Value.Endpoint}{uriBase}?language=ja");
            request.Headers.Add("ContentType", "application/json");
            request.Headers.Add("Ocp-Apim-Subscription-Key", reqParam.Value.SubscriptionKey.ToString());
            
            using var binaryReader = new BinaryReader(reqParam.Value.Image.OpenReadStream());
            var imageByteData = binaryReader.ReadBytes((int)reqParam.Value.Image.Length);
            using var content = new ByteArrayContent(imageByteData);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
            request.Content = content;

            var response = await client.SendAsync(request);
            var (maybeOperationLocation, exc_) = await GetOperationLocation(response);
            if (exc_ != null) {
                return new BadRequestObjectResult(exc_.Message);
            }

            // READ APIは非同期のキューに置かれるので、定期的に叩いて終わっているか確認する必要がある
            string contentString;
            int i = 0;
            do
            {
                System.Threading.Thread.Sleep(1000);
                var request_ = new HttpRequestMessage(HttpMethod.Get, maybeOperationLocation);
                request_.Headers.Add("Ocp-Apim-Subscription-Key", reqParam.Value.SubscriptionKey.ToString());

                response = await client.SendAsync(request_);
                contentString = await response.Content.ReadAsStringAsync();
                ++i;
            }
            // 20秒…コスト抑えたいしね、Thread.Sleepってどうだったっけ…
            while (i < 20 && contentString.IndexOf("\"status\":\"succeeded\"") == -1);

            if (i == 20 && contentString.IndexOf("\"status\":\"succeeded\"") == -1)
            {
                return new BadRequestObjectResult("Timeout, try https://westus2.dev.cognitive.microsoft.com/docs/services/computer-vision-v3-1-preview-2/");
            }

            try {
                var jsonContent = JToken.Parse(contentString);

                return new JsonResult(jsonContent);
            } catch (Exception) {
                return new BadRequestObjectResult("Unexpected error");
            }
        }

        private async static Task<(string, Exception?)> GetOperationLocation(HttpResponseMessage response)
        {
            if (response.IsSuccessStatusCode) {
                return (response.Headers.GetValues("Operation-Location").FirstOrDefault(), null);
            }
            else
            {
                var errorString = await response.Content.ReadAsStringAsync();
                return (null, new Exception(JToken.Parse(errorString).ToString()));
            }
        }
    }
}
