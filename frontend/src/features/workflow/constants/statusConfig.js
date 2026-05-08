// Canonical status definitions used across all workflow components.

export const STATUS_ICON = {
  idle: '\u25CB',
  pending: '\u25CB',
  running: '\u25F7',
  paused: '\u275A\u275A',
  completed: '\u2713',
  failed: '\u2717',
  'failed (optional)': '\u26A0',
  skipped: '\u2192',
  cancelled: '\u2715',
  error: '\u2717',
};

export const STATUS_CLASS = {
  idle: 'statusIdle',
  pending: 'statusPending',
  running: 'statusRunning',
  paused: 'statusPaused',
  completed: 'statusCompleted',
  failed: 'statusFailed',
  'failed (optional)': 'statusFailedOptional',
  skipped: 'statusSkipped',
  cancelled: 'statusCancelled',
  error: 'statusFailed',
};

export const STATUS_LABEL = {
  idle: 'Not executed',
  pending: 'Pending',
  running: 'Running...',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  'failed (optional)': 'Failed (optional)',
  skipped: 'Skipped',
  cancelled: 'Cancelled',
  error: 'Error',
};