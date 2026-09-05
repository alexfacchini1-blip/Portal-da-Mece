import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Bar3DData {
  name: string;
  Entradas: number;
  Saídas: number;
}

interface BarChart3DProps {
  data: Bar3DData[];
}

export const BarChart3D: React.FC<BarChart3DProps> = ({ data }) => {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Constants for dimensions (inside 720x240 SVG viewport)
  const svgWidth = 720;
  const svgHeight = 240;
  const paddingLeft = 85;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const yBase = svgHeight - paddingBottom; // Bottom of the chart bars
  const yTop = paddingTop; // Top of the chart area

  // Colors
  const blueColor = "#3b82f6"; // Entradas
  const redColor = "#ef4444";  // Saídas

  // Find max value for scaling and ticks
  const { maxValue, ticks } = useMemo(() => {
    let maxVal = Math.max(...data.map((d) => Math.max(d.Entradas, d.Saídas)), 100);
    
    // Round to a clean upper bound
    const log10 = Math.log10(maxVal);
    const powerOf10 = Math.pow(10, Math.floor(log10));
    let tickStep = powerOf10 / 2;
    
    if (maxVal / powerOf10 > 5) {
      tickStep = powerOf10;
    } else if (maxVal / powerOf10 <= 1.5) {
      tickStep = powerOf10 / 5;
    }
    
    const numTicks = 5;
    const roundedMax = Math.ceil(maxVal / (tickStep * (numTicks - 1))) * (tickStep * (numTicks - 1));
    const finalMax = roundedMax > 0 ? roundedMax : 100;
    
    const step = finalMax / (numTicks - 1);
    const generatedTicks = Array.from({ length: numTicks }, (_, i) => Math.round(step * i));

    return { maxValue: finalMax, ticks: generatedTicks };
  }, [data]);

  // Convert value to Y coordinate
  const getY = (value: number) => {
    const ratio = Math.min(Math.max(value, 0) / maxValue, 1);
    return yBase - ratio * chartHeight;
  };

  const monthWidth = chartWidth / 12;

  // 3D Extrusion offsets for the columns
  const depthX = 7;
  const depthY = -6;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      {/* Tooltip Overlay */}
      <AnimatePresence>
        {hoveredMonth !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-30 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800/80 backdrop-blur-md pointer-events-none text-xs flex flex-col gap-1.5"
            style={{
              top: `${paddingTop - 15}px`,
              left: `${Math.min(
                Math.max(
                  paddingLeft + hoveredMonth * monthWidth + monthWidth / 2 - 105,
                  10
                ),
                svgWidth - 220
              )}px`,
              width: "210px",
            }}
          >
            <p className="font-black border-b border-slate-800 pb-1 mb-1 text-slate-300 tracking-wider uppercase text-[10px]">
              {data[hoveredMonth].name}
            </p>
            <div className="flex justify-between items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold text-slate-400 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Entradas:
              </span>
              <span className="font-mono font-black text-blue-400 whitespace-nowrap">
                R$ {data[hoveredMonth].Entradas.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold text-slate-400 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Saídas:
              </span>
              <span className="font-mono font-black text-red-400 whitespace-nowrap">
                R$ {data[hoveredMonth].Saídas.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4 border-t border-slate-800/60 pt-1.5 mt-1 font-bold">
              <span className="text-slate-300 whitespace-nowrap">Saldo:</span>
              <span
                className={`font-mono font-black whitespace-nowrap ${
                  data[hoveredMonth].Entradas - data[hoveredMonth].Saídas >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                R$ {(
                  data[hoveredMonth].Entradas - data[hoveredMonth].Saídas
                ).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full max-h-[240px]"
        style={{ overflow: "visible" }}
      >
        {/* Ticks & Horizontal Grid lines */}
        <g>
          {ticks.map((tickVal, idx) => {
            const y = getY(tickVal);
            return (
              <g key={idx}>
                {/* Dashed line */}
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity={tickVal === 0 ? 1 : 0.6}
                />
                {/* Y-axis label */}
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  className="font-bold font-mono text-[11px]"
                >
                  {tickVal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </text>
              </g>
            );
          })}
        </g>

        {/* 3D Ground/Base shadow line */}
        <line
          x1={paddingLeft}
          y1={yBase}
          x2={svgWidth - paddingRight}
          y2={yBase}
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        {/* Render columns grouped by month */}
        {data.map((monthData, monthIdx) => {
          const centerX = paddingLeft + monthIdx * monthWidth + monthWidth / 2;
          const isMonthHovered = hoveredMonth === monthIdx;

          // Bar dimensions
          const barW = 15;
          const barGap = 4;

          // Entradas Bar (Blue) left side
          const xEntradas = centerX - barW - barGap / 2;
          const yEntradas = getY(monthData.Entradas);
          const hEntradas = Math.max(yBase - yEntradas, 1); // Minimum 1px so zero still renders flat

          // Saídas Bar (Red) right side
          const xSaidas = centerX + barGap / 2;
          const ySaidas = getY(monthData.Saídas);
          const hSaidas = Math.max(yBase - ySaidas, 1);

          return (
            <g
              key={monthIdx}
              onMouseEnter={() => setHoveredMonth(monthIdx)}
              onMouseLeave={() => setHoveredMonth(null)}
              className="cursor-pointer"
            >
              {/* Hover highlight background column */}
              <rect
                x={paddingLeft + monthIdx * monthWidth + 2}
                y={paddingTop - 10}
                width={monthWidth - 4}
                height={chartHeight + 15}
                fill={isMonthHovered ? "#3b82f6" : "transparent"}
                opacity={0.03}
                rx={8}
                className="transition-all duration-200"
              />

              {/* ENTRADAS 3D COLUMN */}
              {monthData.Entradas > 0 && (
                <g className="transition-all duration-300">
                  {/* Front Face */}
                  <rect
                    x={xEntradas}
                    y={yEntradas}
                    width={barW}
                    height={hEntradas}
                    fill={blueColor}
                    className="transition-all duration-300"
                  />
                  {/* Side Face (Right) */}
                  <path
                    d={`M ${xEntradas + barW} ${yEntradas} 
                       L ${xEntradas + barW + depthX} ${yEntradas + depthY} 
                       L ${xEntradas + barW + depthX} ${yBase + depthY} 
                       L ${xEntradas + barW} ${yBase} Z`}
                    fill={blueColor}
                    filter="brightness(0.8)"
                    className="transition-all duration-300"
                  />
                  {/* Top Face */}
                  <path
                    d={`M ${xEntradas} ${yEntradas} 
                       L ${xEntradas + depthX} ${yEntradas + depthY} 
                       L ${xEntradas + barW + depthX} ${yEntradas + depthY} 
                       L ${xEntradas + barW} ${yEntradas} Z`}
                    fill={blueColor}
                    filter="brightness(1.15)"
                    className="transition-all duration-300"
                  />
                </g>
              )}

              {/* SAÍDAS 3D COLUMN */}
              {monthData.Saídas > 0 && (
                <g className="transition-all duration-300">
                  {/* Front Face */}
                  <rect
                    x={xSaidas}
                    y={ySaidas}
                    width={barW}
                    height={hSaidas}
                    fill={redColor}
                    className="transition-all duration-300"
                  />
                  {/* Side Face (Right) */}
                  <path
                    d={`M ${xSaidas + barW} ${ySaidas} 
                       L ${xSaidas + barW + depthX} ${ySaidas + depthY} 
                       L ${xSaidas + barW + depthX} ${yBase + depthY} 
                       L ${xSaidas + barW} ${yBase} Z`}
                    fill={redColor}
                    filter="brightness(0.8)"
                    className="transition-all duration-300"
                  />
                  {/* Top Face */}
                  <path
                    d={`M ${xSaidas} ${ySaidas} 
                       L ${xSaidas + depthX} ${ySaidas + depthY} 
                       L ${xSaidas + barW + depthX} ${ySaidas + depthY} 
                       L ${xSaidas + barW} ${ySaidas} Z`}
                    fill={redColor}
                    filter="brightness(1.15)"
                    className="transition-all duration-300"
                  />
                </g>
              )}

              {/* X Axis Label */}
              <text
                x={centerX}
                y={yBase + 24}
                textAnchor="middle"
                fill={isMonthHovered ? "#1e293b" : "#64748b"}
                className={`font-black transition-colors duration-200 text-[11px] uppercase`}
              >
                {monthData.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating interactive hint */}
      <div className="absolute bottom-1 right-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        Passe o mouse para detalhar valores
      </div>
    </div>
  );
};
