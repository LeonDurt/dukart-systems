import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "dukartsystems.de" }],
        destination: "https://www.dukartsystems.de/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Statische Bilder, Icons und Fonts im /public-Ordner
        source: "/:file*.(png|jpg|jpeg|svg|ico|webp|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
