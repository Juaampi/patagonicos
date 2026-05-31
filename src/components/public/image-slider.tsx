"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ImageSliderProps = {
  images: Array<{ url: string; alt: string | null }>;
  title: string;
};

export function ImageSlider({ images, title }: ImageSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = images.length > 1;

  return (
    <div className="space-y-4">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
        <Image
          src={images[activeIndex]?.url || ""}
          alt={images[activeIndex]?.alt || title}
          fill
          className="object-cover"
          sizes="100vw"
        />
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-3 text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-3 text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-[4/3] overflow-hidden rounded-2xl border ${
                activeIndex === index ? "border-champagne" : "border-white/10"
              }`}
            >
              <Image src={image.url} alt={image.alt || title} fill className="object-cover" sizes="20vw" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
