using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;

namespace CVVisualizer.Core
{
    public static class VisionReadAnalyzeService
    {
        readonly static string uriBase = "vision/v3.1/read/analyze";

        public static async Task<string> AnalyzeAsync(HttpClient client, string endpoint, string subscriptionKey, byte[] image)
        {
            // ref: https://docs.microsoft.com/ja-jp/azure/cognitive-services/computer-vision/quickstarts/csharp-hand-text#create-and-run-the-sample-application
            var request = new HttpRequestMessage(HttpMethod.Post, $"{endpoint}{uriBase}?language=ja");
            request.Headers.Add("ContentType", "application/json");
            request.Headers.Add("Ocp-Apim-Subscription-Key", subscriptionKey);
            
            using var content = new ByteArrayContent(image);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
            request.Content = content;

            var response = await client.SendAsync(request);
            var (maybeOperationLocation, exc_) = await GetOperationLocation(response);
            if (exc_ != null) {
                throw new ArgumentException(exc_.Message);
            }

            // READ APIは非同期のキューに置かれるので、定期的に叩いて終わっているか確認する必要がある
            string contentString;
            int i = 0;
            do
            {
                System.Threading.Thread.Sleep(1000);
                var request_ = new HttpRequestMessage(HttpMethod.Get, maybeOperationLocation);
                request_.Headers.Add("Ocp-Apim-Subscription-Key", subscriptionKey);

                response = await client.SendAsync(request_);
                contentString = await response.Content.ReadAsStringAsync();
                ++i;
            }
            // 20秒…コスト抑えたいしね、Thread.Sleepってどうだったっけ…
            while (i < 20 && contentString.IndexOf("\"status\":\"succeeded\"") == -1);

            if (i == 20 && contentString.IndexOf("\"status\":\"succeeded\"") == -1)
            {
                throw new TaskCanceledException("Timeout, try https://westus2.dev.cognitive.microsoft.com/docs/services/computer-vision-v3-1/");
            }

            return contentString;
        }

        private async static Task<(string, Exception?)> GetOperationLocation(HttpResponseMessage response)
        {
            if (response.IsSuccessStatusCode) {
                return (response.Headers.GetValues("Operation-Location").FirstOrDefault(), null);
            }
            else
            {
                var errorString = await response.Content.ReadAsStringAsync();
                return (null, new Exception(JsonSerializer.Deserialize<string>(errorString)));
            }
        }
    }
}
