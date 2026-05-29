"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Business } from "@/types";
import { useAppStore } from "@/store";

export function useBusiness() {
  const [loading, setLoading] = useState(true);
  const { business, setBusiness } = useAppStore();

  useEffect(() => {
    async function fetchBusiness() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      setBusiness((data as Business) ?? null);
      setLoading(false);
    }

    fetchBusiness();
  }, [setBusiness]);

  return { business, loading };
}
