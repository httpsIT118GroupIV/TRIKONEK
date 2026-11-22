// Nililinis ang VITE_PUBLIC_URL: tinatanggal ang panipi, espasyo, at sobrang "/",
// at dinadagdagan ng https:// kung wala
function clean(v) {
  let s = (v || '').trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  if (s && !/^https?:\/\//i.test(s)) s = `https://${s}`;
  return s;
}

export const BASE_URL = clean(import.meta.env.VITE_PUBLIC_URL) || window.location.origin;