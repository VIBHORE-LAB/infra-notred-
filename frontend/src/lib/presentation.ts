export const formatCurrency = (value?: number | null) =>
  `₹${Number(value ?? 0).toLocaleString('en-IN')}`;

export const statusToneClass = (status?: string) => {
  switch ((status ?? '').toLowerCase()) {
    case 'planned':
      return 'status-planned';
    case 'in progress':
    case 'in_progress':
      return 'status-progress';
    case 'completed':
      return 'status-success';
    case 'on hold':
    case 'on_hold':
      return 'status-danger';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
};

export const riskToneClass = (risk?: string) => {
  switch ((risk ?? '').toLowerCase()) {
    case 'high':
      return 'status-danger';
    case 'medium':
      return 'status-progress';
    case 'low':
      return 'status-success';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
};

export const updateToneClass = (type?: string) => {
  switch ((type ?? '').toLowerCase()) {
    case 'delay':
      return 'status-danger';
    case 'milestone':
    case 'budget':
      return 'status-progress';
    case 'completion':
      return 'status-success';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
};
