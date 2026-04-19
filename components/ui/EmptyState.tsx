interface EmptyStateProps {
  title:       string;
  description?: string;
  action?:     React.ReactNode;
  icon?:       React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="text-gray-300 mb-4">{icon}</div>
      )}
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
