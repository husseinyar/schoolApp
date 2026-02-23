"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, MapPin, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlaceDetails {
    placeId: string;
    formattedAddress: string;
    lat: number;
    lng: number;
    postalCode?: string;
    city?: string;
}

interface Suggestion {
    placeId: string;
    description: string;
}

interface AddressAutocompleteProps {
    /** Current visible value of the address input */
    value?: string;
    /** Called when the text input changes (for react-hook-form controlled input) */
    onChange?: (value: string) => void;
    /** Called when the user selects a suggestion and details are loaded */
    onSelect: (details: PlaceDetails) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    id?: string;
    className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddressAutocomplete({
    value = "",
    onChange,
    onSelect,
    placeholder = "Search for an address…",
    error,
    disabled,
    id,
    className,
}: AddressAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState(-1);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync external value changes (e.g. form reset)
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setActiveIndex(-1);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // ── Debounced fetch ────────────────────────────────────────────────────────

    const fetchSuggestions = useCallback(async (q: string) => {
        if (q.length < 3) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }
        setIsSearching(true);
        setSearchError(null);
        try {
            const res = await fetch(`/api/geo/places/suggest?q=${encodeURIComponent(q)}`);
            const json = await res.json();
            if (!res.ok || json.error) {
                setSearchError(json.error ?? "Search failed");
                setSuggestions([]);
            } else {
                setSuggestions(json.suggestions ?? []);
                setIsOpen(true);
                setActiveIndex(-1);
            }
        } catch {
            setSearchError("Could not reach address service");
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setInputValue(val);
        onChange?.(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
    }

    // ── Select handler ─────────────────────────────────────────────────────────

    async function handleSelect(suggestion: Suggestion) {
        setIsOpen(false);
        setSuggestions([]);
        setInputValue(suggestion.description);
        onChange?.(suggestion.description);
        setIsLoadingDetails(true);
        setSearchError(null);
        try {
            const res = await fetch(`/api/geo/places/details?placeId=${encodeURIComponent(suggestion.placeId)}`);
            const json = await res.json();
            if (!res.ok || json.error) {
                setSearchError(json.error ?? "Could not load address details");
            } else {
                setInputValue(json.formattedAddress);
                onChange?.(json.formattedAddress);
                onSelect(json as PlaceDetails);
            }
        } catch {
            setSearchError("Could not load address details");
        } finally {
            setIsLoadingDetails(false);
        }
    }

    // ── Keyboard navigation ────────────────────────────────────────────────────

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!isOpen || suggestions.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            handleSelect(suggestions[activeIndex]);
        } else if (e.key === "Escape") {
            setIsOpen(false);
            setActiveIndex(-1);
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    const showDropdown = isOpen && (suggestions.length > 0 || isSearching || searchError);

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            {/* Input */}
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={disabled || isLoadingDetails}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    aria-autocomplete="list"
                    aria-expanded={showDropdown ? "true" : "false"}
                    aria-controls="address-listbox"
                    aria-activedescendant={activeIndex >= 0 ? `addr-item-${activeIndex}` : undefined}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-10 py-2 text-sm ring-offset-background",
                        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-destructive focus-visible:ring-destructive"
                    )}
                />
                {/* Spinner */}
                {(isSearching || isLoadingDetails) && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {/* Inline error */}
            {error && (
                <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {error}
                </p>
            )}
            {searchError && !error && (
                <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {searchError}
                </p>
            )}

            {/* Dropdown */}
            {showDropdown && (
                <div
                    id="address-listbox"
                    role="listbox"
                    className={cn(
                        "absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-lg overflow-hidden",
                        "animate-in fade-in-0 zoom-in-95"
                    )}
                >
                    {isSearching && (
                        <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Searching…
                        </div>
                    )}
                    {!isSearching && suggestions.length === 0 && !searchError && (
                        <div className="px-4 py-3 text-sm text-muted-foreground">No results found.</div>
                    )}
                    {!isSearching &&
                        suggestions.map((s, idx) => (
                            <button
                                key={s.placeId}
                                id={`addr-item-${idx}`}
                                role="option"
                                aria-selected={idx === activeIndex}
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault(); // prevent blur before click
                                    handleSelect(s);
                                }}
                                onMouseEnter={() => setActiveIndex(idx)}
                                className={cn(
                                    "w-full text-left flex items-start gap-2.5 px-4 py-2.5 text-sm cursor-pointer transition-colors",
                                    idx === activeIndex
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                                <span className="leading-snug">{s.description}</span>
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}
