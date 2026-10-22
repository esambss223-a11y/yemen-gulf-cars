export function reportFleetWriteError(message: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fleet:write-error', { detail: message }));
  }
}
