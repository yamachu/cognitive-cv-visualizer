import React from "react";

type ProgressValue<T> =
  | { inProgress: true; value: null }
  | { inProgress: false; value: T };

type JsonType =
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

type Point = [x: number, y: number];

type RectPoints = [
  leftTop: Point,
  leftBottom: Point,
  rightBottom: Point,
  rightTop: Point
];

interface OCRResponse {
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

interface ReadResponse {
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

const CanvasHeight = 720;
const CanvasWidth = 1280;

const drawRect = (
  context: CanvasRenderingContext2D,
  rectPoints: RectPoints
) => {
  context.beginPath();
  context.moveTo(...rectPoints[0]);
  context.lineTo(...rectPoints[1]);
  context.lineTo(...rectPoints[2]);
  context.lineTo(...rectPoints[3]);
  context.closePath();
  context.stroke();
};

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

const ocrResponseToAreaBoundaryRectPointsArray = (
  response: OCRResponse
): RectPoints[] => {
  return response.regions[0].lines
    .map((v) => v.boundingBox)
    .map(ocrBoundingBoxToRectPoints);
};

const ocrResponseToWordBoundaryRectPointsArray = (
  response: OCRResponse
): RectPoints[] => {
  return response.regions[0].lines
    .map((v) => v.words.map((vv) => vv.boundingBox))
    .reduce((a, b) => [...a, ...b])
    .map(ocrBoundingBoxToRectPoints);
};

const readResponseToAreaBoundaryRectPointsArray = (
  response: ReadResponse
): RectPoints[] => {
  return response.analyzeResult.readResults[0].lines
    .map((v) => v.boundingBox)
    .map(readBoundingBoxToRectPoints);
};

const readResponseToWordBoundaryRectPointsArray = (
  response: ReadResponse
): RectPoints[] => {
  return response.analyzeResult.readResults[0].lines
    .map((v) => v.words.map((vv) => vv.boundingBox))
    .reduce((a, b) => [...a, ...b])
    .map(readBoundingBoxToRectPoints);
};

export const App: React.FC<{}> = () => {
  const baseImageCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const areaCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const charCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const divRef = React.useRef<HTMLDivElement>(null);

  const [progressImage, setProgressImage] = React.useState<
    ProgressValue<HTMLImageElement>
  >({ inProgress: true, value: null });
  const [scale, setScale] = React.useState<number>(1.0);

  const [showArea, setShowArea] = React.useState(true);
  const [showCharArea, setShowCharArea] = React.useState(true);

  const [parsedJson, setParsedJson] = React.useState<ProgressValue<JsonType>>({
    inProgress: false,
    value: {
      type: "none",
    },
  });
  const [inputAreaValue, setInputAreaValue] = React.useState("");

  const onParseInputClicked = React.useCallback((value: string) => {
    try {
      const parsedJson = JSON.parse(value);
      if (parsedJson.regions !== undefined) {
        setParsedJson({
          inProgress: false,
          value: { type: "ocr", value: parsedJson },
        });
        return;
      }
      if (parsedJson.analyzeResult !== undefined) {
        setParsedJson({
          inProgress: false,
          value: { type: "read", value: parsedJson },
        });
        return;
      }
      setParsedJson({
        inProgress: false,
        value: { type: "error", value: "不明なフォーマットです" },
      });
    } catch (_) {
      setParsedJson({
        inProgress: false,
        value: { type: "error", value: "入力値が不正です" },
      });
    }
  }, []);

  const onOCRAPIAnalyticsClicked = React.useCallback(() => {
    if (progressImage.inProgress) {
      return;
    }

    const impl = async () => {
      setParsedJson({ inProgress: true, value: null });
      await new Promise((resolve) => {
        resolve(
          setParsedJson({
            inProgress: false,
            value: { type: "error", value: "not implemented" },
          })
        );
      });
    };
    impl();
  }, [progressImage]);
  const onREADAPIAnalyticsClicked = React.useCallback(() => {
    if (progressImage.inProgress) {
      return;
    }

    const impl = async () => {
      setParsedJson({ inProgress: true, value: null });
      await new Promise((resolve) => {
        resolve(
          setParsedJson({
            inProgress: false,
            value: { type: "error", value: "not implemented" },
          })
        );
      });
    };
    impl();
  }, [progressImage]);

  // NOTE: Drag & Dropしてファイルを読み込んで画像を取り込む処理の設定
  React.useEffect(() => {
    const ddArea = divRef.current;
    if (ddArea === null) {
      return;
    }
    ddArea.addEventListener("dragover", (ev) => {
      if (ev.dataTransfer === null) {
        return;
      }
      ev.dataTransfer.dropEffect = "copy";
      ev.preventDefault();
    });

    ddArea.addEventListener("drop", (ev) => {
      if (ev.dataTransfer === null) {
        return;
      }
      const files = ev.dataTransfer.files;

      if (files.length === 1) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            setProgressImage({ inProgress: false, value: img });
          };
          img.src = ev.target?.result as string;
          setProgressImage({ inProgress: true, value: null });
        };
        reader.readAsDataURL(file);
      }
      ev.preventDefault();
    });
  }, []);

  // リサイズのScale計算
  React.useEffect(() => {
    if (progressImage.inProgress) {
      setScale(1.0);
    } else {
      const img = progressImage.value;
      const { height, width } = img;
      const maybeWidthScale = width / CanvasWidth > 1 ? width / CanvasWidth : 1;
      const maybeHeighScale =
        height / CanvasHeight > 1 ? height / CanvasHeight : 1;
      setScale(Math.max(maybeWidthScale, maybeHeighScale));
    }
  }, [progressImage]);

  // NOTE: 処理対象の画像の読み込み
  React.useEffect(() => {
    const canvas = baseImageCanvasRef.current;
    if (canvas === null) {
      return;
    }
    const context = canvas.getContext("2d", { alpha: false });
    if (context === null) {
      return;
    }
    if (progressImage.inProgress) {
      // Canvas初期化
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.beginPath();
      context.textAlign = "center";
      context.fillText("ここに画像をD&D", canvas.width / 2, canvas.height / 2);
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    const img = progressImage.value;
    context.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      0,
      0,
      img.width / scale,
      img.height / scale
    );
  }, [progressImage, scale]);

  React.useEffect(() => {
    if (
      parsedJson.inProgress ||
      parsedJson.value.type === "error" ||
      parsedJson.value.type === "none"
    ) {
      return;
    }
    const canvas = areaCanvasRef.current;
    if (canvas === null) {
      return;
    }
    const context = canvas.getContext("2d");
    if (context === null) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "red";
    if (parsedJson.value.type === "read") {
      readResponseToAreaBoundaryRectPointsArray(
        parsedJson.value.value
      ).forEach((v) => drawRect(context, v));
    } else if (parsedJson.value.type === "ocr") {
      ocrResponseToAreaBoundaryRectPointsArray(
        parsedJson.value.value
      ).forEach((v) => drawRect(context, v));
    }
  }, [parsedJson]);

  React.useEffect(() => {
    if (
      parsedJson.inProgress ||
      parsedJson.value.type === "error" ||
      parsedJson.value.type === "none"
    ) {
      return;
    }
    const canvas = charCanvasRef.current;
    if (canvas === null) {
      return;
    }
    const context = canvas.getContext("2d");
    if (context === null) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "blue";
    if (parsedJson.value.type === "read") {
      readResponseToWordBoundaryRectPointsArray(
        parsedJson.value.value
      ).forEach((v) => drawRect(context, v));
    } else if (parsedJson.value.type === "ocr") {
      ocrResponseToWordBoundaryRectPointsArray(
        parsedJson.value.value
      ).forEach((v) => drawRect(context, v));
    }
  }, [parsedJson]);

  return (
    <div>
      <div
        ref={divRef}
        style={{
          width: CanvasWidth,
          height: CanvasHeight,
          position: "relative",
        }}
      >
        <canvas
          style={{
            zIndex: 1,
            position: "absolute",
          }}
          width={CanvasWidth}
          height={CanvasHeight}
          ref={baseImageCanvasRef}
        ></canvas>
        <canvas
          style={{
            zIndex: 2,
            position: "absolute",
            display: showArea ? undefined : "none",
          }}
          width={CanvasWidth}
          height={CanvasHeight}
          ref={areaCanvasRef}
        ></canvas>
        <canvas
          style={{
            zIndex: 3,
            position: "absolute",
            display: showCharArea ? undefined : "none",
          }}
          width={CanvasWidth}
          height={CanvasHeight}
          ref={charCanvasRef}
        ></canvas>
      </div>
      <button onClick={() => setShowArea((v) => !v)}>{`大枠BoundaryBoxを${
        showArea ? "非表示" : "表示"
      }`}</button>
      <button onClick={() => setShowCharArea((v) => !v)}>{`文字BoundaryBoxを${
        showCharArea ? "非表示" : "表示"
      }`}</button>
      <p style={{ display: "inline", color: "red" }}>
        {!parsedJson.inProgress && parsedJson.value.type === "error"
          ? JSON.stringify(parsedJson.value.value).replace(/"/g, "") // Danger
          : ""}
      </p>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <textarea
            rows={10}
            style={{ width: 640 }}
            onChange={(ev) => setInputAreaValue(ev.target.value)}
          />
          <button onClick={() => onParseInputClicked(inputAreaValue)}>
            {"入力されたResponseを使って領域を描画する"}
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            visibility: "hidden", // Note: まだ実装できてないのでhidden
          }}
        >
          <div style={{ display: "flex", flexDirection: "row" }}>
            <label>
              {"サブスクリプションキー"}
              <input />
            </label>
            <label>
              {"エンドポイント"}
              <input />
            </label>
          </div>
          <textarea value={""} readOnly style={{ flexGrow: 1, width: 640 }} />
          <div style={{ display: "flex", flexDirection: "row" }}>
            <button
              onClick={onOCRAPIAnalyticsClicked}
              disabled={[progressImage, parsedJson].some((v) => v.inProgress)}
            >
              {"OCR APIで分析"}
            </button>
            <button
              onClick={onREADAPIAnalyticsClicked}
              disabled={[progressImage, parsedJson].some((v) => v.inProgress)}
            >
              {"READ APIで分析"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
