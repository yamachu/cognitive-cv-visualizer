export const enum Endpoint {
  Read = "/api/HttpTriggerForReadAPI",
  OCR = "/api/HttpTriggerForOCRAPI",
}

export type VisionAPIExecutor = (
  endpoint: Endpoint,
  formData: FormData,
  cbThen: (json: any) => void,
  cbCatch: (e: any) => void
) => Promise<void>;
