import { OCRResponse, Point, ReadResponse, RectPoints } from "./types";

const ocrBoundingBoxToRectPoints = (b: string): RectPoints => {
  const tops = b.split(",").map((v) => parseInt(v, 10));
  const maybeLT = [tops[0], tops[1]] as Point;
  const maybeLB = [tops[0], tops[1] + tops[3]] as Point;
  const maybeRB = [tops[0] + tops[2], tops[1] + tops[3]] as Point;
  const maybeRT = [tops[0] + tops[2], tops[1]] as Point;
  const isMaybeLTisLT = maybeLT[0] <= maybeRB[0] && maybeLT[1] <= maybeRB[1];
  const maybeRectPoints = [maybeLT, maybeLB, maybeRB, maybeRT] as RectPoints;
  const fixedLTStartPoints = maybeRectPoints
    .slice(-1)
    .concat(maybeRectPoints.slice(0, -1)) as RectPoints;
  return isMaybeLTisLT ? maybeRectPoints : fixedLTStartPoints;
};

const readBoundingBoxToRectPoints = (tops: number[]): RectPoints => {
  const maybeLT = [tops[0], tops[1]] as Point;
  const maybeRT = [tops[2], tops[3]] as Point;
  const maybeRB = [tops[4], tops[5]] as Point;
  const maybeLB = [tops[6], tops[7]] as Point;
  const isMaybeLTisLT = maybeLT[0] <= maybeRB[0] && maybeLT[1] <= maybeRB[1];
  const maybeRectPoints = [maybeLT, maybeLB, maybeRB, maybeRT] as RectPoints;
  const fixedLTStartPoints = maybeRectPoints
    .slice(-1)
    .concat(maybeRectPoints.slice(0, -1)) as RectPoints;
  return isMaybeLTisLT ? maybeRectPoints : fixedLTStartPoints;
};

export const ocrResponseToAreaBoundaryRectPointsArray = (
  response: OCRResponse
): { rect: RectPoints; text: null }[] => {
  return response.regions[0].lines
    .map((v) => ({ boundingBox: v.boundingBox, text: null }))
    .map((v) => ({
      rect: ocrBoundingBoxToRectPoints(v.boundingBox),
      text: v.text,
    }));
};

export const ocrResponseToWordBoundaryRectPointsArray = (
  response: OCRResponse
): { rect: RectPoints; text: string }[] => {
  return response.regions[0].lines
    .map((v) =>
      v.words.map((vv) => ({ boundingBox: vv.boundingBox, text: vv.text }))
    )
    .reduce((a, b) => [...a, ...b])
    .map((v) => ({
      rect: ocrBoundingBoxToRectPoints(v.boundingBox),
      text: v.text,
    }));
};

export const readResponseToAreaBoundaryRectPointsArray = (
  response: ReadResponse
): { rect: RectPoints; text: string }[] => {
  return response.analyzeResult.readResults[0].lines
    .map((v) => ({ boundingBox: v.boundingBox, text: v.text }))
    .map((v) => ({
      rect: readBoundingBoxToRectPoints(v.boundingBox),
      text: v.text,
    }));
};

export const readResponseToWordBoundaryRectPointsArray = (
  response: ReadResponse
): { rect: RectPoints; text: string }[] => {
  return response.analyzeResult.readResults[0].lines
    .map((v) =>
      v.words.map((vv) => ({ boundingBox: vv.boundingBox, text: vv.text }))
    )
    .reduce((a, b) => [...a, ...b])
    .map((v) => ({
      rect: readBoundingBoxToRectPoints(v.boundingBox),
      text: v.text,
    }));
};

// ref: https://stackoverflow.com/a/5100158
export function dataURItoBlob(dataURI: string) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  let byteString: string;
  if (dataURI.split(",")[0].indexOf("base64") >= 0)
    byteString = atob(dataURI.split(",")[1]);
  else byteString = unescape(dataURI.split(",")[1]);

  // separate out the mime component
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ia], { type: mimeString });
}
