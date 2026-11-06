interface DaySeparatorProps {
  label: string;
}

export function DaySeparator({ label }: DaySeparatorProps) {
  return (
    <div className="flex items-center gap-3 py-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
