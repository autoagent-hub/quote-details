import { createServerFn } from "@tanstack/react-start";

export const getServerIp = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = (await res.json()) as { ip?: string };
      if (data.ip) return { ip: data.ip };
    }
  } catch {
    /* ignore */
  }

  try {
    const res2 = await fetch("https://icanhazip.com", { signal: AbortSignal.timeout(3000) });
    if (res2.ok) {
      const text = (await res2.text()).trim();
      if (text) return { ip: text };
    }
  } catch {
    /* ignore */
  }

  return { ip: "Dynamic Cloud IP (Auto-resolved by DNS)" };
});
