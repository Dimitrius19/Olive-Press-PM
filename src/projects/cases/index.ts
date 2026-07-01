import type { ProjectDef } from "../types";
import { makeCaseProject } from "./context";
import { hbh } from "./data/hbh";
import { mavromichali } from "./data/mavromichali";
import { robopark } from "./data/robopark";
import { metamorfosi } from "./data/metamorfosi";
import { patras } from "./data/patras";

// The five acquisition "opportunity cases", each a self-contained workspace
// built from its data file through the shared case framework.
export const caseProjects: ProjectDef[] = [
  hbh,
  mavromichali,
  robopark,
  metamorfosi,
  patras,
].map(makeCaseProject);
