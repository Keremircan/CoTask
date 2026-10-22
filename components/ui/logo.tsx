// CoTask logosu (public/icons/logo.svg; ikonlar da aynı dosyadan üretilir)
export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- küçük, statik SVG; optimizasyona gerek yok
    <img
      src="/icons/logo.svg"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      draggable={false}
    />
  );
}
