

const KEY = "txDraft";

function read() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}
function write(obj) { sessionStorage.setItem(KEY, JSON.stringify(obj)); }

// cash
let state = read();

// 
const listeners = new Set();
function notify() { listeners.forEach(fn => fn()); }

function setField(field, value) {
  state = {
    ...state,
    [field]: (value instanceof Date) ? value.toISOString() : value
  };
  write(state);
  notify();
}

function clearAll() {
  state = {};
  write(state);
  notify();
}

export const txDraft = {
  get: () => state,
  getField(field) {
    const v = state[field];
    if (field === "date" && typeof v === "string" && v) return new Date(v);
    return v ?? null;
  },

  set(field, value) { setField(field, value); },

  setMany(patch) {
    const next = { ...state };
    for (const [k, v] of Object.entries(patch)) {
      next[k] = (v instanceof Date) ? v.toISOString() : v;
    }
    state = next;
    write(state);
    notify();
  },

  clear() { clearAll(); },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
};