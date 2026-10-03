import { useCallback, useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMe } from "@/lib/server/me";
import type { MePayload } from "@/lib/types";

let primed: { userId: string; me: MePayload } | null = null;

/** Lets a sign-in finish loading the account before the next page opens. */
export function primeMe(userId: string, me: MePayload) {
  primed = { userId, me };
}

export function useMe() {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id ?? null;
  const [me, setMe] = useState<MePayload | null>(() =>
    userId && primed?.userId === userId ? primed.me : null,
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const next = await getMe();
      setMe(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load account.");
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      if (!isPending) {
        setMe(null);
        setError(null);
      }
      return;
    }
    void refresh();
  }, [userId, isPending, refresh]);

  return {
    user,
    isPending,
    me,
    loading: !me && (isPending || Boolean(userId)) && !error,
    error,
    refresh,
  };
}
