import React, { useState, useMemo } from "react";

interface Pie3DData {
  name: string;
  value: number;
  color: string;
}

interface PieChart3DProps {
  data: Pie3DData[];
}

export const PieChart3D: React.FC<PieChart3DProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter out non-positive values
  const activeData = useMemo(() => {
    return data.filter((item) => item.value > 0);
  }, [data]);

  const total = useMemo(() => {
    return activeData.reduce((sum, item) => sum + item.value, 0);
  }, [activeData]);

  // Center & Radius configuration inside SVG viewBox="0 0 280 200"
  const cx = 140;
  const cy = 90;
  const rx = 85;
  const ry = 48;
  const h = 20; // Height/thickness for 3D extrusion

  // Generate slice structures
  const slices = useMemo(() => {
    if (total === 0) return [];

    let currentAngle = -Math.PI / 2; // Start from top (-90 degrees)

    return activeData.map((item, index) => {
      const angleSpan = (item.value / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      currentAngle = endAngle;

      const bisector = (startAngle + endAngle) / 2;

      // Center offset coordinate for isometric translation
      const dx = Math.cos(bisector);
      const dy = Math.sin(bisector) * (ry / rx);

      return {
        item,
        index,
        startAngle,
        endAngle,
        angleSpan,
        bisector,
        dx,
        dy,
      };
    });
  }, [activeData, total, rx, ry]);

  // Painter's Algorithm: Sort slices to render from back to front.
  // In our coordinate system, Y points down. So slices whose center is higher (smaller Y, back of the pie)
  // must be rendered FIRST. Slices whose center is lower (larger Y, front of the pie) must be rendered LAST.
  // Average Y is represented by sin(bisector).
  const sortedSlices = useMemo(() => {
    return [...slices].sort((a, b) => {
      const sinA = Math.sin(a.bisector);
      const sinB = Math.sin(b.bisector);
      return sinA - sinB;
    });
  }, [slices]);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full py-10">
        <p className="text-slate-400 text-xs font-bold uppercase">
          Sem lançamentos para o período informado
        </p>
      </div>
    );
  }

  // Handle single slice case (>99.9% of total) for perfect continuous rendering
  const isSingleSlice = activeData.length === 1;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none">
      <svg
        viewBox="0 0 280 200"
        className="w-full h-full max-h-[220px]"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Subtle drop shadow under the entire 3D pie chart */}
          <filter id="pie3DShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.15" />
          </filter>
        </defs>

        <g filter="url(#pie3DShadow)">
          {isSingleSlice ? (
            // Perfect 3D Cylinder for a single full slice
            (() => {
              const item = activeData[0];
              const isHovered = hoveredIndex === 0;
              const transformStyle = {
                transform: isHovered ? "translateY(-4px)" : "translateY(0px)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
              };

              return (
                <g
                  onMouseEnter={() => setHoveredIndex(0)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={transformStyle}
                >
                  {/* Bottom rim shadow / depth */}
                  <ellipse cx={cx} cy={cy + h} rx={rx} ry={ry} fill={item.color} />
                  <ellipse cx={cx} cy={cy + h} rx={rx} ry={ry} fill="black" opacity={0.25} />

                  {/* Cylinder Front Wall */}
                  <path
                    d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy} L ${cx + rx} ${cy + h} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy + h} Z`}
                    fill={item.color}
                  />
                  <path
                    d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy} L ${cx + rx} ${cy + h} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy + h} Z`}
                    fill="black"
                    opacity={0.15}
                  />

                  {/* Top Face */}
                  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={item.color} />
                  {isHovered && <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="white" opacity={0.1} />}
                </g>
              );
            })()
          ) : (
            // Render sorted multi-slices
            sortedSlices.map(({ item, index, startAngle, endAngle, bisector, dx, dy }) => {
              const isHovered = hoveredIndex === index;
              const explodeDistance = isHovered ? 12 : 3;
              const tx = dx * explodeDistance;
              const ty = dy * explodeDistance;

              // Top face endpoints
              const xStart = cx + rx * Math.cos(startAngle);
              const yStart = cy + ry * Math.sin(startAngle);
              const xEnd = cx + rx * Math.cos(endAngle);
              const yEnd = cy + ry * Math.sin(endAngle);

              const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

              // Paths
              // 1. Flat Wall at startAngle (from center to startAngle)
              const wall1Path = `M ${cx} ${cy} L ${xStart} ${yStart} L ${xStart} ${yStart + h} L ${cx} ${cy + h} Z`;

              // 2. Flat Wall at endAngle (from center to endAngle)
              const wall2Path = `M ${cx} ${cy} L ${xEnd} ${yEnd} L ${xEnd} ${yEnd + h} L ${cx} ${cy + h} Z`;

              // 3. Outer Curved extrusion Wall
              const outerWallPath = `M ${xStart} ${yStart} A ${rx} ${ry} 0 ${largeArcFlag} 1 ${xEnd} ${yEnd} L ${xEnd} ${yEnd + h} A ${rx} ${ry} 0 ${largeArcFlag} 0 ${xStart} ${yStart + h} Z`;

              // 4. Top surface
              const topFacePath = `M ${cx} ${cy} L ${xStart} ${yStart} A ${rx} ${ry} 0 ${largeArcFlag} 1 ${xEnd} ${yEnd} Z`;

              // Shading parameters
              // Standard shading uses black overlay with opacities
              // We adjust wall shading dynamically for realistic lighting (light from top-left-front)
              const cosBis = Math.cos(bisector);
              const sinBis = Math.sin(bisector);
              
              // Outer wall shading: darker towards the back-right, lighter on the front-left
              const outerShadowOpacity = 0.15 + (cosBis * 0.1) + (sinBis * -0.05);

              // Flat Wall 1 shading
              const wall1ShadowOpacity = Math.max(0.05, 0.2 + Math.cos(startAngle) * -0.15);

              // Flat Wall 2 shading
              const wall2ShadowOpacity = Math.max(0.05, 0.25 + Math.cos(endAngle) * 0.15);

              const groupStyle = {
                transform: `translate(${tx}px, ${ty}px)`,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
              };

              return (
                <g
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={groupStyle}
                >
                  {/* Flat Wall 1 */}
                  <path d={wall1Path} fill={item.color} />
                  <path d={wall1Path} fill="black" opacity={wall1ShadowOpacity} />

                  {/* Flat Wall 2 */}
                  <path d={wall2Path} fill={item.color} />
                  <path d={wall2Path} fill="black" opacity={wall2ShadowOpacity} />

                  {/* Outer Curved Wall */}
                  <path d={outerWallPath} fill={item.color} />
                  <path d={outerWallPath} fill="black" opacity={Math.max(0.05, outerShadowOpacity)} />

                  {/* Top Face */}
                  <path d={topFacePath} fill={item.color} />
                  {isHovered && <path d={topFacePath} fill="white" opacity={0.15} />}
                </g>
              );
            })
          )}
        </g>
      </svg>

      {/* Floating Center / Interactive Description on Hover */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        {hoveredIndex !== null && (
          <div className="bg-slate-900/90 text-white px-3 py-1.5 rounded-full text-[11px] font-black shadow-lg border border-slate-700/50 backdrop-blur-sm transform transition-all duration-300 translate-y-3 whitespace-nowrap">
            <span className="opacity-80 font-normal mr-1">{activeData[hoveredIndex].name}:</span>
            R$ {activeData[hoveredIndex].value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
      </div>
    </div>
  );
};
