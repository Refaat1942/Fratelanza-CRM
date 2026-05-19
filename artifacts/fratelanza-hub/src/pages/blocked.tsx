import { useLanguage } from "@/components/LanguageProvider";
import { Lock } from "lucide-react";

export default function BlockedPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold">
          {t("Subscription paused", "تم إيقاف الاشتراك مؤقتاً")}
        </h1>
        <p className="text-muted-foreground">
          {t(
            "Your workspace is currently inactive. Please contact your provider to restore access.",
            "تم إيقاف مساحة العمل الخاصة بك حالياً. يُرجى التواصل مع المزوّد لاستعادة الوصول."
          )}
        </p>
      </div>
    </div>
  );
}
