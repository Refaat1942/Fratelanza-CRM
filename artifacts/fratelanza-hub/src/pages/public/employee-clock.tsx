import React, { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { publicApiPost } from "@/lib/public-api";
import { CheckCircle2, LogIn, LogOut, XCircle } from "lucide-react";

type ClockResult = {
  type: "in" | "out";
  clockedAt: string;
  employee: { name: string; nameAr?: string | null };
};

export default function PublicEmployeeClock() {
  const [, params] = useRoute("/c/:token");
  const token = params?.token ?? "";
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [result, setResult] = useState<ClockResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setState("error"); setError("invalid_token"); return; }
    publicApiPost<ClockResult>(`/public/clock/${encodeURIComponent(token)}`)
      .then(res => { setResult(res); setState("success"); })
      .catch(e => { setState("error"); setError(e instanceof Error ? e.message : "failed"); });
  }, [token]);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center"
      >
        {state === "loading" && (
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
        )}
        {state === "success" && result && (
          <>
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${result.type === "in" ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}>
              {result.type === "in" ? <LogIn size={32} /> : <LogOut size={32} />}
            </div>
            <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={28} />
            <p className="text-xl font-bold">{result.employee.nameAr || result.employee.name}</p>
            <p className="text-muted-foreground mt-2">
              {result.type === "in" ? "Clocked IN" : "Clocked OUT"} · {new Date(result.clockedAt).toLocaleTimeString()}
            </p>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="mx-auto text-destructive mb-3" size={40} />
            <p className="font-medium text-destructive">{error}</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
