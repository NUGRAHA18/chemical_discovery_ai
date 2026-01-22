// Pastikan ini mengambil URL Production dari env
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "/assets/placeholder.png";

  let cleanPath = imagePath
    .replace(/^undefined\//, "")
    .replace(/^null\//, "")
    .replace("undefined/", "")
    .trim();

  if (cleanPath.match(/http:\/\/localhost:\d+/)) {
    const cleanBackend = BACKEND_URL.endsWith("/")
      ? BACKEND_URL.slice(0, -1)
      : BACKEND_URL;
    return cleanPath.replace(/http:\/\/localhost:\d+/, cleanBackend);
  }

  if (cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  const cleanBase = BACKEND_URL.endsWith("/") ? BACKEND_URL : `${BACKEND_URL}/`;
  const finalPath = cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath;

  return `${cleanBase}${finalPath}`;
};
