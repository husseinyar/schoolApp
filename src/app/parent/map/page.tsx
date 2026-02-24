"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
    ArrowLeft, Bus, MapPin, RefreshCw, Loader2, 
    AlertTriangle, CheckCircle2, User, Phone,
    Navigation
} from "lucide-react";
import { Map } from "@/components/map/Map";

interface RouteData {
    id: string;
    name: string;
    school: {
        name: string;
        latitude: number;
        longitude: number;
    };
    driver: {
        name: string;
        phone: string | null;
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
    students: {
        id: string;
        name: string;
    }[];
}

export default function ParentLiveMapPage() {
    const [routes, setRoutes] = useState<RouteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/parent/live-tracking");
            const json = await res.json();
            if (json.success) {
                setRoutes(json.data);
                setError(null);
            } else {
                setError(json.error || "Failed to fetch tracking data");
            }
        } catch (err) {
            console.error("Error fetching live tracking:", err);
            setError("Connection error. Retrying...");
        } finally {
            setLoading(false);
            setLastUpdated(new Date());
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Map processing
    const allMarkers: any[] = [];
    const allPolylines: any[] = [];
    let centerLat = 0;
    let centerLng = 0;
    let pointCount = 0;

    routes.forEach((route) => {
        // School
        allMarkers.push({
            position: [route.school.latitude, route.school.longitude],
            title: route.school.name,
            description: "School",
            type: "school",
        });
        centerLat += route.school.latitude;
        centerLng += route.school.longitude;
        pointCount++;

        // Stops
        route.stops.forEach((stop) => {
            allMarkers.push({
                position: [stop.latitude, stop.longitude],
                title: stop.name,
                description: `Stop #${stop.orderIndex + 1} (${stop.scheduledTime})`,
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

        // Bus
        const activeTrip = route.tripLogs?.[0];
        if (activeTrip && activeTrip.lastLatitude !== null && activeTrip.lastLongitude !== null) {
            const lastUpdate = activeTrip.lastUpdatedAt ? new Date(activeTrip.lastUpdatedAt) : null;
            const STALE_THRESHOLD = 5 * 60 * 1000;
            const isStale = lastUpdate ? (Date.now() - lastUpdate.getTime() > STALE_THRESHOLD) : true;

            allMarkers.push({
                position: [activeTrip.lastLatitude!, activeTrip.lastLongitude!],
                title: `Bus: ${route.name}`,
                description: `Children: ${route.students.map(s => s.name).join(", ")} | Driver: ${route.driver?.name || "Unknown"}`,
                type: "bus",
                stale: isStale,
            });
            
            // Bias center towards bus if it exists
            centerLat += activeTrip.lastLatitude! * 2;
            centerLng += activeTrip.lastLongitude! * 2;
            pointCount += 2;
        }
    });

    const center: [number, number] = pointCount > 0 
        ? [centerLat / pointCount, centerLng / pointCount] 
        : [59.3293, 18.0686]; // Default to Stockholm

    const activeRoutes = routes.filter(r => r.tripLogs.length > 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 flex flex-col gap-6">
            <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 flex-1">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/parent" className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Live Bus Map</h1>
                            <p className="text-slate-400 text-sm">Real-time tracking of your child's bus</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 self-end md:self-auto">
                        <span className="text-xs text-slate-500 font-mono" suppressHydrationWarning>
                            Refreshed: {lastUpdated.toLocaleTimeString()}
                        </span>
                        <div className="flex items-center gap-2">
                             {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
                        </div>
                    </div>
                </div>

                {/* Error Box */}
                {error && (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300">
                        <AlertTriangle className="w-5 h-5" /> {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                    {/* Main Map */}
                    <div className="lg:col-span-3 flex flex-col gap-4">
                        <div className="relative flex-1 min-h-[400px] lg:min-h-0 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl">
                            <Map 
                                center={center} 
                                zoom={12} 
                                markers={allMarkers}
                                polylines={allPolylines}
                                className="h-full w-full"
                            />
                            
                            {/* Map Floating Status */}
                            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
                                {activeRoutes.map(r => (
                                    <div key={r.id} className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 rounded-xl px-3 py-2 flex items-center gap-3 shadow-lg">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-semibold text-white">{r.name} is LIVE</span>
                                    </div>
                                ))}
                                {activeRoutes.length === 0 && !loading && (
                                    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl px-3 py-2 flex items-center gap-3 shadow-lg">
                                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                                        <span className="text-xs font-semibold text-slate-400">No buses active</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Status */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5 shadow-xl">
                            <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Bus className="w-4 h-4 text-indigo-400" /> My Children
                            </h2>
                            <div className="space-y-4">
                                {routes.map(route => (
                                    <div key={route.id} className="space-y-3">
                                        {route.students.map(student => (
                                            <div key={student.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-white font-medium text-sm">{student.name}</span>
                                                    {route.tripLogs.length > 0 ? (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 uppercase font-bold tracking-wider">On Bus</span>
                                                    ) : (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-500 border border-slate-600 uppercase font-bold tracking-wider">Idle</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Navigation className="w-3 h-3" />
                                                    <span>{route.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                {routes.length === 0 && !loading && (
                                    <p className="text-slate-500 text-sm italic">No active bus services found for your children today.</p>
                                )}
                            </div>
                        </div>

                        {/* Driver Card */}
                        {activeRoutes.length > 0 && activeRoutes[0].driver && (
                            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/60 backdrop-blur border border-indigo-500/20 rounded-2xl p-5 shadow-xl">
                                <h3 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4 text-indigo-400" /> Driver Information
                                </h3>
                                <div className="space-y-3">
                                    <p className="text-white text-sm font-medium">{activeRoutes[0].driver.name}</p>
                                    {activeRoutes[0].driver.phone && (
                                        <a href={`tel:${activeRoutes[0].driver.phone}`} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition text-sm">
                                            <Phone className="w-4 h-4" /> {activeRoutes[0].driver.phone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-auto p-4 bg-slate-900/40 rounded-2xl border border-slate-800">
                             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Map Legend</h4>
                             <div className="space-y-2">
                                 <div className="flex items-center gap-2 text-xs text-slate-400">
                                     <div className="w-3 h-3 rounded-full bg-blue-600" /> <span>Active Bus</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-xs text-slate-400">
                                     <div className="w-3 h-3 rounded-full bg-rose-600" /> <span>School</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-xs text-slate-400">
                                     <div className="w-3 h-3 rounded-full bg-slate-400" /> <span>Stale (No GPS)</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
