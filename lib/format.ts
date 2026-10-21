// Tarihler her zaman Türkiye saatine göre gösterilir

const TZ = "Europe/Istanbul";

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

// due_date "YYYY-MM-DD" biçimindedir; saat dilimi kaymasın diye öğlen alınır
export function formatDay(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });
}
