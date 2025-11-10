"use client";

import React from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

type PropType = {
  images: string[];
};

export const BackgroundCarousel: React.FC<PropType> = (props) => {
  const { images } = props;
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" ref={emblaRef}>
      <div className="flex h-full">
        {images.map((src, index) => (
          <div className="relative min-w-full h-full" key={index}>
            <Image
              src={src}
              alt={`Background image ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
    </div>
  );
};
