
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

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <PageHeader
                title="Live Map"
                description="Global view of all active routes and buses."
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-2" suppressHydrationWarning>
                        Updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                    <Button variant="outline" size="sm" onClick={fetchRoutes} disabled={loading}>
                         {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                         <span className="ml-2">Refresh</span>
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                <Card className="lg:col-span-3 flex flex-col min-h-0">
                    <CardContent className="p-0 flex-1 relative">
                        <Map 
                            center={center} 
                            zoom={11} 
                            markers={allMarkers}
                            polylines={allPolylines}
                            className="h-full w-full min-h-[500px]"
                         />
                         
                         {/* Legend Overlay */}
                         <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 p-3 rounded-md shadow-md z-[400] max-h-[300px] overflow-y-auto w-64">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <MapIcon className="h-4 w-4" /> Routes
                            </h4>
                            <div className="space-y-2">
                                {routes.map((route, index) => (
                                    <div key={route.id} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 truncate">
                                            <span 
                                                className="w-3 h-3 rounded-full block shrink-0" 
                                                style={{ backgroundColor: ROUTE_COLORS[index % ROUTE_COLORS.length] }}
                                            />
                                            <span className="truncate" title={route.name}>{route.name}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] h-5">{route.status}</Badge>
                                    </div>
                                ))}
                                {routes.length === 0 && <p className="text-muted-foreground">No active routes</p>}
                            </div>
                         </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col min-h-0 overflow-hidden">
                    <div className="p-4 border-b font-semibold bg-muted/40">
                        Active Stats
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {routes.length}
                                </div>
                                <div className="text-xs text-muted-foreground">Routes</div>
                            </div>
                             <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {routes.reduce((acc, r) => acc + (r._count?.students || 0), 0)}
                                </div>
                                <div className="text-xs text-muted-foreground">Students</div>
                            </div>
                         </div>
                         
                         <div className="space-y-2 pt-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Stops Overview</h4>
                             {routes.map(r => (
                                 <div key={r.id} className="flex justify-between text-sm py-1 border-b last:border-0 border-dashed">
                                     <span className="truncate max-w-[120px]">{r.name}</span>
                                     <span className="font-mono text-xs">{r.stops.length} stops</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
