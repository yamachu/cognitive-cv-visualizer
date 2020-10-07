using System;
using Microsoft.AspNetCore.Http;

namespace CVVisualizer.API
{
    public readonly struct RequestParameter {
            public RequestParameter(string subscriptionKey, string endpoint, IFormFile image) {
                SubscriptionKey = subscriptionKey;
                Endpoint = endpoint;
                Image = image;
            }

            public readonly string SubscriptionKey;
            public readonly string Endpoint;
            public readonly IFormFile Image;
        }
}