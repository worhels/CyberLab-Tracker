import { WorkloadHotspotPoint } from './WorkloadHotspotPoint'
import type { WorkloadHotspotPalette } from './WorkloadHotspotPoint'
import type { WorkloadHotspot } from './workloadHotspotData'

interface WorkloadHotspotsProps {
  hotspots: WorkloadHotspot[]
  hoveredHotspotId: number | null
  selectedHotspotId: number | null
  palette: WorkloadHotspotPalette
  onHover: (id: number | null) => void
  onSelect: (id: number) => void
}

export function WorkloadHotspots({
  hotspots,
  hoveredHotspotId,
  selectedHotspotId,
  palette,
  onHover,
  onSelect,
}: WorkloadHotspotsProps) {
  return (
    <group>
      {hotspots.map((hotspot) => (
        <WorkloadHotspotPoint
          key={hotspot.id}
          hotspot={hotspot}
          isHovered={hoveredHotspotId === hotspot.id}
          isSelected={selectedHotspotId === hotspot.id}
          palette={palette}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}
