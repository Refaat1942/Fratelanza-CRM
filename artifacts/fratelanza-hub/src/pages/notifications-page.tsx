import React from "react";
import { useLanguage } from "../components/LanguageProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: number; title: string; titleAr?: string; message?: string; messageAr?: string;
  type: string; isRead: boolean; createdAt: string;
};

const typeConfig: Record<string, { icon: any; color: string }> = {
  info: { icon: Info, color: "text-blue-500" },
  success: { icon: CheckCircle2, color: "text-emerald-500" },
  warning: { icon: AlertTriangle, color: "text-amber-500" },
  error: { icon: XCircle, color: "text-red-500" },
};

export default function NotificationsPage() {
  const { t, isRtl } = useLanguage();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/notifications"),
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiFetch("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); toast({ title: t("All marked as read", "تم تحديد الكل كمقروء") }); },
  });

  const deleteNotif = useMutation({
    mutationFn: (id: number) => apiFetch(`/notifications/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {t("Notifications", "الإشعارات")}
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h2>
          <p className="text-muted-foreground">{t("Stay up to date with your team", "ابق على اطلاع بفريقك")}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" className="gap-2" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCheck size={16} />
            {t("Mark all read", "تحديد الكل كمقروء")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : notifications?.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg bg-card/50">
          <BellOff className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("No notifications yet.", "لا توجد إشعارات بعد.")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications?.map(notif => {
            const cfg = typeConfig[notif.type] ?? typeConfig.info;
            const Icon = cfg.icon;
            return (
              <Card
                key={notif.id}
                className={`transition-colors cursor-pointer hover:border-primary/50 ${!notif.isRead ? "border-primary/40 bg-primary/5" : ""}`}
                onClick={() => { if (!notif.isRead) markRead.mutate(notif.id); }}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`mt-0.5 shrink-0 ${cfg.color}`}><Icon size={20} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                        {isRtl ? (notif.titleAr || notif.title) : notif.title}
                      </p>
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    {notif.message && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {isRtl ? (notif.messageAr || notif.message) : notif.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={e => { e.stopPropagation(); deleteNotif.mutate(notif.id); }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
