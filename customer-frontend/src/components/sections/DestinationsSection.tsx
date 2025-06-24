'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Star } from 'lucide-react';

const destinations = [
  {
    id: 1,
    name: 'Kandy',
    description: 'Cultural capital with the sacred Temple of the Tooth',
    image: 'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    duration: '3-4 hours',
    rating: 4.8,
    price: 'From LKR 1,500'
  },
  {
    id: 2,
    name: 'Ella',
    description: 'Scenic hill station with breathtaking mountain views',
    image: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    duration: '5-6 hours',
    rating: 4.9,
    price: 'From LKR 2,200'
  },
  {
    id: 3,
    name: 'Galle',
    description: 'Historic fort city with colonial architecture',
    image: 'https://images.pexels.com/photos/1320684/pexels-photo-1320684.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    duration: '2-3 hours',
    rating: 4.7,
    price: 'From LKR 1,200'
  },
  {
    id: 4,
    name: 'Nuwara Eliya',
    description: 'Cool climate tea country with rolling hills',
    image: 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    duration: '4-5 hours',
    rating: 4.6,
    price: 'From LKR 1,800'
  },
  {
    id: 5,
    name: 'Sigiriya',
    description: 'Ancient rock fortress and UNESCO World Heritage site',
    image: 'https://images.pexels.com/photos/1450360/pexels-photo-1450360.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    duration: '3-4 hours',
    rating: 4.9,
    price: 'From LKR 1,600'
  },
  {
    id: 6,
    name: 'Bentota',
    description: 'Beautiful beaches and water sports paradise',
    image: 'https://images.pexels.com/photos/1320684/pexels-photo-1320684.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    duration: '2-3 hours',
    rating: 4.5,
    price: 'From LKR 1,000'
  }
];

export default function DestinationsSection() {
  return (
    <section id="destinations" className="section-padding bg-gray-50">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title text-gradient">
            Popular Destinations
          </h2>
          <p className="section-subtitle">
            Discover the most beautiful and culturally rich destinations across Sri Lanka with our comfortable travel services.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="destination-card group cursor-pointer"
            >
              <div className="relative overflow-hidden">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="destination-image group-hover:scale-110 transition-transform duration-500"
                />
                <div className="destination-overlay"></div>
                <div className="destination-content">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold">{destination.name}</h3>
                    <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{destination.rating}</span>
                    </div>
                  </div>
                  <p className="text-white/90 mb-4 leading-relaxed">
                    {destination.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{destination.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">From Colombo</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{destination.price}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a href="/booking" className="btn-primary">
            Book Your Journey Now
          </a>
        </motion.div>
      </div>
    </section>
  );
}