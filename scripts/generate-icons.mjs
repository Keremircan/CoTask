// CoTask uygulama ikonlarını tek kaynaktan (public/icons/logo.svg) üretir.
// Çalıştırma: node scripts/generate-icons.mjs
//
// Üretilenler:
//   public/icons/icon-192.png, icon-512.png   → normal (köşeleri yuvarlak, şeffaf)
//   public/icons/maskable-512.png             → Android "maskable": zemin tam dolu,
//                                               işaret güvenli alanın içinde (telefon
//                                               kendi şekliyle kırpar)
//   app/apple-icon.png (180)                  → iPhone ana ekran (iOS köşeleri kendisi yuvarlar)
//   app/icon.svg                              → tarayıcı sekmesi ikonu

import { readFile, copyFile } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "public/icons/logo.svg";
const logo = await readFile(SOURCE, "utf8");

// Zemini tam kare yapar ve işareti merkezde küçültür (maskable / iOS için)
function fullBleed(svg, markScale) {
  const offset = (512 * (1 - markScale)) / 2;
  return svg
    .replaceAll('rx="116"', 'rx="0"')
    .replace(
      '<g fill="none"',
      `<g transform="translate(${offset} ${offset}) scale(${markScale})" fill="none"`,
    );
}

async function png(svg, size, out) {
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("✓", out);
}

await png(logo, 192, "public/icons/icon-192.png");
await png(logo, 512, "public/icons/icon-512.png");
// Maskable güvenli alan: merkezdeki %80'lik daire → işaret %72'ye küçültülür
await png(fullBleed(logo, 0.72), 512, "public/icons/maskable-512.png");
await png(fullBleed(logo, 0.84), 180, "app/apple-icon.png");
await copyFile(SOURCE, "app/icon.svg");
console.log("✓ app/icon.svg");

