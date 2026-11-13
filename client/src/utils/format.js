const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatCurrency = (n) => inr.format(Number(n) || 0);

export const pad = (n) => String(n).padStart(2, '0');
export const dateToKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => dateToKey(new Date());
export const keyToDate = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatDate = (key) => {
  if (!key) return '';
  return keyToDate(key).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

export const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);
