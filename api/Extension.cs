using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace CVVisualizer.API.Extension
{
    public static class RequestExtensions
    {
        public async static Task<(RequestParameter?, Exception?)> ParseRequestParameter(this HttpRequest req)
        {
            var formdata = await req.ReadFormAsync().ConfigureAwait(false);
            var subscriptionKey = formdata["subscriptionKey"];
            if (subscriptionKey.Count == 0) {
                return (null, new Exception("subscriptionKey field is required"));
            }
            var endpoint = formdata["endpoint"];
            if (endpoint.Count == 0) {
                return (null, new Exception("endpoint field is required"));
            }
            if (!endpoint.ToString().EndsWith('/')) {
                return (null, new Exception("endpoint must be endWith '/'"));
            }
            var image = req.Form.Files["file"];
            if (image == null) {
                return (null, new Exception("file is required"));
            }
            return (new RequestParameter(subscriptionKey: subscriptionKey.ToString(), endpoint: endpoint.ToString(), image: image), null);
        }
    }
}