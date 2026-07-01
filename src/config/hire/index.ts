import { HireTechnologyConfig } from "@/types/hire-technology";
import { reactConfig } from "./react";
import { nextjsConfig } from "./nextjs";
import { flutterConfig } from "./flutter";
import { devopsConfig } from "./devops";
import { qaEngineersConfig } from "./qa-engineers";

export const hireTechnologies: Record<string, HireTechnologyConfig> = {
  "react": reactConfig,
  "nextjs": nextjsConfig,
  "flutter": flutterConfig,
  "devops": devopsConfig,
  "qa-engineers": qaEngineersConfig,
};

export const getHireTechnologyConfig = (id: string): HireTechnologyConfig | undefined => {
  return hireTechnologies[id.toLowerCase()];
};
