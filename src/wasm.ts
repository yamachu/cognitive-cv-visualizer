import { Endpoint, VisionAPIExecutor } from "./contract";
// NOTE: DO NOT import { DotNet } from "@microsoft/dotnet-js-interop";
// it will override .net dispatcher

export const createVisionAPIWasmExecutor = (): VisionAPIExecutor => (
  endpoint: Endpoint,
  formData: FormData,
  cbThen: (json: any) => void,
  cbCatch: (e: any) => void
) => {
  const formEndpoint = formData.get("endpoint") as string;
  const formSubscriptionKey = formData.get("subscriptionKey") as string;
  const formFile = formData.get("file") as File;
  const toBase64Promise = formFile.arrayBuffer().then((v) => {
    const arr = new Uint8Array(v);
    return window.btoa(
      arr.reduce((prev, curr) => {
        const next = String.fromCharCode(curr);
        return prev + next;
      }, "")
    );
  });

  const call = (base64File: string) => {
    switch (endpoint) {
      case Endpoint.OCR:
        return window.DotNet.invokeMethodAsync(
          "CVVisualizer.Blazor",
          "RunOCR",
          formEndpoint,
          formSubscriptionKey,
          base64File
        );
      case Endpoint.Read:
        return window.DotNet.invokeMethodAsync(
          "CVVisualizer.Blazor",
          "RunRead",
          formEndpoint,
          formSubscriptionKey,
          base64File
        );
    }
  };

  return toBase64Promise
    .then(call)
    .then((resp) => {
      const maybeJsonString = resp;
      if (typeof maybeJsonString !== "string") {
        throw new Error(`response is not desired format, ${maybeJsonString}`);
      }
      try {
        return JSON.parse(maybeJsonString);
      } catch (e) {
        throw e;
      }
    })
    .then(cbThen)
    .catch(cbCatch);
};
