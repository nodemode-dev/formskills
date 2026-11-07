declare const __ENGINE_BRIDGE__: boolean | undefined;

export type Invoke = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

export function engineInvoke(): Invoke | undefined {
  if (typeof __ENGINE_BRIDGE__ === "undefined" || !__ENGINE_BRIDGE__) return undefined;
  return async (cmd, args = {}) => {
    const answer = await fetch(`/api/engine/${cmd}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args) });
    const body = (await answer.json()) as { result?: unknown; error?: string };
    if (!answer.ok) throw body.error ?? `${cmd} failed`;
    return body.result;
  };
}
