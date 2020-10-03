import { OCRResponse, Point, ReadResponse, RectPoints } from "./types";

// Todo: この順番とも限らない時があるので、いい感じにclockwiseに出来るような何かを考える
const ocrBoundingBoxToRectPoints = (b: string): RectPoints => {
  const tops = b.split(",").map((v) => parseInt(v, 10));
  const lt = [tops[0], tops[1]] as Point;
  const lb = [tops[0], tops[1] + tops[3]] as Point;
  const rb = [tops[0] + tops[2], tops[1] + tops[3]] as Point;
  const rt = [tops[0] + tops[2], tops[1]] as Point;
  return [lt, lb, rb, rt] as RectPoints;
};

const readBoundingBoxToRectPoints = (tops: number[]): RectPoints => {
  const lt = [tops[0], tops[1]] as Point;
  const rt = [tops[2], tops[3]] as Point;
  const rb = [tops[4], tops[5]] as Point;
  const lb = [tops[6], tops[7]] as Point;
  return [lt, lb, rb, rt] as RectPoints;
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
