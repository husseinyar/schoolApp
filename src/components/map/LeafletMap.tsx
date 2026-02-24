
"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Next.js
// Leaflet's default icon paths are broken by webpack/next.js imports
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LeafletMapProps {
    center: [number, number];
    zoom: number;
    markers?: {
        position: [number, number];
        title?: string;
        description?: string;
        type?: "bus" | "school" | "default";
        stale?: boolean;
    }[];
    polylines?: [number, number][][];
    className?: string;
}

// Component to update map view when center changes
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function LeafletMap({ 
    center, 
    zoom, 
    markers = [], 
    polylines = [], 
    className = "h-[400px] w-full rounded-md" 
}: LeafletMapProps) {
    
    return (
        <MapContainer 
            center={center} 
            zoom={zoom} 
            scrollWheelZoom={false} 
            className={className}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController center={center} zoom={zoom} />
            
            {markers.map((marker, index) => {
                let icon: any = DefaultIcon;
                
                if (marker.type === "bus") {
                    const isStale = marker.stale;
                    icon = L.divIcon({
                        className: `custom-bus-icon ${isStale ? "stale-marker" : ""}`,
                        html: `<div class="${isStale ? "bg-slate-400 opacity-60" : "bg-blue-600 animate-bounce-slow animate-pulse-ripple"} w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-xl">
                                <span class="text-white text-xs">${isStale ? "⏳" : "🚌"}</span>
                               </div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16],
                    });
                } else if (marker.type === "school") {
                     icon = L.divIcon({
                        className: "custom-school-icon",
                        html: `<div class="bg-rose-600 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                                <span class="text-white text-[10px]">🏫</span>
                               </div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12],
                    });
                }

                return (
                    <Marker key={index} position={marker.position} icon={icon as any}>
                        {(marker.title || marker.description) && (
                            <Popup>
                                <div className="text-sm">
                                    {marker.title && <h3 className="font-bold">{marker.title}</h3>}
                                    {marker.description && <p>{marker.description}</p>}
                                </div>
                            </Popup>
                        )}
                    </Marker>
                );
            })}

            {polylines.map((polyline, index) => (
                <Polyline key={index} positions={polyline} color="blue" />
            ))}
        </MapContainer>
    );
}
