"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import { X, Check, RotateCw, ZoomIn, Ratio } from "lucide-react";

interface ImageCropModalProps {
    imageSrc: string;
    aspect?: number; // Initial Aspect Ratio
    onCancel: () => void;
    onCropComplete: (croppedImageBase64: string) => void;
}

// Aspect Ratios
const ASPECTS = [
    { label: "1:1", value: 1 },
    { label: "4:3", value: 4 / 3 },
    { label: "16:9", value: 16 / 9 },
    // { label: "Original", value: 0 } // handled separately
];

export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });

export function getRadianAngle(degreeValue: number) {
    return (degreeValue * Math.PI) / 180;
}

export function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = getRadianAngle(rotation);
    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("No 2d context");
    }

    const rotRad = getRadianAngle(rotation);

    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    );

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    );

    // Resize logic
    let targetWidth = pixelCrop.width;
    let targetHeight = pixelCrop.height;
    const MAX_DIMENSION = 1024;

    if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
        const ratio = targetWidth / targetHeight;
        if (targetWidth > targetHeight) {
            targetWidth = MAX_DIMENSION;
            targetHeight = MAX_DIMENSION / ratio;
        } else {
            targetHeight = MAX_DIMENSION;
            targetWidth = MAX_DIMENSION * ratio;
        }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Draw the cropped image to the new canvas size
    ctx.drawImage(
        image,
        pixelCrop.x,  // Source x
        pixelCrop.y,  // Source y
        pixelCrop.width, // Source width
        pixelCrop.height, // Source height
        0, // Destination x
        0, // Destination y
        targetWidth, // Destination width
        targetHeight // Destination height
    );

    // Compress to JPEG 0.7
    return canvas.toDataURL("image/jpeg", 0.7);
}

export default function ImageCropModal({ imageSrc, aspect: initialAspect = 1, onCancel, onCropComplete }: ImageCropModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspect, setAspect] = useState(initialAspect);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (crop: { x: number; y: number }) => setCrop(crop);
    const onZoomChange = (zoom: number) => setZoom(zoom);
    const onRotationChange = (rotation: number) => setRotation(rotation);

    const onCropCompleteCallback = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
            alert("이미지 처리 실패");
        } finally {
            setIsProcessing(false);
        }
    };

    const rotate90 = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col pt-safe-top">
            {/* Header */}
            <div className="px-4 py-4 flex justify-between items-center bg-black text-white relative z-10 border-b border-gray-800">
                <button onClick={onCancel} className="p-2 text-gray-300 hover:text-white">
                    <X size={24} />
                </button>
                <div className="flex gap-4">
                    <button onClick={rotate90} className="p-2 text-white hover:bg-gray-800 rounded-full transition-colors flex items-center gap-1 text-xs font-bold">
                        <RotateCw size={18} /> 90°
                    </button>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="p-2 text-[#FFCE00] font-bold disabled:opacity-50 flex items-center gap-1"
                >
                    {isProcessing ? "저장 중..." : <Check size={24} />}
                </button>
            </div>

            {/* Cropper Area */}
            <div className="flex-1 relative bg-[#1a1a1a]">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspect}
                    onCropChange={onCropChange}
                    onZoomChange={onZoomChange}
                    onRotationChange={onRotationChange}
                    onCropComplete={onCropCompleteCallback}
                    objectFit="contain"
                    showGrid={true}
                />
            </div>

            {/* Controls */}
            <div className="bg-black px-6 py-6 pb-safe-bottom space-y-6 border-t border-gray-800">

                {/* Aspect Ratio Selector */}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                        <Ratio size={14} /> 비율
                    </span>
                    <div className="flex gap-2">
                        {ASPECTS.map((a) => (
                            <button
                                key={a.label}
                                onClick={() => setAspect(a.value)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${aspect === a.value
                                    ? "bg-white text-black border-white"
                                    : "bg-transparent text-gray-400 border-gray-700 hover:border-gray-500"
                                    }`}
                            >
                                {a.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Zoom Slider */}
                <div className="flex items-center gap-3 text-gray-400">
                    <ZoomIn size={18} />
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FFCE00]"
                    />
                </div>
            </div>
        </div>
    );
}
