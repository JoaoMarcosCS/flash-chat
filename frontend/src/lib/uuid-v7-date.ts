export function getUuidV7Date(id: string): Date {
  return new Date(parseInt(id.replace(/-/g, '').slice(0, 12), 16));
}
