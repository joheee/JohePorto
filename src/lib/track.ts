// Things worth counting that happen inside components (a copy button, the contact form) are reported here and
// sent by <Analytics /> when the visitor leaves. Nothing is sent from here, and nothing is kept for long: the
// queue is emptied on every send. The server only accepts the event names it knows (lib/analytics/model.ts).
const MAX_QUEUED = 40;
const queue: string[] = [];

export function track(name: string): void {
  if (queue.length < MAX_QUEUED) queue.push(name);
}

// Empties the queue and returns what was in it.
export function takeEvents(): string[] {
  return queue.splice(0, queue.length);
}
