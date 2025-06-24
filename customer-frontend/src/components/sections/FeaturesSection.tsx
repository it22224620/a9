'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, MapPin, Users, Star, Headphones } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'Your safety is our priority with well-maintained vehicles and experienced drivers.',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: Clock,
    title: 'On-Time Service',
    description: 'Punctual departures and arrivals to ensure you never miss your schedule.',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: MapPin,
    title: 'Scenic Routes',
    description: 'Carefully selected routes that showcase the most beautiful landscapes.',
    color: 'from-purple-500 to-violet-600'
  },
  {
    icon: Users,
    title: 'Comfortable Seating',
    description: 'Spacious and comfortable seats for a relaxing journey experience.',
    color: 'from-orange-500 to-red-600'
  },
  {
    icon: Star,
    title: 'Premium Experience',
    description: 'High-quality service with attention to every detail of your journey.',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Round-the-clock customer support for any assistance you may need.',
    color: 'from-pink-500 to-rose-600'
  }
];

export default function FeaturesSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title text-gradient">
            Why Choose Nature Travel?
          </h2>
          <p className="section-subtitle">
            Experience the difference with our premium travel services designed for your comfort and safety.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="feature-card group"
            >
              <div className={`feature-icon bg-gradient-to-r ${feature.color}`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20 bg-gradient-to-r from-primary-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">10K+</div>
              <div className="text-primary-100">Happy Travelers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">50+</div>
              <div className="text-primary-100">Destinations</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">99%</div>
              <div className="text-primary-100">On-Time Rate</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">24/7</div>
              <div className="text-primary-100">Support</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}