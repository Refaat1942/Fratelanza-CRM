import { useState } from "react";

type Props = {
  onChanged: () => Promise<void>;
  onLogout: () => Promise<void>;
};

export function ForcePasswordChange({ onChanged, onLogout }: Props) {
  const [current, setCurrent] = useState("admin123");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (next.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (next !== confirm) { setErr("Passwords do not match."); return; }
    if (next === "admin123") { setErr("Please pick something other than the default."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Failed"); }
      await onChanged();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-slate-900">Change your password</h2>
        <p className="text-sm text-slate-600 mt-2">
          You're still using the default password. For security, please choose a new one before continuing.
        </p>
        {err && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{err}</div>
        )}
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Current password</label>
            <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">New password (8+ characters)</label>
            <input type="password" value={next} onChange={e => setNext(e.target.value)} required minLength={8} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Confirm new password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            <button type="button" onClick={() => onLogout()} className="text-sm text-slate-500 hover:text-slate-900">Log out</button>
            <button type="submit" disabled={busy} className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg">
              {busy ? "Saving…" : "Set new password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
