import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../lib/i18n';

export function TrendBarChart({ title, rows = [] }) {
  const { theme } = useLanguage();
  const [hovered, setHovered] = useState(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width || 400);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const textColor = theme === 'dark' ? '#E4DDD2' : '#3C3832';
  const barColor = theme === 'dark' ? '#E0A07A' : '#8C3E22';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  const isSmall = width < 440;
  const isExtraSmall = width < 360;

  const maxVal = Math.max(1, ...rows.map(r => r.n || 0));
  const tickCount = isSmall ? 3 : Math.min(5, maxVal);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((maxVal / tickCount) * i));
  const uniqueTicks = [...new Set(ticks)];

  const marginLeft = isExtraSmall ? 75 : isSmall ? 95 : 135;
  const marginRight = 16;
  const marginTop = 12;
  const marginBottom = 28;
  const chartHeight = 224; // h-56 = 14rem = 224px
  const plotWidth = Math.max(10, width - marginLeft - marginRight);
  const plotHeight = chartHeight - marginTop - marginBottom;

  const barCount = rows.length || 1;
  const slotHeight = plotHeight / barCount;
  const barHeight = Math.min(14, slotHeight * 0.7);

  const maxLabelLength = isExtraSmall ? 9 : isSmall ? 13 : 20;

  return (
    <section className="rounded-md border border-card-border bg-card p-3 sm:p-4 shadow-xs">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div ref={containerRef} className="relative h-56 w-full" dir="ltr">
        <svg width="100%" height={chartHeight} className="overflow-visible select-none">
          {/* Vertical grid lines */}
          {uniqueTicks.map(t => {
            const x = marginLeft + (t / maxVal) * plotWidth;
            return (
              <g key={`grid-${t}`}>
                <line
                  x1={x}
                  y1={marginTop}
                  x2={x}
                  y2={marginTop + plotHeight}
                  stroke={gridColor}
                  strokeDasharray="2,2"
                />
                <text
                  x={x}
                  y={marginTop + plotHeight + 16}
                  textAnchor="middle"
                  fontSize={isSmall ? "10" : "12"}
                  fill={textColor}
                  className="num font-mono"
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* Bottom X-axis baseline */}
          <line
            x1={marginLeft}
            y1={marginTop + plotHeight}
            x2={marginLeft + plotWidth}
            y2={marginTop + plotHeight}
            stroke={gridColor}
          />

          {/* Left Y-axis baseline */}
          <line
            x1={marginLeft}
            y1={marginTop}
            x2={marginLeft}
            y2={marginTop + plotHeight}
            stroke={gridColor}
          />

          {/* Rows & Bars */}
          {rows.map((row, idx) => {
            const y = marginTop + idx * slotHeight + (slotHeight - barHeight) / 2;
            const barW = ((row.n || 0) / maxVal) * plotWidth;
            const isHover = hovered === idx;
            const label = row.name.length > maxLabelLength ? row.name.slice(0, maxLabelLength - 1) + '…' : row.name;

            return (
              <g
                key={`bar-${row.name}-${idx}`}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer transition-opacity"
              >
                {/* Category label */}
                <text
                  x={marginLeft - 6}
                  y={y + barHeight / 2 + 4}
                  textAnchor="end"
                  fontSize={isSmall ? "11" : "12"}
                  fill={textColor}
                  className="font-medium"
                >
                  {label}
                </text>

                {/* Row hover highlight */}
                {isHover && (
                  <rect
                    x={marginLeft}
                    y={marginTop + idx * slotHeight}
                    width={plotWidth}
                    height={slotHeight}
                    fill={theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
                  />
                )}

                {/* The bar */}
                <rect
                  x={marginLeft}
                  y={y}
                  width={Math.max(barW, 2)}
                  height={barHeight}
                  fill={barColor}
                  rx="3"
                  ry="3"
                  className="transition-all duration-300"
                  opacity={hovered !== null && !isHover ? 0.6 : 1}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating tooltip on hover */}
        {hovered !== null && rows[hovered] && (
          <div
            className="pointer-events-none absolute z-20 rounded-md border border-border bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md transition-all whitespace-nowrap"
            style={{
              left: `${Math.min(
                marginLeft + ((rows[hovered].n || 0) / maxVal) * plotWidth + 8,
                Math.max(0, width - 110)
              )}px`,
              top: `${Math.max(
                0,
                marginTop + hovered * slotHeight - 12
              )}px`
            }}
          >
            <div className="font-semibold">{rows[hovered].name}</div>
            <div className="text-muted-foreground num">
              {rows[hovered].n}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
