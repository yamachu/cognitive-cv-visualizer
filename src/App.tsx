import React from "react";
import { Endpoint, VisionAPIExecutor } from "./contract";
import {
  dataURItoBlob,
  ocrResponseToAreaBoundaryRectPointsArray,
  ocrResponseToWordBoundaryRectPointsArray,
  readResponseToAreaBoundaryRectPointsArray,
  readResponseToWordBoundaryRectPointsArray,
} from "./domain";
import { BoundingIdentity, JsonType, ProgressValue, RectPoints } from "./types";

const CanvasHeight = 720;
const CanvasWidth = 1280;

const drawSpeechBubbleWithText = (
  context: CanvasRenderingContext2D,
  rect: RectPoints,
  text: string,
  scale: number
) => {
  context.beginPath();
  context.textAlign = "center";
  const leftTop = rect[0];
  const rightTop = rect[3];
  const x = (leftTop[0] + rightTop[0]) / 2 / scale;
  const y = (leftTop[1] + rightTop[1]) / 2 / scale;

  // ref: https://lab.syncer.jp/Web/JavaScript/Canvas/5/
  const fontSize = 24;
  context.font = `bold ${fontSize}px Arial, meiryo, sans-serif`;
  context.fillStyle = "rgba(255, 255, 255, 0.8)";
  const size = context.measureText(text);
  const margin = 8;
  context.moveTo(x, y);
  context.lineTo(x + 15, y - 15);
  context.lineTo(x + size.width / 2 + margin, y - 15);
  context.lineTo(x + size.width / 2 + margin, y - 15 - fontSize - margin * 2);
  context.lineTo(x - size.width / 2 - margin, y - 15 - fontSize - margin * 2);
  context.lineTo(x - size.width / 2 - margin, y - 15);
  context.lineTo(x - 15, y - 15);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "rgb(0, 0, 0)";
  context.fillText(text, x, y - 15 - margin);
};

const toPolygonPoints = (rect: RectPoints, scale: number): string =>
  `${rect
    .reduce(
      (prev, next) => [...prev, ...next].map((v) => v / scale),
      [] as number[]
    )
    .join(", ")}`;

