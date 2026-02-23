
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Map } from "@/components/map/Map"; // Ensure this path is correct
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, MapPin } from "lucide-react";
import { format } from "date-fns";

interface RouteDetail {
    id: string;
    name: string;
    status: string;
    capacity: number;
    startTime: string;
    endTime: string;
    school: {
        id: string;
        name: string;
        latitude: number;
        longitude: number;
        addressStreet: string;
    };
    driver: {
        id: string;
        name: string;
        phone: string | null;
    };
    stops: {
        id: string;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        scheduledTime: string;
        orderIndex: number;
    }[];
    _count: {
        students: number;
    };
}

export default function RouteDetailPage() {
    const { t } = useTranslation("common");
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [route, setRoute] = useState<RouteDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;

        const fetchRoute = async () => {
            try {
                const res = await fetch(`/api/routes/${id}`);
                const json = await res.json();

                if (json.success) {
                    setRoute(json.data);
                } else {
                    setError(json.error?.message || "Failed to load route");
                }
            } catch (err) {
                console.error(err);
                setError("An error occurred fetching the route.");
            } finally {
                setLoading(false);
            }
        };

        fetchRoute();
    }, [id]);

    if (loading) return <div className="p-8">Loading route details...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
    if (!route) return <div className="p-8">Route not found.</div>;

    // Prepare Map Data
    const schoolMarker = {
        position: [route.school.latitude, route.school.longitude] as [number, number],
        title: route.school.name,
        description: "School (Start/End)",
    };

    const stopMarkers = route.stops.map((stop, index) => ({
        position: [stop.latitude, stop.longitude] as [number, number],
        title: stop.name,
        description: `Stop #${index + 1} - ${stop.scheduledTime} (${stop.address})`,
    }));

    const markers = [schoolMarker, ...stopMarkers];

    // Polyline: School -> Stop 1 -> Stop 2 -> ... -> School (Loop) used for simplicity
    const polylinePoints = [
        [route.school.latitude, route.school.longitude] as [number, number],
        ...route.stops.map(s => [s.latitude, s.longitude] as [number, number]),
        // [route.school.latitude, route.school.longitude] as [number, number] // Optional: Close the loop
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <PageHeader
                    title={route.name}
                    description={`Route for ${route.school.name}`}
                >
                    <Button onClick={() => router.push(`/admin/routes?edit=${route.id}`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Route
                    </Button>
                </PageHeader>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content: Map & Stops */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> 
                                Route Map
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Map Component */}
                             <Map 
                                center={[route.school.latitude, route.school.longitude]} 
                                zoom={13} 
                                markers={markers}
                                polylines={[polylinePoints]}
                                className="h-[500px] w-full"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Stops Sequence</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l border-muted ml-4 space-y-6 py-2">
                                {route.stops.map((stop, index) => (
                                    <div key={stop.id} className="ml-6 relative">
                                        <span className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground ring-4 ring-background">
                                            {index + 1}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{stop.name}</span>
                                            <span className="text-sm text-muted-foreground">{stop.address}</span>
                                            <Badge variant="secondary" className="w-fit mt-1">
                                                {stop.scheduledTime}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Driver</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="font-medium">{route.driver.name}</p>
                                <p className="text-sm text-muted-foreground">{route.driver.phone || "No phone number"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                             <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-sm text-muted-foreground">Status</span>
                                <div className="mt-1"><Badge>{route.status}</Badge></div>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Capacity</span>
                                <p className="font-medium">{route._count.students} / {route.capacity} Students</p>
                            </div>
                             <div>
                                <span className="text-sm text-muted-foreground">Schedule</span>
                                <p className="font-medium">{route.startTime} - {route.endTime}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
