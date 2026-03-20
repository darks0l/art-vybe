import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  mainnet,
  bsc,
  base,
  polygon,
  avalanche,
  cronos,
} from "viem/chains";
import { roburna, vsc } from "./chains";

export const config = getDefaultConfig({
  appName: "Art Vybe",
  projectId: "85e04871f5700d250751a6a769ba13e7",
  chains: [mainnet, bsc, base, polygon, avalanche, cronos, roburna, vsc],
});
