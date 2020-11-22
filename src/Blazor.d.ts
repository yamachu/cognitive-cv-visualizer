import { domFunctions } from "microsoft.aspnetcore.components.web.js/DomWrapper";
import { InputFile } from "microsoft.aspnetcore.components.web.js/InputFile";
import { Platform } from "microsoft.aspnetcore.components.web.js/Platform/Platform";
import { WebAssemblyStartOptions } from "microsoft.aspnetcore.components.web.js/Platform/WebAssemblyStartOptions";
import {
  internalFunctions as navigationManagerInternalFunctions,
  navigateTo,
} from "microsoft.aspnetcore.components.web.js/Services/NavigationManager";
import { Virtualize } from "microsoft.aspnetcore.components.web.js/Virtualize";

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
