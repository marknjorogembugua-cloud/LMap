import type { ComponentType, SVGProps } from "react";
import {
  BuildingOffice2Icon,
  WrenchScrewdriverIcon,
  BoltIcon,
  WrenchIcon,
  PaintBrushIcon,
  HomeModernIcon,
  SunIcon,
  TruckIcon,
  ArchiveBoxIcon,
  SparklesIcon,
  CakeIcon,
  AcademicCapIcon,
  ScissorsIcon,
  Cog6ToothIcon,
  FireIcon,
  TagIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

// Workers type their own category in free text, so there's no fixed list to
// key off. This is a best-effort keyword guess for a relevant icon — it's
// only ever used for a decorative chip, never for matching or filtering.
const KEYWORD_ICONS: [RegExp, HeroIcon][] = [
  [/mason|build|construct/, BuildingOffice2Icon],
  [/plumb|pipe/, WrenchScrewdriverIcon],
  [/electric|wiring/, BoltIcon],
  [/carpen|furniture|wood/, WrenchIcon],
  [/paint/, PaintBrushIcon],
  [/house ?help|nanny|maid|domestic/, HomeModernIcon],
  [/garden|landscap/, SunIcon],
  [/boda|rider|motorcyc|delivery|courier|errand/, TruckIcon],
  [/mov(e|ing|er)|loader|haul/, ArchiveBoxIcon],
  [/clean/, SparklesIcon],
  [/cook|chef|catering/, CakeIcon],
  [/tutor|teach|lesson/, AcademicCapIcon],
  [/hair|barber|salon|beauty/, ScissorsIcon],
  [/mechanic|car repair|auto/, Cog6ToothIcon],
  [/weld/, FireIcon],
  [/tailor|sew|stitch|dressmak/, TagIcon],
  [/security|guard/, ShieldCheckIcon],
];

export function guessCategoryIcon(category: string): HeroIcon {
  const text = category.toLowerCase();
  for (const [pattern, icon] of KEYWORD_ICONS) {
    if (pattern.test(text)) return icon;
  }
  return BriefcaseIcon;
}

export const KENYA_COUNTIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Uasin Gishu",
  "Kiambu",
  "Machakos",
  "Kajiado",
  "Kilifi",
  "Nyeri",
  "Meru",
  "Kakamega",
  "Bungoma",
  "Kisii",
  "Trans Nzoia",
  "Other",
];
