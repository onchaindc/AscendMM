import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Freebuff managed preview serves the app from a proxied dev origin.
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;