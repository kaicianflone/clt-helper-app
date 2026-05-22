interface EmptyStateProps {
  title: string;
  body: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-dashed border-[color:var(--border-soft)] p-8 text-center">
      <p className="font-medium text-[color:var(--fg-ink)]">{title}</p>
      <p className="mt-1 text-sm text-[color:var(--fg-ink-muted)]">{body}</p>
      {action && (
        <a
          href={action.href}
          className="mt-4 inline-block rounded-md bg-[color:var(--brick)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--brick-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
