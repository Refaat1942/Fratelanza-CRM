import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { SearchableSelect, type SearchableOption } from "./SearchableSelect";
import { useLanguage } from "@/components/LanguageProvider";

type Patient = {
  id: number;
  firstName: string;
  lastName?: string | null;
  firstNameAr?: string | null;
  lastNameAr?: string | null;
  phone?: string | null;
  nationalId?: string | null;
};

type Props = {
  value: string;
  onChange: (patientId: string) => void;
  className?: string;
};

export function PatientSearchSelect({ value, onChange, className }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["patients-all-for-select"],
    queryFn: () => apiFetch("/patients?sortBy=firstName&sortDir=asc"),
  });

  const options: SearchableOption[] = (patients ?? []).map((p) => {
    const nameEn = `${p.firstName} ${p.lastName ?? ""}`.trim();
    const nameAr = `${p.firstNameAr ?? p.firstName} ${p.lastNameAr ?? p.lastName ?? ""}`.trim();
    return {
      value: String(p.id),
      labelEn: nameEn,
      labelAr: nameAr,
      keywords: [p.phone, p.nationalId].filter(Boolean).join(" "),
    };
  });

  return (
    <SearchableSelect
      className={className}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={{ en: "Search patient by name, phone, ID…", ar: "ابحث عن مريض بالاسم أو الهاتف أو الرقم القومي…" }}
      emptyText={{ en: "No patients — add one in Patients first", ar: "لا يوجد مرضى — أضف مريضاً من صفحة المرضى أولاً" }}
    />
  );
}
