
const KEY = "txDraft";

function read(){
  try { return JSON.parse(sessionStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}
function write(obj){ sessionStorage.setItem(KEY, JSON.stringify(obj)); }

const api = {
  get(field){
    const v = read()[field];
    if (field === "date" && typeof v === "string" && v) return new Date(v);
    return v ?? null;
  },
  set(field, value){
    const d = read();
    d[field] = (value instanceof Date) ? value.toISOString() : value;
    write(d);
  },
  clear(){ write({}); }
};
export default api;
