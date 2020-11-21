import { domFunctions } from "../aspnetcore/src/Components/Web.JS/src/DomWrapper";
import { InputFile } from "../aspnetcore/src/Components/Web.JS/src/InputFile";
import { Platform } from "../aspnetcore/src/Components/Web.JS/src/Platform/Platform";
import { WebAssemblyStartOptions } from "../aspnetcore/src/Components/Web.JS/src/Platform/WebAssemblyStartOptions";
import {
  internalFunctions as navigationManagerInternalFunctions,
  navigateTo,
} from "../aspnetcore/src/Components/Web.JS/src/Services/NavigationManager";
import { Virtualize } from "../aspnetcore/src/Components/Web.JS/src/Virtualize";

declare global {
  interface Window {
    Blazor: {
      start: (options?: Partial<WebAssemblyStartOptions>) => Promise<void>;

      // undocumented...
      platform: Platform;

      // from GlobalExports.ts
      navigateTo: typeof navigateTo;

      _internal: {
        navigationManager: typeof navigationManagerInternalFunctions;
        domWrapper: typeof domFunctions;
        Virtualize: typeof Virtualize;
        InputFile: typeof InputFile;
      };
    };
  }
}
