import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// El entorno trae Chromium preinstalado (Playwright). Evitamos que Remotion
// intente descargar su propio Chrome Headless Shell a través del proxy.
Config.setChromiumOpenGlRenderer("angle");
