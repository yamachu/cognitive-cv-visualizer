import React from "react";
import { render } from "react-dom";
import { createVisionAPIExecutor } from "./api";
import { App } from "./App";
import { createVisionAPIWasmExecutor } from "./wasm";

const bootstrap = () => {
  const HOST = process.env.API_HOST as string;
  const is_blazor = process.env.IS_BLAZOR;

  const executor = is_blazor
    ? createVisionAPIWasmExecutor()
    : createVisionAPIExecutor(HOST);

  return is_blazor
    ? window.Blazor.start().then((_) => executor)
    : Promise.resolve(executor);
};

bootstrap().then((executor) =>
  render(<App callApi={executor} />, document.querySelector("#root"))
);
