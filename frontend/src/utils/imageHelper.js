// Pastikan ini mengambil URL Production dari env
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const getImageUrl = (imagePath) => {
  // 1. Handle null/undefined
  if (!imagePath) return "/assets/placeholder.png"; // Ganti dengan path placeholder kamu

  // 2. Bersihkan string dari sampah "undefined/" atau "null/"
  let cleanPath = imagePath
    .replace(/^undefined\//, "")
    .replace(/^null\//, "")
    .replace("undefined/", "")
    .trim();

  // 3. DETEKSI LOCALHOST (Port Berapapun: 3000, 3010, 5000, dll)
  // Regex ini menangkap "http://localhost:ANGKA"
  if (cleanPath.match(/http:\/\/localhost:\d+/)) {
    // Ganti bagian localhost dengan BACKEND_URL ("/")
    // Contoh: "http://localhost:3010/images/a.png" -> "/images/a.png"
    const cleanBackend = BACKEND_URL.endsWith("/")
      ? BACKEND_URL.slice(0, -1)
      : BACKEND_URL;
    return cleanPath.replace(/http:\/\/localhost:\d+/, cleanBackend);
  }

  // 4. Jika URL sudah HTTPS (Aman)
  if (cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  // 5. Handle Relative Path (misal: "images/struc.png")
  // Pastikan tidak double slash
  const cleanBase = BACKEND_URL.endsWith("/") ? BACKEND_URL : `${BACKEND_URL}/`;
  const finalPath = cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath;

  return `${cleanBase}${finalPath}`;
};
