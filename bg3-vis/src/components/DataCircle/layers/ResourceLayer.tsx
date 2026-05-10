import { RESOURCE_SECTORS } from "../dataCircleConfig";
import { CX, CY, getOpacity, polarToCartesian } from "../dataCircleGeometry";
import type { ResourceSectorKey } from "../dataCircleTypes";

type ResourceLayerProps = {
  resourceCounts: Record<ResourceSectorKey, number>;
  maxResourceCount: number;
};

export function ResourceLayer({
  resourceCounts,
  maxResourceCount,
}: ResourceLayerProps) {
  return (
    <>
      {RESOURCE_SECTORS.map((sector, index) => {
        const sectorAngle = 360 / RESOURCE_SECTORS.length;
        const angle = -180 + index * sectorAngle + sectorAngle / 2;
        const value = resourceCounts[sector.key];
        const ratio = value <= 0 ? 0 : value / maxResourceCount;
        const height = value <= 0 ? 17 : 24 + ratio * 66;
        const width = 18;
        const baseRadius = 382;
        const center = polarToCartesian(CX, CY, baseRadius + height / 2, angle);
        const capOpacity = value <= 0 ? 0.16 : 0.44 + ratio * 0.34;

        return (
          <g
            key={sector.key}
            transform={`translate(${center.x} ${center.y}) rotate(${angle})`}
          >
            <rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              rx="4"
              fill="rgba(16,12,13,0.88)"
              stroke="rgba(219,178,105,0.25)"
              strokeWidth="1"
            />

            <rect
              x={-width / 2 + 2}
              y={-height / 2 + 2}
              width={width - 4}
              height={height - 4}
              rx="3"
              fill={sector.color}
              fillOpacity={getOpacity(value, maxResourceCount, 0.12, 0.72)}
            />

            <rect
              x={-width / 2 + 2}
              y={-height / 2 + 2}
              width={width - 4}
              height={Math.max(4, height * 0.16)}
              rx="3"
              fill="rgba(255,226,165,0.52)"
              fillOpacity={capOpacity}
            />
          </g>
        );
      })}
    </>
  );
}
