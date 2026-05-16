import React from "react";
import { useLanguage } from "../components/LanguageProvider";

export default function Settings() {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("Settings", "الإعدادات")}</h2>
        <p className="text-muted-foreground mt-1">
          {t("Manage your application preferences and configuration.", "إدارة تفضيلات وتكوين التطبيق.")}
        </p>
      </div>

      <div className="p-8 border border-dashed border-border rounded-lg text-center bg-card/50">
        <p className="text-muted-foreground">
          {t("Settings functionality coming soon.", "وظيفة الإعدادات قريباً.")}
        </p>
      </div>
    </div>
  );
}
