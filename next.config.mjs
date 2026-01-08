import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // Ensure proper server-side rendering
  trailingSlash: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xtvj-bihp-mh8d.n7e.xano.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
