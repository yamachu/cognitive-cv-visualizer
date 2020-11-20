// https://qiita.com/olt/items/3e3840db050414cde0ed
const { argv } = require("process");
const { build } = require("esbuild");
const fs = require("fs");
const path = require("path");

const options = {
  define: {
    "process.env.NODE_ENV": process.env.NODE_ENV,
    "process.env.API_HOST": JSON.stringify(
      process.env.AZURE_FUNCTIONS_API_HOST ?? "http://localhost:7071"
    ),
    "process.env.IS_BLAZOR": !!process.env.IS_BLAZOR,
  },
  entryPoints: [path.resolve(__dirname, "src/index.tsx")],
  minify: argv[2] === "production",
  bundle: true,
  target: "es2016",
  platform: "browser",
  outdir: process.env.DIST ?? path.resolve(__dirname, "dist"),
  tsconfig: path.resolve(__dirname, "tsconfig.json"),
};

const nonDefaultOutdir = options.outdir !== path.resolve(__dirname, "dist");

build(options)
  .then(
    () =>
      new Promise((resolve, reject) =>
        nonDefaultOutdir
          ? resolve()
          : fs.copyFile(
              path.resolve(__dirname, "index.html"),
              path.resolve(__dirname, "dist", "index.html"),
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              }
            )
      )
  )
  .catch((err) => {
    process.stderr.write(err.stderr);
    process.exit(1);
  });
