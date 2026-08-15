import type { ComponentType, SVGProps } from "react";
import {
  AcademicCapIcon,
  BoltIcon,
  BriefcaseIcon,
  CameraIcon,
  Cog6ToothIcon,
  CodeBracketIcon,
  CubeIcon,
  EyeDropperIcon,
  FireIcon,
  HandRaisedIcon,
  HomeModernIcon,
  LightBulbIcon,
  PaintBrushIcon,
  ScissorsIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  SunIcon,
  TruckIcon,
  UserGroupIcon,
  WrenchIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

function MotorbikeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="18.5" cy="17.5" r="2.5" />
      <path d="M5.5 17.5h4l2.5-5h4.5M12 12.5l2 5h2.5M9 12.5H6.5L4 15" />
      <path d="M14 7.5h3l1.5 2.5" />
      <circle cx="14.5" cy="6.5" r="1" />
    </svg>
  );
}

function LaundryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <circle cx="12" cy="13" r="5" />
      <circle cx="12" cy="13" r="2" />
      <circle cx="6.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

const FLIGHTS = ["fly-a", "fly-b", "fly-c", "fly-d", "fly-e", "fly-f"];

const ICONS: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  top: string;
  left: string;
  size: string;
  color: string;
  flight: string;
  duration: string;
  delay: string;
}[] = [
  { Icon: WrenchIcon, top: "6%", left: "12%", size: "w-9 h-9", color: "text-white/[0.14]", flight: FLIGHTS[0], duration: "22s", delay: "0s" },
  { Icon: ScissorsIcon, top: "13%", left: "78%", size: "w-8 h-8", color: "text-brand/[0.20]", flight: FLIGHTS[1], duration: "26s", delay: "1s" },
  { Icon: BoltIcon, top: "22%", left: "6%", size: "w-7 h-7", color: "text-brand-bright/[0.22]", flight: FLIGHTS[2], duration: "19s", delay: "2s" },
  { Icon: PaintBrushIcon, top: "4%", left: "45%", size: "w-8 h-8", color: "text-white/[0.13]", flight: FLIGHTS[3], duration: "24s", delay: "0.5s" },
  { Icon: TruckIcon, top: "30%", left: "85%", size: "w-10 h-10", color: "text-white/[0.12]", flight: FLIGHTS[4], duration: "28s", delay: "3s" },
  { Icon: CameraIcon, top: "38%", left: "18%", size: "w-7 h-7", color: "text-brand/[0.20]", flight: FLIGHTS[5], duration: "21s", delay: "1.5s" },
  { Icon: ShieldCheckIcon, top: "46%", left: "70%", size: "w-9 h-9", color: "text-white/[0.14]", flight: FLIGHTS[0], duration: "25s", delay: "4s" },
  { Icon: HomeModernIcon, top: "53%", left: "8%", size: "w-9 h-9", color: "text-brand-bright/[0.18]", flight: FLIGHTS[1], duration: "23s", delay: "2.5s" },
  { Icon: Cog6ToothIcon, top: "17%", left: "32%", size: "w-6 h-6", color: "text-white/[0.12]", flight: FLIGHTS[2], duration: "18s", delay: "0.8s" },
  { Icon: SparklesIcon, top: "61%", left: "40%", size: "w-7 h-7", color: "text-brand/[0.22]", flight: FLIGHTS[3], duration: "20s", delay: "3.5s" },
  { Icon: AcademicCapIcon, top: "68%", left: "78%", size: "w-8 h-8", color: "text-white/[0.13]", flight: FLIGHTS[4], duration: "27s", delay: "1.2s" },
  { Icon: HandRaisedIcon, top: "9%", left: "62%", size: "w-7 h-7", color: "text-white/[0.12]", flight: FLIGHTS[5], duration: "22s", delay: "2.8s" },
  { Icon: BriefcaseIcon, top: "92%", left: "20%", size: "w-8 h-8", color: "text-brand-bright/[0.20]", flight: FLIGHTS[0], duration: "24s", delay: "4.5s" },
  { Icon: UserGroupIcon, top: "42%", left: "50%", size: "w-8 h-8", color: "text-white/[0.10]", flight: FLIGHTS[1], duration: "26s", delay: "1.8s" },
  { Icon: WrenchScrewdriverIcon, top: "58%", left: "28%", size: "w-9 h-9", color: "text-brand/[0.18]", flight: FLIGHTS[2], duration: "20s", delay: "3.2s" },
  { Icon: MotorbikeIcon, top: "25%", left: "58%", size: "w-10 h-10", color: "text-white/[0.15]", flight: FLIGHTS[3], duration: "21s", delay: "0.3s" },
  { Icon: MotorbikeIcon, top: "75%", left: "62%", size: "w-9 h-9", color: "text-brand/[0.18]", flight: FLIGHTS[5], duration: "25s", delay: "2.2s" },
  { Icon: CodeBracketIcon, top: "12%", left: "20%", size: "w-8 h-8", color: "text-white/[0.13]", flight: FLIGHTS[4], duration: "23s", delay: "3.8s" },
  { Icon: LaundryIcon, top: "34%", left: "38%", size: "w-9 h-9", color: "text-brand-bright/[0.18]", flight: FLIGHTS[0], duration: "26s", delay: "1.6s" },
  { Icon: LaundryIcon, top: "83%", left: "45%", size: "w-8 h-8", color: "text-white/[0.12]", flight: FLIGHTS[2], duration: "22s", delay: "4.2s" },
  { Icon: EyeDropperIcon, top: "64%", left: "88%", size: "w-7 h-7", color: "text-brand/[0.20]", flight: FLIGHTS[1], duration: "19s", delay: "0.9s" },
  { Icon: LightBulbIcon, top: "3%", left: "88%", size: "w-7 h-7", color: "text-brand-bright/[0.20]", flight: FLIGHTS[3], duration: "24s", delay: "2.6s" },
  { Icon: SunIcon, top: "70%", left: "5%", size: "w-8 h-8", color: "text-white/[0.13]", flight: FLIGHTS[4], duration: "27s", delay: "1.1s" },
  { Icon: FireIcon, top: "88%", left: "68%", size: "w-8 h-8", color: "text-brand-bright/[0.19]", flight: FLIGHTS[5], duration: "20s", delay: "3.9s" },
  { Icon: ShoppingBagIcon, top: "48%", left: "3%", size: "w-8 h-8", color: "text-white/[0.13]", flight: FLIGHTS[0], duration: "23s", delay: "4.8s" },
  { Icon: CubeIcon, top: "80%", left: "85%", size: "w-8 h-8", color: "text-brand/[0.17]", flight: FLIGHTS[2], duration: "25s", delay: "1.4s" },
];

export default function JobTitlesBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {ICONS.map(({ Icon, top, left, size, color, flight, duration, delay }, i) => (
        <Icon
          key={i}
          className={`flying-icon ${size} ${color}`}
          style={{
            top,
            left,
            animationName: flight,
            animationDuration: duration,
            animationDelay: delay,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
          }}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}
