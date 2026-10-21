import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Görev ekleri en fazla 10 MB; çok parçalı form ek yükü için pay bırakıldı
    serverActions: {
      bodySizeLimit: "11mb",
    },
    proxyClientMaxBodySize: "11mb",
    // Ziyaret edilen sayfalar tarayıcıda 30 sn saklanır: geri dönüşler anında açılır.
    // Veri eskimez: canlı güncelleme (router.refresh) ve kendi işlemlerimiz
    // (revalidatePath) bu önbelleği temizler.
    staleTimes: {
      dynamic: 30,
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
