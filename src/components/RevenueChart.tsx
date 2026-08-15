"use client";

import { useState } from "react";
import { TableCellsIcon, ChartBarIcon } from "@heroicons/react/24/outline";

type WeekPoint = { label: string; amountKes: number };

const WIDTH = 320;
const HEIGHT = 170;
const PAD_TOP = 26;
const PAD_BOTTOM = 22;
const PAD_X = 6;
const RADIUS = 4;

function roundedTopRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, h, w / 2);
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

export default function RevenueChart({ series }: { series: WeekPoint[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const max = Math.max(1, ...series.map((p) => p.amountKes)) * 1.2;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const innerWidth = WIDTH - PAD_X * 2;
  const slot = innerWidth / series.length;
  const barWidth = slot * 0.5;

  const peakIndex = series.reduce(
    (best, p, i) => (p.amountKes > series[best].amountKes ? i : best),
    0
  );
  const gridValues = [0, 0.5, 1];

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wide">Last 8 weeks</p>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-label={showTable ? "Show chart view" : "Show table view"}
          className="flex items-center justify-center w-7 h-7 rounded-full text-neutral-500 active:scale-90 active:bg-neutral-800 transition"
        >
          {showTable ? <ChartBarIcon className="w-4 h-4" strokeWidth={1.75} /> : <TableCellsIcon className="w-4 h-4" strokeWidth={1.75} />}
        </button>
      </div>

      {showTable ? (
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="text-left text-neutral-500 text-xs">
              <th className="font-medium py-1">Week of</th>
              <th className="font-medium py-1 text-right">Earned</th>
            </tr>
          </thead>
          <tbody>
            {series.map((p, i) => (
              <tr key={i} className="border-t border-neutral-800">
                <td className="py-1.5 text-neutral-300">{p.label}</td>
                <td className="py-1.5 text-right text-white font-medium tabular-nums">
                  KES {p.amountKes.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label="Weekly earnings, last 8 weeks">
            {gridValues.map((g) => {
              const y = PAD_TOP + innerHeight * (1 - g);
              return (
                <line
                  key={g}
                  x1={PAD_X}
                  x2={WIDTH - PAD_X}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className={g === 0 ? "text-neutral-700" : "text-neutral-800"}
                  strokeWidth={1}
                />
              );
            })}

            {series.map((p, i) => {
              const barHeight = (p.amountKes / max) * innerHeight;
              const x = PAD_X + slot * i + (slot - barWidth) / 2;
              const y = PAD_TOP + innerHeight - barHeight;
              const isSelected = selected === i;
              const isPeak = i === peakIndex && p.amountKes > 0;
              return (
                <g key={i}>
                  {isPeak && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 8}
                      textAnchor="middle"
                      className="fill-neutral-300"
                      fontSize={10}
                      fontWeight={600}
                    >
                      {p.amountKes.toLocaleString()}
                    </text>
                  )}
                  <path
                    d={roundedTopRectPath(x, y, barWidth, Math.max(barHeight, 1), RADIUS)}
                    className={isSelected || isPeak ? "fill-brand-bright" : "fill-brand"}
                    opacity={isSelected || isPeak ? 1 : 0.75}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={HEIGHT - 6}
                    textAnchor="middle"
                    className="fill-neutral-500"
                    fontSize={9}
                  >
                    {p.label}
                  </text>
                  <rect
                    x={PAD_X + slot * i}
                    y={PAD_TOP}
                    width={slot}
                    height={innerHeight}
                    fill="transparent"
                    onClick={() => setSelected((cur) => (cur === i ? null : i))}
                    className="cursor-pointer"
                  />
                </g>
              );
            })}
          </svg>

          {selected !== null && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white shadow-lg pointer-events-none">
              <span className="text-neutral-400">{series[selected].label}: </span>
              <span className="font-semibold tabular-nums">KES {series[selected].amountKes.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
