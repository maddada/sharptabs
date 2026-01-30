import { useEffect, useState, useEffectEvent } from "react";
import { Input } from "@/components/ui/input"; // Assuming shadcn Input component is available
import { Button } from "@/components/ui/button"; // Assuming shadcn Button component is available
import { LoadingSpinner } from "@/icons/LoadingSpinner";
import { Label } from "@radix-ui/react-label";

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const PEXELS_API_URL = "https://api.pexels.com/v1/search";

interface PexelsPhotoSource {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
}

interface PexelsPhoto {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    photographer_id: number;
    avg_color: string;
    src: PexelsPhotoSource;
    liked: boolean;
    alt: string;
}

interface PexelsApiResponse {
    page: number;
    per_page: number;
    photos: PexelsPhoto[];
    total_results: number;
    next_page: string;
}

interface PexelsImagePickerProps {
    onImageSelect: (imageUrl: string) => void;
}

const fetchImages = async (
    page: number,
    perPage: number,
    searchQuery: string,
    setError: (error: string | null) => void,
    setIsLoading: (isLoading: boolean) => void,
    setImages: (images: PexelsPhoto[]) => void,
    setTotalResults: (totalResults: number) => void,
    setPerPage: (perPage: number) => void,
    setCurrentPage: (currentPage: number) => void
) => {
    if (!searchQuery.trim()) return;
    if (PEXELS_API_KEY === "YOUR_PEXELS_API_KEY" || !PEXELS_API_KEY) {
        setError("Pexels API key is missing or invalid.");
        setIsLoading(false); // Ensure loading stops if key is missing
        return;
    }

    setIsLoading(true);
    setError(null);
    // Don't clear images here if just changing page
    // setImages([]);

    try {
        const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(searchQuery)}&page=${page}&per_page=${perPage}`, {
            headers: {
                Authorization: PEXELS_API_KEY,
            },
        });

        if (!response.ok) {
            // Try to get more specific error from Pexels if possible
            let errorBody = "Unknown API error";
            try {
                const errorData = await response.json();
                errorBody = errorData.error || errorData.message || `${response.status} ${response.statusText}`;
            } catch (parseError) {
                errorBody = `${response.status} ${response.statusText} ${parseError}`;
            }
            throw new Error(`Pexels API error: ${errorBody}`);
        }

        const data: PexelsApiResponse = await response.json();

        if (data.photos.length === 0 && page === 1) {
            // Only show "no images" on the first page
            setError("No images found for your query.");
            setImages([]);
            setTotalResults(0);
        } else {
            setImages(data.photos);
            setTotalResults(data.total_results);
            setPerPage(data.per_page); // Update perPage based on response if needed
            setCurrentPage(page); // Ensure currentPage state matches the fetched page
        }
    } catch (err) {
        console.log("Failed to fetch images from Pexels:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        // Don't clear images on subsequent page load errors
        if (page === 1) {
            setImages([]);
            setTotalResults(0);
        }
    } finally {
        setIsLoading(false);
    }
};

const PexelsImagePicker: React.FC<PexelsImagePickerProps> = ({ onImageSelect }) => {
    const [searchQuery, setSearchQuery] = useState<string>("abstract background");
    const [images, setImages] = useState<PexelsPhoto[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalResults, setTotalResults] = useState<number>(0);
    const [perPage, setPerPage] = useState<number>(18);

    const _fetchImages = async (currentPage: number, perPage: number, searchQuery: string) => {
        await fetchImages(currentPage, perPage, searchQuery, setError, setIsLoading, setImages, setTotalResults, setPerPage, setCurrentPage);
    };

    const searchOnLoadEvent = useEffectEvent(() => {
        setTimeout(handleSearch, 200);
    });

    useEffect(() => {
        // eslint-disable-next-line react-you-might-not-need-an-effect/no-initialize-state
        searchOnLoadEvent();
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const handleSearch = async () => {
        setCurrentPage(1);
        setTotalResults(0);
        await _fetchImages(1, perPage, searchQuery);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            _fetchImages(currentPage - 1, perPage, searchQuery);
        }
    };

    const handleNextPage = () => {
        const totalPages = Math.ceil(totalResults / perPage);
        if (currentPage < totalPages) {
            _fetchImages(currentPage + 1, perPage, searchQuery);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    };

    const handleImageClick = (imageUrl: string) => {
        onImageSelect(imageUrl);
    };

    return (
        <div className="min-h-[380px]">
            <div className="mb-2 mt-4 text-sm font-medium">
                <Label htmlFor="background-image-url">Image Selection</Label>
            </div>
            <div className="flex h-10 w-full items-center gap-3">
                <Input
                    type="text"
                    placeholder="Search Pexels for images..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    aria-label="Search Pexels for images"
                    className="h-full"
                />
                <Button type="button" variant="outline" onClick={handleSearch} className="h-10" disabled={isLoading || !searchQuery.trim()}>
                    {isLoading ? "Searching..." : "Search"}
                </Button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {isLoading && (
                <div className="flex h-full w-full select-none items-center justify-center text-center text-foreground">
                    <LoadingSpinner className="h-8 w-8" />
                </div>
            )}

            {!isLoading && images.length > 0 && (
                <div className="mt-3 grid grid-cols-6 gap-2">
                    {images.map((image) => {
                        console.log(image);
                        return (
                            <div
                                key={image.id}
                                className="aspect-square cursor-pointer overflow-hidden rounded-md border border-transparent hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                onClick={() => handleImageClick(image.src.large.replace(/&h=\d\d\d&w=\d\d\d/, "&h=1500"))}
                                onKeyDown={(e) => e.key === "Enter" && handleImageClick(image.src.large.replace(/&h=\d\d\d&w=\d\d\d/, "&h=1500"))}
                                tabIndex={0}
                                role="button"
                                aria-label={`Select image: ${image.alt || `Photo by ${image.photographer}`}`}
                            >
                                <img
                                    src={image.src.small} // Display small size in the grid
                                    alt={image.alt || `Photo by ${image.photographer}`}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        );
                    })}
                </div>
            )}
            {/* Pagination Controls */}
            {!isLoading && totalResults > perPage && (
                <div className="mt-4 flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePreviousPage}
                        disabled={currentPage <= 1 || isLoading}
                        aria-label="Go to previous page of images"
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-neutral-600">
                        Page {currentPage} of {Math.ceil(totalResults / perPage)} ({totalResults} results)
                    </span>
                    <Button
                        variant="outline"
                        onClick={handleNextPage}
                        disabled={currentPage * perPage >= totalResults || isLoading}
                        aria-label="Go to next page of images"
                    >
                        Next
                    </Button>
                </div>
            )}
            {/* Message for no results only shown when not loading, no error, and specifically after a search yielded nothing */}
            {!isLoading && !error && images.length === 0 && totalResults === 0 && searchQuery && (
                <p className="text-neutral-500">No images found. Try a different search term.</p>
            )}
        </div>
    );
};

export default PexelsImagePicker;
