
"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Map } from "@/components/map/Map";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Map as MapIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ROUTE_COLORS = [
    "#e11d48", // rose-600
    "#2563eb", // blue-600
    "#16a34a", // green-600
    "#d97706", // amber-600
    "#9333ea", // purple-600
    "#0891b2", // cyan-600
    "#be123c", // rose-700
    "#1d4ed8", // blue-700
];

interface RouteData {
    id: string;
    name: string;
    status: string;
    school: {
        name: string;
        latitude: number;
        longitude: number;
    };
    driver: {
        name: string;
    };
    stops: {
        id: string;
        name: string;
        latitude: number;
        longitude: number;
        orderIndex: number;
        scheduledTime: string;
    }[];
    tripLogs: {
        id: string;
        status: string;
        lastLatitude: number | null;
        lastLongitude: number | null;
        lastUpdatedAt: string | null;
    }[];
    _count: {
        students: number;
    };
}

export default function GlobalMapPage() {
    const { t } = useTranslation("common");
    const [mounted, setMounted] = useState(false);
    const [routes, setRoutes] = useState<RouteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/routes/active");
            const json = await res.json();
            if (json.success) {
                setRoutes(json.data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch routes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchRoutes();
        const interval = setInterval(fetchRoutes, 5000); // 5s polling
        return () => clearInterval(interval);
    }, []);

    // Process map data
    const allMarkers: any[] = [];
    const allPolylines: any[] = [];

    // Calculate center
    let centerLat = 0;
    let centerLng = 0;
    let pointCount = 0;

    console.log(`[MAP-UI] Processing ${routes.length} routes...`);

    routes.forEach((route, index) => {
        // School Marker
        allMarkers.push({
            position: [route.school.latitude, route.school.longitude],
            title: route.school.name,
            description: `School for route: ${route.name}`,
            type: "school",
        });
        centerLat += route.school.latitude;
        centerLng += route.school.longitude;
        pointCount++;

        // Stop Markers
        route.stops.forEach((stop) => {
            allMarkers.push({
                position: [stop.latitude, stop.longitude],
                title: stop.name,
                description: `Route: ${route.name} | Stop #${stop.orderIndex + 1} (${stop.scheduledTime})`,
            });
            centerLat += stop.latitude;
            centerLng += stop.longitude;
            pointCount++;
        });

        // Polyline
        const points = [
            [route.school.latitude, route.school.longitude] as [number, number],
            ...route.stops.map(s => [s.latitude, s.longitude] as [number, number]),
        ];
        allPolylines.push(points);

        // Add Bus Marker if there's an active trip
        const activeTrip = route.tripLogs?.[0];
        
        // Flexible status check
        const isTripActive = activeTrip && (
            activeTrip.status === "ONGOING" || 
            activeTrip.status === "TRIP_IN_PROGRESS" || 
            activeTrip.status === "ACTIVE"
        );

        const hasPos = activeTrip && activeTrip.lastLatitude !== null && activeTrip.lastLongitude !== null;
        
        console.log(`[TRACE-UI] Route ${route.name}: IsActive=${isTripActive}, HasPos=${hasPos}, Status=${activeTrip?.status}, Pos=[${activeTrip?.lastLatitude}, ${activeTrip?.lastLongitude}]`);

        if (activeTrip && isTripActive && hasPos) {
            const lastUpdate = activeTrip.lastUpdatedAt ? new Date(activeTrip.lastUpdatedAt) : null;
            const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
            const isStale = lastUpdate ? (Date.now() - lastUpdate.getTime() > STALE_THRESHOLD) : true;
            
            const lastSeenText = lastUpdate 
                ? `Last seen: ${lastUpdate.toLocaleTimeString()}`
                : "Last seen: Unknown";

            allMarkers.push({
                position: [activeTrip.lastLatitude!, activeTrip.lastLongitude!],
                title: `Bus: ${route.name}`,
                description: `Status: ${activeTrip.status} | Driver: ${route.driver?.name || "Unknown"} | ${lastSeenText}`,
                type: "bus",
                stale: isStale, // Custom prop for LeafletMap
            });
        }
    });

    const center: [number, number] = pointCount > 0 
        ? [centerLat / pointCount, centerLng / pointCount] 
        : [59.3293, 18.0686]; // Stockholm

    if (!mounted) return null;

    return (
        <div className="space-y-8 h-[calc(100vh-120px)] flex flex-col pb-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Live Map
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Global view of all active routes and buses.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 font-medium" suppressHydrationWarning>
                        Last Sync: {lastUpdated.toLocaleTimeString()}
                    </span>
                    <Button 
                        onClick={fetchRoutes} 
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        <span className="ml-2 font-semibold">Sync Map</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-3 flex flex-col min-h-0 premium-card overflow-hidden">
                    <div className="flex-1 relative">
                        <Map 
                            center={center} 
                            zoom={11} 
                            markers={allMarkers}
                            polylines={allPolylines}
                            className="h-full w-full min-h-[500px]"
                         />
                         
                         {/* Legend Overlay */}
                         <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl z-[400] max-h-[300px] overflow-y-auto w-64 animate-in slide-in-from-right-4 duration-500">
                            <h4 className="font-semibold text-sm text-white mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
                                <MapIcon className="h-4 w-4 text-cyan-400" /> Active Routes
                            </h4>
                            <div className="space-y-2.5">
                                {routes.map((route, index) => (
                                    <div key={route.id} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 truncate">
                                            <span 
                                                className="w-2.5 h-2.5 rounded-full block shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                                                style={{ backgroundColor: ROUTE_COLORS[index % ROUTE_COLORS.length] }}
                                            />
                                            <span className="truncate text-slate-300 font-medium" title={route.name}>{route.name}</span>
                                        </div>
                                        <Badge className="text-[9px] h-4 bg-slate-800 border-white/5 text-slate-400 capitalize">{route.status?.toLowerCase().replace(/_/g, " ")}</Badge>
                                    </div>
                                ))}
                                {routes.length === 0 && <p className="text-slate-500 text-[11px] py-1">No active routes</p>}
                            </div>
                         </div>
                    </div>
                </div>

                <div className="flex flex-col min-h-0 premium-card overflow-hidden">
                    <div className="p-5 border-b border-white/5 font-bold text-white tracking-wide bg-white/5">
                        Live Stats
                    </div>
                    <div className="p-5 space-y-6 overflow-y-auto">
                         <div className="grid grid-cols-2 gap-3">
                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl text-center">
                                <div className="text-2xl font-bold text-indigo-400 tracking-tighter">
                                    {routes.length}
                                </div>
                                <div className="text-[10px] uppercase font-bold text-indigo-500/60 mt-0.5 tracking-wider">Routes</div>
                            </div>
                             <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl text-center">
                                <div className="text-2xl font-bold text-cyan-400 tracking-tighter">
                                    {routes.reduce((acc, r) => acc + (r._count?.students || 0), 0)}
                                </div>
                                <div className="text-[10px] uppercase font-bold text-cyan-500/60 mt-0.5 tracking-wider">Pass.</div>
                            </div>
                         </div>
                         
                         <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Operational Health</h4>
                             {routes.map(r => (
                                 <div key={r.id} className="flex justify-between items-center text-sm p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition group">
                                     <span className="truncate text-slate-300 font-medium">{r.name}</span>
                                     <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md group-hover:bg-indigo-500/30 transition">{r.stops.length} STOPS</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
