import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { ArrowLeft, MapPinned } from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePublicPortal } from '@/hooks/usePublicPortal';
import { formatCurrency } from '@/lib/presentation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DEFAULT_CENTER: [number, number] = [78.9629, 22.5937];

const readThemeColor = (variableName: string, alpha?: number) => {
  if (typeof window === 'undefined') return alpha === undefined ? 'currentColor' : 'transparent';
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  if (!value) return alpha === undefined ? 'currentColor' : 'transparent';
  return alpha === undefined ? `hsl(${value})` : `hsl(${value} / ${alpha})`;
};

const colorForPressure = (pressure: number) => {
  if (pressure > 80) return '--status-danger';
  if (pressure >= 50) return '--status-warning';
  return '--status-success';
};

const PublicMap: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { heatmapPoints, fetchHeatmapPoints, loadingHeatmap, error } = usePublicPortal();
  const mapElement = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    void fetchHeatmapPoints();
  }, [fetchHeatmapPoints]);

  useEffect(() => {
    if (!mapElement.current) return;

    const features = heatmapPoints.map((point) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([point.longitude, point.latitude])),
        pointId: point.id,
      });
      feature.set('data', point);
      return feature;
    });

    const vectorLayer = new VectorLayer({
      source: new VectorSource({ features }),
      style: (feature) => {
        const point = feature.get('data') as (typeof heatmapPoints)[number];
        const color = readThemeColor(colorForPressure(point.budgetPressure));
        const radius = Math.max(10, Math.min(24, 10 + point.budgetPressure / 6));
        return new Style({
          image: new CircleStyle({
            radius,
            fill: new Fill({ color: readThemeColor(colorForPressure(point.budgetPressure), 0.28) }),
            stroke: new Stroke({ color, width: 2 }),
          }),
        });
      },
    });

    const map = new Map({
      target: mapElement.current,
      layers: [new TileLayer({ source: new OSM() }), vectorLayer],
      view: new View({
        center:
          heatmapPoints.length > 0
            ? fromLonLat([heatmapPoints[0].longitude, heatmapPoints[0].latitude])
            : fromLonLat(DEFAULT_CENTER),
        zoom: heatmapPoints.length > 0 ? 5 : 4,
      }),
    });

    map.on('pointermove', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (item) => item);
      if (!feature) {
        setHoveredId(null);
        setPopupPosition(null);
        map.getTargetElement().style.cursor = '';
        return;
      }

      setHoveredId(feature.get('pointId'));
      setPopupPosition({ x: event.pixel[0], y: event.pixel[1] });
      map.getTargetElement().style.cursor = 'pointer';
    });

    const handleMouseLeave = () => {
      setHoveredId(null);
      setPopupPosition(null);
      map.getTargetElement().style.cursor = '';
    };

    map.getViewport().addEventListener('mouseleave', handleMouseLeave);

    return () => {
      map.getViewport().removeEventListener('mouseleave', handleMouseLeave);
      map.setTarget(undefined);
    };
  }, [heatmapPoints, resolvedTheme]);

  const hoveredPoint = useMemo(
    () => heatmapPoints.find((point) => point.id === hoveredId) ?? null,
    [heatmapPoints, hoveredId]
  );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <Card className="border-border/80">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MapPinned className="h-5 w-5" />
                </div>
                <CardTitle>Budget pressure map</CardTitle>
                <CardDescription>
                  Explore public project locations and how funding pressure is accumulating across the map.
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/public">
                  <ArrowLeft className="h-4 w-4" />
                  Back to portal
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="metric-card">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Projects mapped</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{heatmapPoints.length}</p>
            </div>
            <div className="metric-card">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pressure legend</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--status-success))]/15 bg-[hsl(var(--status-success-soft))] px-3 py-1 text-[hsl(var(--status-success))]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Below 50%
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--status-warning))]/15 bg-[hsl(var(--status-warning-soft))] px-3 py-1 text-[hsl(var(--status-warning))]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  50% to 80%
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--status-danger))]/15 bg-[hsl(var(--status-danger-soft))] px-3 py-1 text-[hsl(var(--status-danger))]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Above 80%
                </span>
              </div>
            </div>
            <div className="metric-card">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Map behavior</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Hover any circle to inspect budget pressure, spend, and city-level context.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-0">
            <div className="relative h-[calc(100vh-18rem)] min-h-[560px] overflow-hidden rounded-[inherit] bg-muted/30">
              {loadingHeatmap && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/75 backdrop-blur-sm">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                </div>
              )}

              <div ref={mapElement} className="h-full w-full" />

              {hoveredPoint && popupPosition && (
                <div
                  className="pointer-events-none absolute z-30 w-80 max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-[calc(100%+1rem)]"
                  style={{ left: popupPosition.x, top: popupPosition.y }}
                >
                  <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl">
                    <div className="p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {hoveredPoint.city || 'Unknown city'}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-foreground">{hoveredPoint.name}</h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Budget</p>
                          <p className="mt-1 font-medium text-foreground">{formatCurrency(hoveredPoint.estimatedBudget)}</p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Spent</p>
                          <p className="mt-1 font-medium text-foreground">{formatCurrency(hoveredPoint.totalSpent)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-border/70 bg-muted/20 px-4 py-3 text-sm text-foreground">
                      Pressure: <span className="font-semibold">{hoveredPoint.budgetPressure}%</span>
                    </div>
                  </div>
                </div>
              )}

              {error && !loadingHeatmap && (
                <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicMap;
