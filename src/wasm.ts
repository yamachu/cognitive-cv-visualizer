import { Endpoint, VisionAPIExecutor } from "./contract";
// NOTE: DO NOT import { DotNet } from "@microsoft/dotnet-js-interop";
// it will override .net dispatcher

export const createVisionAPIWasmExecutor = (): VisionAPIExecutor => (
  endpoint: Endpoint,
  formData: FormData,
  cbThen: (json: any) => void,
  cbCatch: (e: any) => void
) => {
  // Todo: impl
  return Promise.resolve();
};
