
"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the LeafletMap component with no SSR
const LeafletMap = dynamic(() => import("./LeafletMap"), {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-md" />,
});

interface MapProps {
    center: [number, number];
    zoom?: number;
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

export function Map({ center, zoom = 13, markers, polylines, className }: MapProps) {
    return (
        <div className={className || "h-[400px] w-full"}>
            <LeafletMap 
                center={center} 
                zoom={zoom} 
                markers={markers as any} 
                polylines={polylines} 
            />
        </div>
    );
}