export const App: React.FC<{ callApi: VisionAPIExecutor }> = ({ callApi }) => {
  const baseImageCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const tooltipRenderCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const divRef = React.useRef<HTMLDivElement>(null);

  const [progressImage, setProgressImage] = React.useState<
    ProgressValue<HTMLImageElement>
  >({ inProgress: true, value: null });
  const [scale, setScale] = React.useState<number>(1.0);

  const [showArea, setShowArea] = React.useState(true);
  const [showCharArea, setShowCharArea] = React.useState(true);
  const [showTooltip, setShowTooltip] = React.useState(true);

  const [parsedJson, setParsedJson] = React.useState<ProgressValue<JsonType>>({
    inProgress: false,
    value: {
      type: "none",
    },
  });
  const [inputAreaValue, setInputAreaValue] = React.useState("");
  const [endpointInput, setEndpointInput] = React.useState("");
  const [subscriptionKeyInput, setSubscriptionKeyInput] = React.useState("");
  const [apiCallResponseText, setApiCallResponseText] = React.useState("");

  const [areaBoundaries, setAreaBoundaries] = React.useState<
    { rect: RectPoints; text: string | null }[]
  >([]);
  const [charBoundaries, setCharBoundaries] = React.useState<
    { rect: RectPoints; text: string }[]
  >([]);
  const [
    visibleTooltipIdentity,
    setVisibleTooltipIdentity,
  ] = React.useState<BoundingIdentity | null>(null);
  const tooltipContent = React.useMemo(() => {
    if (visibleTooltipIdentity === null) {
      return null;
    }
    if (visibleTooltipIdentity.type === "area") {
      return areaBoundaries[visibleTooltipIdentity.index] ?? null;
    } else if (visibleTooltipIdentity.type === "char") {
      return charBoundaries[visibleTooltipIdentity.index] ?? null;
    }
    return null;
  }, [visibleTooltipIdentity, areaBoundaries, charBoundaries]);

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

    const formData = new FormData();
    formData.append("subscriptionKey", subscriptionKeyInput);
    formData.append("endpoint", endpointInput);
    formData.append("file", dataURItoBlob(progressImage.value.src));

    const impl = async () => {
      setParsedJson({ inProgress: true, value: null });
      setApiCallResponseText("");
      callApi(
        Endpoint.OCR,
        formData,
        (j) => {
          setParsedJson({
            inProgress: false,
            value: { type: "ocr", value: j },
          });
          setApiCallResponseText(JSON.stringify(j, null, "\t"));
        },
        (e) => {
          setParsedJson({
            inProgress: false,
            value: { type: "error", value: (e as Error).message },
          });
        }
      );
    };

    impl();
  }, [progressImage, endpointInput, subscriptionKeyInput]);
  const onREADAPIAnalyticsClicked = React.useCallback(() => {
    if (progressImage.inProgress) {
      return;
    }

    const formData = new FormData();
    formData.append("subscriptionKey", subscriptionKeyInput);
    formData.append("endpoint", endpointInput);
    formData.append("file", dataURItoBlob(progressImage.value.src));

    const impl = async () => {
      setParsedJson({ inProgress: true, value: null });
      setApiCallResponseText("");
      callApi(
        Endpoint.Read,
        formData,
        (j) => {
          setParsedJson({
            inProgress: false,
            value: { type: "read", value: j },
          });
          setApiCallResponseText(JSON.stringify(j, null, "\t"));
        },
        (e) => {
          setParsedJson({
            inProgress: false,
            value: { type: "error", value: (e as Error).message },
          });
        }
      );
    };
    impl();
  }, [progressImage, endpointInput, subscriptionKeyInput]);

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
      return;
    }
    const { height, width } = progressImage.value;
    const maybeWidthScale = width / CanvasWidth > 1 ? width / CanvasWidth : 1;
    const maybeHeighScale =
      height / CanvasHeight > 1 ? height / CanvasHeight : 1;
    setScale(Math.max(maybeWidthScale, maybeHeighScale));
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
      setAreaBoundaries([]);
      return;
    }
    if (parsedJson.value.type === "read") {
      setAreaBoundaries(
        readResponseToAreaBoundaryRectPointsArray(parsedJson.value.value)
      );
      setCharBoundaries(
        readResponseToWordBoundaryRectPointsArray(parsedJson.value.value)
      );
    } else if (parsedJson.value.type === "ocr") {
      setAreaBoundaries(
        ocrResponseToAreaBoundaryRectPointsArray(parsedJson.value.value)
      );
      setCharBoundaries(
        ocrResponseToWordBoundaryRectPointsArray(parsedJson.value.value)
      );
    }
  }, [parsedJson]);

  React.useEffect(() => {
    const canvas = tooltipRenderCanvasRef.current;
    if (canvas === null) {
      return;
    }
    const context = canvas.getContext("2d", { alpha: true });
    if (context === null) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (tooltipContent === null || tooltipContent.text === null) {
      return;
    }

    drawSpeechBubbleWithText(
      context,
      tooltipContent.rect,
      tooltipContent.text,
      scale
    );
  }, [tooltipContent, scale]);

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
        <svg
          width={CanvasWidth}
          height={CanvasHeight}
          viewBox={`0 0 ${CanvasWidth} ${CanvasHeight}`}
          style={{
            zIndex: 2,
            position: "absolute",
            display: showArea ? undefined : "none",
          }}
        >
          {areaBoundaries.map((v, i) => (
            <polygon
              key={i}
              points={toPolygonPoints(v.rect, scale)}
              style={{ fill: "transparent", stroke: "red", strokeWidth: 2 }}
              onMouseEnter={() =>
                setVisibleTooltipIdentity({ type: "area", index: i })
              }
              onMouseLeave={() => setVisibleTooltipIdentity(null)}
            />
          ))}
        </svg>
        <svg
          width={CanvasWidth}
          height={CanvasHeight}
          viewBox={`0 0 ${CanvasWidth} ${CanvasHeight}`}
          style={{
            zIndex: 3,
            position: "absolute",
            display: showCharArea ? undefined : "none",
          }}
        >
          {charBoundaries.map((v, i) => (
            <polygon
              key={i}
              points={toPolygonPoints(v.rect, scale)}
              style={{ fill: "transparent", stroke: "blue", strokeWidth: 2 }}
              onMouseEnter={() =>
                setVisibleTooltipIdentity({ type: "char", index: i })
              }
              onMouseLeave={() => setVisibleTooltipIdentity(null)}
            />
          ))}
        </svg>
        <canvas
          style={{
            pointerEvents: "none",
            zIndex: 4,
            position: "absolute",
            display: showTooltip ? undefined : "none",
          }}
          width={CanvasWidth}
          height={CanvasHeight}
          ref={tooltipRenderCanvasRef}
        ></canvas>
      </div>
      <button onClick={() => setShowArea((v) => !v)}>{`大枠BoundaryBoxを${
        showArea ? "非表示" : "表示"
      }`}</button>
      <button onClick={() => setShowCharArea((v) => !v)}>{`文字BoundaryBoxを${
        showCharArea ? "非表示" : "表示"
      }`}</button>
      <button onClick={() => setShowTooltip((v) => !v)}>{`認識結果を${
        showTooltip ? "非表示" : "表示"
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
          }}
        >
          <div style={{ display: "flex", flexDirection: "row" }}>
            <label>
              {"サブスクリプションキー"}
              <input
                type={"password"}
                autoComplete={"off"}
                value={subscriptionKeyInput}
                onChange={(ev) => setSubscriptionKeyInput(ev.target.value)}
              />
            </label>
            <label>
              {"エンドポイント"}
              <input
                type={"password"}
                autoComplete={"off"}
                value={endpointInput}
                onChange={(ev) => setEndpointInput(ev.target.value)}
              />
            </label>
          </div>
          <textarea
            value={apiCallResponseText}
            readOnly
            style={{ flexGrow: 1, width: 640 }}
          />
          <div style={{ display: "flex", flexDirection: "row" }}>
            <button
              onClick={onOCRAPIAnalyticsClicked}
              disabled={
                [progressImage, parsedJson].some((v) => v.inProgress) ||
                endpointInput === "" ||
                subscriptionKeyInput === ""
              }
            >
              {"OCR APIで分析"}
            </button>
            <button
              onClick={onREADAPIAnalyticsClicked}
              disabled={
                [progressImage, parsedJson].some((v) => v.inProgress) ||
                endpointInput === "" ||
                subscriptionKeyInput === ""
              }
            >
              {"READ APIで分析"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
