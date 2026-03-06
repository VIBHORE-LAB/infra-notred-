import React, { useEffect, useRef, useState } from 'react';
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
import instance from '../api/api';

import Overlay from 'ol/Overlay';

interface ReportMarker {
    id: string;
    latitude: number;
    longitude: number;
    description: string;
    projectName?: string;
    projectDescription?: string;
    images?: string[];
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
    aiReasoning?: string;
    confidenceScore?: number;
}

interface GISDataProps {
    projectId?: string;
    staticMarkers?: StaticMarker[];
}

const GISData: React.FC<GISDataProps> = ({ projectId, staticMarkers }) => {
    const mapElement = useRef<HTMLDivElement>(null);
    const popupElement = useRef<HTMLDivElement>(null);
    const [markers, setMarkers] = useState<ReportMarker[]>([]);
    const [loading, setLoading] = useState(false);
    const [hoveredData, setHoveredData] = useState<ReportMarker | null>(null);

    useEffect(() => {
        const shouldFetchReports = Boolean(projectId) || (staticMarkers ?? []).length === 0;
        if (!shouldFetchReports) {
            setMarkers([]);
            setLoading(false);
            return;
        }

        const url = projectId ? `/progress-reports/project/${projectId}` : `/progress-reports/all`;
        setLoading(true);
        instance.get(url)
            .then(res => {
                const reports = res.data?.data?.reports ?? [];
                const mapped: ReportMarker[] = reports
                    .filter((r: any) => r.gpsCoordinates?.latitude && r.gpsCoordinates?.longitude)
                    .map((r: any) => ({
                        id: r._id,
                        latitude: r.gpsCoordinates.latitude,
                        longitude: r.gpsCoordinates.longitude,
                        description: r.description,
                        projectName: r.projectName,
                        projectDescription: r.projectDescription,
                        images: r.images
                    }));
                setMarkers(mapped);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [projectId, staticMarkers]);

    useEffect(() => {
        if (!mapElement.current || !popupElement.current) return;

        const useStaticMarkers = (staticMarkers ?? []).length > 0 && !projectId;
        const allMarkers: ReportMarker[] = useStaticMarkers
            ? (staticMarkers ?? []).map(m => ({
                id: m.id,
                latitude: m.latitude,
                longitude: m.longitude,
                description: m.description ?? m.name,
                projectName: m.projectName ?? m.name,
                projectDescription: m.projectDescription ?? m.description,
                images: m.images,
            }))
            : markers.length > 0
                ? markers
                : [];

        const features = allMarkers.map(marker => {
            const f = new Feature({
                geometry: new Point(fromLonLat([marker.longitude, marker.latitude])),
                name: marker.description,
                data: marker
            });
            return f;
        });

        const vectorSource = new VectorSource({ features });
        const vectorLayer = new VectorLayer({
            source: vectorSource,
            style: (feature) => {
                const data = feature.get('data') as ReportMarker;
                const risk = (data as any).riskLevel as string | undefined;

                let markerColor = '#4f46e5'; // Default Indigo
                if (risk === 'High') markerColor = '#e11d48'; // Rose-600
                if (risk === 'Medium') markerColor = '#f59e0b'; // Amber-500

                return new Style({
                    image: new CircleStyle({
                        radius: risk ? 10 : 8,
                        fill: new Fill({ color: markerColor }),
                        stroke: new Stroke({ color: 'white', width: 2 }),
                    }),
                    text: new Text({
                        text: (() => {
                            const full = (feature.get('name') ?? '').toString();
                            return full.length > 15 ? `${full.substring(0, 15)}...` : full;
                        })(),
                        offsetY: -18,
                        fill: new Fill({ color: '#1e293b' }),
                        backgroundFill: new Fill({ color: 'rgba(255,255,255,0.8)' }),
                        padding: [2, 4, 2, 4],
                        font: 'bold 10px Inter, sans-serif'
                    }),
                });
            },
        });

        const overlay = new Overlay({
            element: popupElement.current,
            autoPan: {
                animation: {
                    duration: 250,
                },
            },
            offset: [0, -10],
            positioning: 'bottom-center'
        });

        const map = new Map({
            target: mapElement.current,
            layers: [new TileLayer({ source: new OSM() }), vectorLayer],
            overlays: [overlay],
            view: new View({
                center: allMarkers.length > 0
                    ? fromLonLat([allMarkers[0].longitude, allMarkers[0].latitude])
                    : fromLonLat([77.2090, 28.6139]),
                zoom: allMarkers.length > 0 ? 10 : 4,
            }),
        });

        map.on('pointermove', (evt) => {
            const feature = map.forEachFeatureAtPixel(evt.pixel, (feat) => feat);
            if (feature) {
                const data = feature.get('data') as ReportMarker;
                setHoveredData(data);
                const coordinate = (feature.getGeometry() as Point).getCoordinates();
                overlay.setPosition(coordinate);
                map.getTargetElement().style.cursor = 'pointer';
            } else {
                setHoveredData(null);
                overlay.setPosition(undefined);
                map.getTargetElement().style.cursor = '';
            }
        });

        return () => { map.setTarget(undefined); };
    }, [markers, staticMarkers, projectId]);

    return (
        <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-xl relative bg-slate-50">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            )}

            <div ref={mapElement} className="w-full h-[500px]" />

            <div ref={popupElement} className={`absolute z-50 pointer-events-none transition-opacity duration-200 ${hoveredData ? 'opacity-100' : 'opacity-0'}`}>
                {hoveredData && (
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-100 p-0 w-80 overflow-hidden pointer-events-auto">
                        <div className="flex">
                            <div className="p-3 flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                                    {hoveredData.projectName || 'Project'}
                                </p>
                                <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{hoveredData.description}</h3>
                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-3">
                                    {(hoveredData as any).aiReasoning || hoveredData.projectDescription || 'No additional project details available.'}
                                </p>
                                {(hoveredData as any).riskLevel && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${(hoveredData as any).riskLevel === 'High' ? 'bg-rose-100 text-rose-700' : (hoveredData as any).riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {(hoveredData as any).riskLevel} Risk
                                        </span>
                                        {(hoveredData as any).confidenceScore !== undefined && (
                                            <span className="text-[9px] text-slate-400 font-medium italic">
                                                Conf: {((hoveredData as any).confidenceScore * 100).toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="w-28 h-28 shrink-0 bg-slate-100 border-l border-slate-100">
                                {hoveredData.images && hoveredData.images[0] ? (
                                    <img src={hoveredData.images[0]} alt="Project" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-medium px-2 text-center">
                                        No image
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-50 px-3 py-2 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-medium text-slate-500">
                                Lat {hoveredData.latitude.toFixed(4)}, Lng {hoveredData.longitude.toFixed(4)}
                            </span>
                            <span className="text-[10px] font-semibold text-indigo-600">AI Verified Pin</span>
                        </div>
                    </div>
                )}
            </div>

            {markers.length === 0 && (staticMarkers ?? []).length === 0 && !loading && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-sm text-slate-600 text-xs px-4 py-2 rounded-full border border-slate-200 font-medium z-10">
                    No project coordinates available yet
                </div>
            )}
        </div>
    );
};

export default GISData;
