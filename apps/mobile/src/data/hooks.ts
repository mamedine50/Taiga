// Hooks React — l'UI lit via ces hooks (jamais Supabase directement).
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { getMission, getMissions } from "./repository";
import { pendingCount } from "./outbox";
import { syncFromServer } from "./sync";
import type { MissionWithShipments } from "./types";

/** Nombre d'actions en attente de synchro (indicateur hors-ligne). */
export function usePendingCount(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const c = await pendingCount();
      if (alive) setN(c);
    };
    void tick();
    const id = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  return n;
}

export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

export function useMissions(): {
  missions: MissionWithShipments[];
  loading: boolean;
  refreshing: boolean;
  sync: () => Promise<void>;
} {
  const [missions, setMissions] = useState<MissionWithShipments[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setMissions(await getMissions());
  }, []);

  const sync = useCallback(async () => {
    setRefreshing(true);
    await syncFromServer();
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    (async () => {
      await load(); // affiche d'abord le cache local
      await sync(); // puis rafraîchit depuis le serveur
      setLoading(false);
    })();
  }, [load, sync]);

  return { missions, loading, refreshing, sync };
}

export function useMission(id: string): {
  mission: MissionWithShipments | null;
  loading: boolean;
  reload: () => Promise<void>;
} {
  const [mission, setMission] = useState<MissionWithShipments | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setMission(await getMission(id));
  }, [id]);

  useEffect(() => {
    (async () => {
      await reload();
      setLoading(false);
    })();
  }, [reload]);

  return { mission, loading, reload };
}
