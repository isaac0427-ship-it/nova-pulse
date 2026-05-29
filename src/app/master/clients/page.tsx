"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { NovaLogo } from "@/components/NovaLogo";
import { AddClientModal } from "@/components/AddClientModal";
import { Plus, ExternalLink, Trash2, Search } from "lucide-react";
import type { Business } from "@/types";

interface ClientRow extends Business {
  lead_count?: number;
  health_score?: number;
  active_leads?: number;
  missed_calls?: number;
}

function healthColor(score?: number): string {
  if (!score) return "#333333";
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

export default function ClientsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Isaac");

    const { data: userBiz } = await supabase.from("businesses").select("role").eq("owner_id", user.id).single();
    if (userBiz?.role !== "super_admin" && user.email !== "isaac_0427@icloud.com") { router.push("/login"); return; }

    const res = await fetch("/api/admin/businesses");
    if (!res.ok) { router.push("/login"); return; }
    const json = await res.json();
    setClients(json.businesses ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (bizId: string) => {
    if (!confirm("Delete this client and all their data? This cannot be undone.")) return;
    const supabase = createClient();
    await supabase.from("businesses").delete().eq("id", bizId);
    fetchData();
  };

  const filtered = clients.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.type ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <NovaLogo size={44} />
          <div style={{ width: 26, height: 26, border: "2px solid #1C1C1C", borderTopColor: "#C6A15B", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "18px auto 0" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex" }}>
      <Sidebar variant="master" userName={userName} onAddClient={() => setShowAddModal(true)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="pt-14 lg:pt-0">
        <div style={{ padding: "20px 32px", borderBottom: "1px solid #1C1C1C", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "#0A0A0A", position: "sticky", top: 0, zIndex: 30 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#333333" }}>Master View</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#F5F5F5", letterSpacing: "-0.02em", marginTop: 4 }}>All Clients</h1>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-gold" style={{ padding: "10px 18px" }}>
            <Plus size={13} /> Add Client
          </button>
        </div>

        <div style={{ flex: 1, padding: "28px 32px" }}>
          <div style={{ background: "#111111", border: "1px solid #1C1C1C" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #1C1C1C", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#F5F5F5" }}>Client Directory</h2>
                <span style={{ fontSize: 11, color: "#333333", background: "#07111F", border: "1px solid #1C1C1C", padding: "2px 8px" }}>{clients.length}</span>
              </div>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#333333" }} />
                <input placeholder="Search by name or type..." value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ background: "#07111F", border: "1px solid #1C1C1C", color: "#F5F5F5", fontSize: 13, padding: "8px 12px 8px 32px", outline: "none", width: 240 }} />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: "64px 24px", textAlign: "center" }}>
                <p style={{ color: "#333333", fontSize: 14 }}>{clients.length === 0 ? "No clients yet." : "No results."}</p>
                {clients.length === 0 && (
                  <button onClick={() => setShowAddModal(true)} className="btn-gold" style={{ marginTop: 16 }}>
                    <Plus size={13} /> Add First Client
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>{["Business", "Slug", "Industry", "Owner", "Health", "Leads", "Missed Calls", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filtered.map((client) => (
                      <tr key={client.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/${client.slug}`)}>
                        <td>
                          <div style={{ fontWeight: 600, color: "#F5F5F5" }}>{client.name}</div>
                          <div style={{ fontSize: 11, color: "#333333", marginTop: 2 }}>{client.email}</div>
                        </td>
                        <td>
                          <code className="font-mono" style={{ fontSize: 11, color: "#C6A15B", background: "rgba(198,161,91,0.08)", padding: "2px 7px" }}>/{client.slug}</code>
                        </td>
                        <td style={{ color: "#555555", fontSize: 13 }}>{client.type?.replace(/_/g, " ") ?? "—"}</td>
                        <td style={{ color: "#555555", fontSize: 13 }}>{client.owner_name}</td>
                        <td>
                          <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 700, color: healthColor(client.health_score) }}>
                            {client.health_score ?? "—"}
                          </span>
                        </td>
                        <td className="tabular-nums">{client.lead_count ?? 0}</td>
                        <td>
                          <span className="tabular-nums" style={{ color: (client.missed_calls ?? 0) > 0 ? "#EF4444" : "#333333" }}>
                            {client.missed_calls ?? 0}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => router.push(`/${client.slug}`)} title="View"
                              style={{ background: "transparent", border: "1px solid #1C1C1C", color: "#333333", padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, transition: "border-color 0.15s, color 0.15s" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(198,161,91,0.3)"; (e.currentTarget as HTMLElement).style.color = "#C6A15B"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1C1C1C"; (e.currentTarget as HTMLElement).style.color = "#333333"; }}
                            >
                              <ExternalLink size={11} /> View
                            </button>
                            <button onClick={() => handleDelete(client.id)} title="Delete"
                              style={{ background: "transparent", border: "1px solid #1C1C1C", color: "#333333", padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", transition: "border-color 0.15s, color 0.15s" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.3)"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1C1C1C"; (e.currentTarget as HTMLElement).style.color = "#333333"; }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddClientModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchData(); }} />
      )}
    </div>
  );
}
