const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

const weekdayFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });

const dayMonthFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });

const shortDayMonthFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DAYS_IN_WEEK = 7;

function daysAgo(date: Date, now: Date): number {
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  return Math.round((startOfDay(now) - startOfDay(date)) / DAY_IN_MS);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatTime(date: Date): string {
  return timeFormat.format(date);
}

export function formatDay(date: Date, now = new Date()): string {
  const days = daysAgo(date, now);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days > 1 && days < DAYS_IN_WEEK) return capitalize(weekdayFormat.format(date));
  if (date.getFullYear() === now.getFullYear()) return dayMonthFormat.format(date);
  return dateFormat.format(date);
}

export function formatListDate(date: Date, now = new Date()): string {
  const days = daysAgo(date, now);
  if (days === 0) return formatTime(date);
  if (days === 1) return 'Ontem';
  if (days > 1 && days < DAYS_IN_WEEK) {
    return capitalize(weekdayFormat.format(date).replace('-feira', ''));
  }
  if (date.getFullYear() === now.getFullYear()) return shortDayMonthFormat.format(date);
  return dateFormat.format(date);
}

export function isSameDay(a: Date, b: Date): boolean {
  return daysAgo(a, b) === 0;
}
