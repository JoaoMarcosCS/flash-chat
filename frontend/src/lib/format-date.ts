const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function daysAgo(date: Date, now: Date): number {
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  return Math.round((startOfDay(now) - startOfDay(date)) / DAY_IN_MS);
}

export function formatTime(date: Date): string {
  return timeFormat.format(date);
}

export function formatDay(date: Date, now = new Date()): string {
  const days = daysAgo(date, now);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  return dateFormat.format(date);
}

export function formatListDate(date: Date, now = new Date()): string {
  return daysAgo(date, now) === 0 ? formatTime(date) : formatDay(date, now);
}

export function isSameDay(a: Date, b: Date): boolean {
  return daysAgo(a, b) === 0;
}
