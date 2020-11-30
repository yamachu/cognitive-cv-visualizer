using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.JSInterop;
using CVVisualizer.Core;

namespace CVVisualizer.Blazor
{
    public partial class App
    {
        protected override bool ShouldRender() => false;

        private static HttpClient httpClient = new HttpClient();

        [JSInvokable]
        public static Task<string> RunOCR(string endpoint, string subscriptionKey, string imageBase64)
        {
            var image = Convert.FromBase64String(imageBase64);
            return VisionOCRService.AnalyzeAsync(httpClient, endpoint, subscriptionKey, image);
        }

        [JSInvokable]
        public static Task<string> RunRead(string endpoint, string subscriptionKey, string imageBase64)
        {
            var image = Convert.FromBase64String(imageBase64);
            return VisionReadAnalyzeService.AnalyzeAsync(httpClient, endpoint, subscriptionKey, image);
        }
    }
}
