/**
 * Animated cursor shown while a message is being streamed.
 * Provides visual feedback that the AI is still generating a response.
 */
export function StreamingCursor() {
  return (
    <span className="inline-block w-2 h-4 bg-kumo-brand animate-pulse ml-0.5 align-middle" />
  );
}
