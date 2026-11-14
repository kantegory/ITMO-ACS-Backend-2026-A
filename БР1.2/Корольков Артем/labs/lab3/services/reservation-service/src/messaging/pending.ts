type PendingEntry = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const pending = new Map<string, PendingEntry>();

export function waitForCorrelation<T>(correlationId: string, timeoutMs = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(correlationId);
      reject(new Error('reservation pipeline timeout'));
    }, timeoutMs);

    pending.set(correlationId, {
      resolve: resolve as (value: unknown) => void,
      reject,
      timer
    });
  });
}

export function resolveCorrelation(correlationId: string, value: unknown) {
  const entry = pending.get(correlationId);
  if (!entry) return;
  clearTimeout(entry.timer);
  pending.delete(correlationId);
  entry.resolve(value);
}

export function rejectCorrelation(correlationId: string, error: string) {
  const entry = pending.get(correlationId);
  if (!entry) return;
  clearTimeout(entry.timer);
  pending.delete(correlationId);
  entry.reject(new Error(error));
}
