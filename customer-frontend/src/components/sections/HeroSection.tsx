'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

const heroSlides = [
  {
    id: 1,
    image: 'https://images.pexels.com/photos/1450360/pexels-photo-1450360.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    title: 'Discover Sri Lanka\'s Hidden Gems',
    subtitle: 'Embark on unforgettable journeys through pristine landscapes and ancient wonders',
    cta: 'Start Your Adventure'
  },
  {
    id: 2,
    image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    title: 'Majestic Mountain Escapes',
    subtitle: 'Experience breathtaking views and serene mountain retreats in comfort',
    cta: 'Explore Mountains'
  },
  {
    id: 3,
    image: 'https://images.pexels.com/photos/1320684/pexels-photo-1320684.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    title: 'Pristine Beach Adventures',
    subtitle: 'Relax on golden beaches and crystal-clear waters along the coast',
    cta: 'Beach Getaway'
  },
  {
    id: 4,
    image: 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    title: 'Cultural Heritage Tours',
    subtitle: 'Immerse yourself in rich history and vibrant local traditions',
    cta: 'Cultural Journey'
  }
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Slides */}
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center text-center text-white">
        <div className="container-custom">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="hero-text mb-6">
              {heroSlides[currentSlide].title}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
              {heroSlides[currentSlide].subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/booking" className="btn-primary">
                {heroSlides[currentSlide].cta}
              </Link>
              <button className="btn-secondary flex items-center justify-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Watch Video</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-y-0 left-4 flex items-center">
        <button
          onClick={prevSlide}
          className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="absolute inset-y-0 right-4 flex items-center">
        <button
          onClick={nextSlide}
          className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* Play/Pause Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"
        >
          {isPlaying ? (
            <div className="w-4 h-4 flex space-x-1">
              <div className="w-1 h-4 bg-white"></div>
              <div className="w-1 h-4 bg-white"></div>
            </div>
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-8 text-white">
        <div className="flex items-center space-x-2">
          <div className="w-px h-16 bg-white/50"></div>
          <span className="text-sm opacity-75 writing-mode-vertical">Scroll to explore</span>
        </div>
      </div>
    </section>
  );
}