/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type CategoryItem = {
  name: string;
  value: number;
  count?: number;
};

export default function PasienChart({ apiData }: { apiData: CategoryItem[] }) {
  const COLORS = ["#38A3A5", "#4ADE80", "#FFB703", "#F472B6", "#F4A261"];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasData = apiData && apiData.length > 0;
  const chartData = hasData
    ? apiData.map((item) => ({
        name: item.name,
        value: item.count || 0,
        percentage: item.value,
      }))
    : [];
  const dataToUse = hasData
    ? chartData
    : [{ name: "Tidak ada data", value: 100, percentage: 100 }];

  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, payload } = props;
    if (!payload?.percentage || payload.percentage === 0) return null;

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const radians = Math.PI / 180;
    const x = cx + radius * Math.cos(-midAngle * radians);
    const y = cy + radius * Math.sin(-midAngle * radians);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight="bold"
        style={{ pointerEvents: "none" }}
      >
        {`${Number(payload.percentage).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="text-[#1E5C58]">
      <div className="mb-4">
        <h3 className="text-lg font-bold">Kategori Pasien</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          Distribusi jenis terapi pasien aktif
        </p>
      </div>

      <div className="relative flex flex-col items-center justify-center rounded-2xl border border-gray-100/50 bg-gray-50/50 p-4">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataToUse}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={50}
                paddingAngle={hasData ? 4 : 0}
                stroke="none"
                label={hasData ? renderLabel : false}
                labelLine={false}
              >
                {dataToUse.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={hasData ? COLORS[index % COLORS.length] : "#E2E8F0"}
                    className="outline-none"
                    style={{
                      opacity:
                        activeIndex === null || activeIndex === index ? 1 : 0.6,
                      transform:
                        activeIndex === index ? "scale(1.05)" : "scale(1)",
                      transformOrigin: "center",
                      transition: "all 150ms ease",
                    }}
                  />
                ))}
              </Pie>

              {hasData && (
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px -5px rgba(0,0,0,0.1)",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#1E5C58" }}
                  formatter={(value: any, name: any, props: any) => [
                    `${value} pasien (${props?.payload?.percentage ?? 0}%)`,
                    name,
                  ]}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-3 px-2">
        {hasData ? (
          apiData.map((entry, index) => (
            <div
              key={entry.name}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() =>
                setActiveIndex(activeIndex === index ? null : index)
              }
              className={`group flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-all duration-150 ${
                activeIndex === index
                  ? "translate-x-1 bg-teal-50 shadow-sm"
                  : "hover:bg-teal-50/50"
              }`}
            >
              <div
                className={`h-3.5 w-3.5 shrink-0 rounded-full shadow-sm transition-all duration-150 ${
                  activeIndex === index ? "scale-150" : "group-hover:scale-125"
                }`}
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="flex min-w-0 flex-col text-left">
                <span className="line-clamp-1 text-xs font-bold leading-tight text-gray-700">
                  {entry.name}
                </span>
                <span className="text-[10px] font-semibold uppercase text-gray-400">
                  {entry.value}% ({entry.count || 0} Anak)
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-2 text-center text-xs text-gray-400">
            Belum ada data kategori pasien
          </div>
        )}
      </div>
    </div>
  );
}
