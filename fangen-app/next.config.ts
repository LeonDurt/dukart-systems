import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Die App ist eigenständig, auch wenn der Ordner in einem anderen Projekt liegt.
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
};

export default nextConfig;
