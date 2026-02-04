const KEY = 'oakwood:v1';

export function getItem(){
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setItem(value){
  try {
    const raw = JSON.stringify(value);
    localStorage.setItem(KEY, raw);
  } catch {
    // no-op: storage may be unavailable
  }
}

export function removeItem(){
  try {
    localStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}
