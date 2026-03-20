import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import { useTheme } from 'next-themes';
import instance from '../api/api';
import { riskToneClass } from '@/lib/presentation';

interface ReportMarker {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  projectName?: string;
  projectDescription?: string;
  images?: string[];
  riskLevel?: 'Low' | 'Medium' | 'High';
  insight?: string;
  confidenceScore?: number;
}

interface StaticMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  projectName?: string;
  projectDescription?: string;
  images?: string[];
  riskLevel?: 'Low' | 'Medium' | 'High';
  insight?: string;
  confidenceScore?: number;
}

interface GISDataProps {
  projectId?: string;
  staticMarkers?: StaticMarker[];
}

const DEFAULT_CENTER: [number, number] = [77.209, 28.6139];

const readThemeColor = (variableName: string, alpha?: number) => {
  if (typeof window === 'undefined') return alpha === undefined ? 'currentColor' : 'transparent';
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  if (!value) return alpha === undefined ? 'currentColor' : 'transparent';
  return alpha === undefined ? `hsl(${value})` : `hsl(${value} / ${alpha})`;
};

const GISData: React.FC<GISDataProps> = ({ projectId, staticMarkers }) => {
  const { resolvedTheme } = useTheme();
  const mapElement = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<ReportMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredData, setHoveredData] = useState<ReportMarker | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const shouldFetchReports = Boolean(projectId) || (staticMarkers ?? []).length === 0;
    if (!shouldFetchReports) {
      setMarkers([]);
      setLoading(false);
      return;
    }

    const url = projectId ? `/progress-reports/project/${projectId}` : '/progress-reports/all';
    setLoading(true);
    instance
      .get(url)
      .then((response) => {
        const reports = response.data?.data?.reports ?? [];
        const mapped: ReportMarker[] = reports
          .filter((report: any) => report.gpsCoordinates?.latitude && report.gpsCoordinates?.longitude)
          .map((report: any) => ({
            id: report._id,
            latitude: report.gpsCoordinates.latitude,
            longitude: report.gpsCoordinates.longitude,
            description: report.description,
            projectName: report.projectName,
            projectDescription: report.projectDescription,
            images: report.images,
          }));
        setMarkers(mapped);
      })
      .catch(() => {
        setMarkers([]);
      })
      .finally(() => setLoading(false));
  }, [projectId, staticMarkers]);

  const allMarkers = useMemo<ReportMarker[]>(() => {
    const shouldUseStaticMarkers = (staticMarkers ?? []).length > 0 && !projectId;
    if (shouldUseStaticMarkers) {
      return (staticMarkers ?? []).map((marker) => ({
        id: marker.id,
        latitude: marker.latitude,
        longitude: marker.longitude,
        description: marker.description ?? marker.name,
        projectName: marker.projectName ?? marker.name,
        projectDescription: marker.projectDescription ?? marker.description,
        images: marker.images,
        riskLevel: marker.riskLevel,
        insight: marker.insight,
        confidenceScore: marker.confidenceScore,
      }));
    }

    return markers;
  }, [markers, projectId, staticMarkers]);

  useEffect(() => {
    if (!mapElement.current) return;

    const primaryColor = readThemeColor('--primary');
    const warningColor = readThemeColor('--status-warning');
    const successColor = readThemeColor('--status-success');
    const dangerColor = readThemeColor('--status-danger');
    const foregroundColor = readThemeColor('--foreground');
    const backgroundColor = readThemeColor('--background', 0.92);

    const features = allMarkers.map((marker) => {
      return new Feature({
        geometry: new Point(fromLonLat([marker.longitude, marker.latitude])),
        data: marker,
        name: marker.projectName || marker.description,
      });
    });

    const vectorSource = new VectorSource({ features });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        const data = feature.get('data') as ReportMarker;
        const risk = (data.riskLevel ?? '').toLowerCase();

        let markerColor = primaryColor;
        if (risk === 'high') markerColor = dangerColor;
        if (risk === 'medium') markerColor = warningColor;
        if (risk === 'low') markerColor = successColor;

        const label = (feature.get('name') ?? '').toString();
        const shortLabel = label.length > 18 ? `${label.slice(0, 18)}...` : label;

        return new Style({
          image: new CircleStyle({
            radius: data.riskLevel ? 10 : 8,
            fill: new Fill({ color: markerColor }),
            stroke: new Stroke({ color: backgroundColor, width: 2 }),
          }),
          text: new Text({
            text: shortLabel,
            offsetY: -20,
            fill: new Fill({ color: foregroundColor }),
            backgroundFill: new Fill({ color: backgroundColor }),
            padding: [3, 6, 3, 6],
            font: '600 11px Manrope, sans-serif',
          }),
        });
      },
    });

    const map = new Map({
      target: mapElement.current,
      layers: [new TileLayer({ source: new OSM() }), vectorLayer],
      view: new View({
        center:
          allMarkers.length > 0
            ? fromLonLat([allMarkers[0].longitude, allMarkers[0].latitude])
            : fromLonLat(DEFAULT_CENTER),
        zoom: allMarkers.length > 0 ? 10 : 4,
      }),
    });

    map.on('pointermove', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (item) => item);
      if (!feature) {
        setHoveredData(null);
        setPopupPosition(null);
        map.getTargetElement().style.cursor = '';
        return;
      }

      const data = feature.get('data') as ReportMarker;
      setHoveredData(data);
      setPopupPosition({ x: event.pixel[0], y: event.pixel[1] });
      map.getTargetElement().style.cursor = 'pointer';
    });

    const handleMouseLeave = () => {
      setHoveredData(null);
      setPopupPosition(null);
      map.getTargetElement().style.cursor = '';
    };

    map.getViewport().addEventListener('mouseleave', handleMouseLeave);

    return () => {
      map.getViewport().removeEventListener('mouseleave', handleMouseLeave);
      map.setTarget(undefined);
    };
  }, [allMarkers, resolvedTheme]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[inherit] bg-muted/30">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/75 backdrop-blur-sm">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      )}

      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
        <span className="font-medium text-foreground">{allMarkers.length}</span>
        mapped locations
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex flex-wrap gap-2">
        {(['Low', 'Medium', 'High'] as const).map((level) => (
          <span
            key={level}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] backdrop-blur-sm ${riskToneClass(level)}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {level}
          </span>
        ))}
      </div>

      <div ref={mapElement} className="h-full min-h-[320px] w-full" />

      {hoveredData && popupPosition && (
        <div
          className="pointer-events-none absolute z-30 w-80 max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-[calc(100%+1rem)]"
          style={{ left: popupPosition.x, top: popupPosition.y }}
        >
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl">
            <div className="flex">
              <div className="min-w-0 flex-1 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {hoveredData.projectName || 'Project'}
                </p>
                <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-foreground">
                  {hoveredData.description}
                </h3>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                  {hoveredData.insight || hoveredData.projectDescription || 'No additional context is available for this location yet.'}
                </p>
                {hoveredData.riskLevel && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${riskToneClass(hoveredData.riskLevel)}`}>
                      {hoveredData.riskLevel} risk
                    </span>
                    {hoveredData.confidenceScore !== undefined && (
                      <span className="text-[11px] text-muted-foreground">
                        {Math.round(hoveredData.confidenceScore * 100)}% confidence
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="h-28 w-28 shrink-0 border-l border-border/70 bg-muted/30">
                {hoveredData.images?.[0] ? (
                  <img
                    src={hoveredData.images[0]}
                    alt={hoveredData.projectName || 'Location preview'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-3 text-center text-[11px] text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/70 bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
              <span>
                Lat {hoveredData.latitude.toFixed(4)}, Lng {hoveredData.longitude.toFixed(4)}
              </span>
              <span className="font-medium text-foreground">Mapped update</span>
            </div>
          </div>
        </div>
      )}

      {allMarkers.length === 0 && !loading && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border/80 bg-card/90 px-4 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
          No project coordinates are available yet.
        </div>
      )}
    </div>
  );
};

export default GISData;
