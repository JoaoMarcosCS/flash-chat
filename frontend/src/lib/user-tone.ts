const tones = [
  { soft: 'bg-muted', ink: 'text-foreground' },
  { soft: 'bg-surface ring-1 ring-inset ring-border', ink: 'text-foreground' },
] as const;

export type UserTone = (typeof tones)[number];

export function getUserTone(id: string): UserTone {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return tones[Math.abs(hash) % tones.length];
}
