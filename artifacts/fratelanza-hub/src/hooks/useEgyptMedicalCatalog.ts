import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

export type EgyptCatalogOptions = {
  governorates: { en: string; ar: string }[];
  insuranceTypes: { value: string; en: string; ar: string }[];
  insuranceProviders: { en: string; ar: string; value?: string }[];
  citiesByGovernorate: Record<string, { en: string; ar: string }[]>;
  procedureCategories: { en: string; ar: string; value?: string }[];
  diagnoses: { en: string; ar: string; value?: string }[];
  chronicConditions: { en: string; ar: string }[];
  allergies: { en: string; ar: string }[];
  medications: { en: string; ar: string; value?: string }[];
  physioModalities: { en: string; ar: string }[];
  maritalStatuses: { en: string; ar: string; value: string }[];
  bloodTypes: string[];
  activityLevels: { en: string; ar: string; value: string }[];
  dietaryRestrictions: { en: string; ar: string }[];
};

const SEEDED_KEY = "egypt-catalog-seeded";

export function useEgyptMedicalCatalog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const optionsQ = useQuery<EgyptCatalogOptions>({
    queryKey: ["egypt-medical-catalog"],
    queryFn: () => apiFetch("/medical/catalog/options"),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const seedMut = useMutation({
    mutationFn: () => apiFetch<{ ok: boolean; seeded: string[] }>("/medical/catalog/seed-egypt", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procedures"] });
      qc.invalidateQueries({ queryKey: ["medical-materials"] });
      qc.invalidateQueries({ queryKey: ["physio-exercises"] });
      qc.invalidateQueries({ queryKey: ["nutrition-food"] });
    },
  });

  useEffect(() => {
    if (user?.role !== "admin") return;
    if (sessionStorage.getItem(SEEDED_KEY)) return;
    sessionStorage.setItem(SEEDED_KEY, "1");
    seedMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per session for admins
  }, [user?.role]);

  return { catalog: optionsQ.data, isLoading: optionsQ.isLoading, seedCatalog: seedMut };
}
