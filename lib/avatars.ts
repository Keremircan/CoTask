// Profil fotoğrafları: herkese açık 'avatars' deposu, yol <kullanıcı-id>/<rastgele-id>.webp (WebP desteklenmezse .jpg)
export const AVATARS_BUCKET = "avatars";
export const AVATAR_SIZE = 256; // tarayıcıda bu boyuta küçültülüp WebP olarak yüklenir
export const MAX_AVATAR_SOURCE_BYTES = 15 * 1024 * 1024; // seçilen orijinal dosya

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export function isOwnAvatarPath(path: string, userId: string): boolean {
  return new RegExp(`^${userId}/${UUID}\.(webp|jpg)$`).test(path);
}

// Herkese açık adresten depo yolunu çıkarır (eski fotoğrafı silmek için)
export function avatarPathFromUrl(url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${AVATARS_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}
