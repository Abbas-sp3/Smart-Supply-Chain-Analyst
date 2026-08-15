import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["maplibre-gl", "react-force-graph-3d", "three-spritetext", "3d-force-graph", "force-graph"],
};

export default nextConfig;
