export type ProgressValue<T> =
  | { inProgress: true; value: null }
  | { inProgress: false; value: T };

export type JsonType =
  | {
      type: "error";
      value: unknown;
    }
  | {
      type: "ocr";
      value: OCRResponse;
    }
  | {
      type: "read";
      value: ReadResponse;
    }
  | {
      type: "none";
    };

export type BoundingIdentity =
  | {
      type: "area";
      index: number;
    }
  | {
      type: "char";
      index: number;
    };

export type Point = [x: number, y: number];

export type RectPoints = [
  leftTop: Point,
  leftBottom: Point,
  rightBottom: Point,
  rightTop: Point
];

export interface OCRResponse {
  regions: {
    boundingBox: string; // ex: "111,86,1061,559"
    lines: {
      boundingBox: string; // ex: "111,86,219,29"
      words: {
        boundingBox: string; // ex: "111,86,28,29"
        text: string; // ex: "あ"
      }[];
    }[];
  }[];
}

export interface ReadResponse {
  analyzeResult: {
    readResults: {
      lines: {
        boundingBox: number[]; // ex: [624, 199, 712, 199, 712, 223, 624, 223]
        text: string; // ex: "40.00kcal"
        words: {
          boundingBox: number[]; // ex: [624, 199, 712, 199, 712, 223, 624, 223]
          text: string; // ex: "40.00kcal"
          confidence: number; // ex: 0.700
        }[];
      }[];
    }[];
  };
}
