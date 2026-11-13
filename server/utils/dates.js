// Every transaction has a `dateKey` ("YYYY-MM-DD") that is the shop's local calendar date.
// All calendar / daily / monthly / yearly queries use dateKey ranges, so timezones never shift records.

export const pad = (n) => String(n).padStart(2, '0');

export const isValidDateKey = (key) => {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

export const todayKey = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.APP_TIME_ZONE || 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

// Noon IST on that calendar day. dateKey stays the source of truth for queries.
export const keyToDate = (key) => new Date(`${key}T12:00:00+05:30`);

export const monthRange = (year, month) => {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { start: `${year}-${pad(month)}-01`, end: `${year}-${pad(month)}-${pad(last)}` };
};

export const yearRange = (year) => ({ start: `${year}-01-01`, end: `${year}-12-31` });

const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export const dayCount = (start, end) => Math.round((parseKey(end) - parseKey(start)) / 86400000) + 1;

export const eachDay = (start, end) => {
  const out = [];
  for (let t = parseKey(start); t <= parseKey(end); t += 86400000) {
    const d = new Date(t);
    out.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`);
  }
  return out;
};

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
