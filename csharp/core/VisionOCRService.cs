using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace CVVisualizer.Core
{
    public static class VisionOCRService
    {
        readonly static string uriBase = "vision/v3.1/ocr";

        public static async Task<string> AnalyzeAsync(HttpClient client, string endpoint, string subscriptionKey, byte[] image)
        {
            // ref: https://docs.microsoft.com/ja-jp/azure/cognitive-services/computer-vision/quickstarts/csharp-print-text#create-and-run-the-sample-application
            var requestParameters = "language=ja&detectOrientation=true";
            var request = new HttpRequestMessage(HttpMethod.Post, $"{endpoint}{uriBase}?{requestParameters}");
            request.Headers.Add("ContentType", "application/json");
            request.Headers.Add("Ocp-Apim-Subscription-Key", subscriptionKey);
            
            using var content = new ByteArrayContent(image);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
            request.Content = content;

            var response = await client.SendAsync(request);
            var contentString = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode) {
                throw new ArgumentException(contentString);
            }
            
            return contentString;
        }
    }
}
