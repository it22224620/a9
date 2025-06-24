'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    location: 'United Kingdom',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    rating: 5,
    text: 'Absolutely amazing experience! The journey to Kandy was comfortable and the views were breathtaking. The driver was professional and the vehicle was spotless. Highly recommended!',
    trip: 'Colombo to Kandy'
  },
  {
    id: 2,
    name: 'Michael Chen',
    location: 'Singapore',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    rating: 5,
    text: 'Nature Travel made our Sri Lankan adventure unforgettable. The booking process was smooth, and the service exceeded our expectations. The scenic route to Ella was simply magical.',
    trip: 'Colombo to Ella'
  },
  {
    id: 3,
    name: 'Emma Williams',
    location: 'Australia',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    rating: 5,
    text: 'Perfect service from start to finish. The online booking was easy, the vehicle was comfortable, and we arrived safely and on time. Will definitely use again for our next trip!',
    trip: 'Colombo to Galle'
  },
  {
    id: 4,
    name: 'David Kumar',
    location: 'India',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    rating: 5,
    text: 'Exceptional service and great value for money. The journey was smooth, the driver was knowledgeable about local attractions, and the vehicle was very comfortable.',
    trip: 'Colombo to Nuwara Eliya'
  },
  {
    id: 5,
    name: 'Lisa Anderson',
    location: 'Canada',
    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    rating: 5,
    text: 'Outstanding experience! The booking platform is user-friendly, the prices are reasonable, and the service quality is top-notch. Made our vacation stress-free and enjoyable.',
    trip: 'Airport to Sigiriya'
  }
];

export default function TestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index: number) => {
    setCurrentTestimonial(index);
  };

  return (
    <section className="section-padding bg-gradient-to-br from-primary-50 to-purple-50">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title text-gradient">
            What Our Travelers Say
          </h2>
          <p className="section-subtitle">
            Read genuine reviews from travelers who have experienced our exceptional service.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial */}
          <motion.div
            key={currentTestimonial}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="testimonial-card text-center"
          >
            <div className="relative mb-6">
              <Quote className="w-12 h-12 text-primary-200 mx-auto mb-4" />
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed italic">
                "{testimonials[currentTestimonial].text}"
              </p>
            </div>

            <div className="flex items-center justify-center mb-4">
              {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>

            <img
              src={testimonials[currentTestimonial].avatar}
              alt={testimonials[currentTestimonial].name}
              className="testimonial-avatar"
            />

            <h4 className="text-xl font-semibold text-gray-900 mb-1">
              {testimonials[currentTestimonial].name}
            </h4>
            <p className="text-gray-600 mb-2">
              {testimonials[currentTestimonial].location}
            </p>
            <p className="text-primary-600 font-medium">
              {testimonials[currentTestimonial].trip}
            </p>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-center mt-8 space-x-4">
            <button
              onClick={prevTestimonial}
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-primary-600 hover:shadow-xl transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentTestimonial ? 'bg-primary-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-primary-600 hover:shadow-xl transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">4.9/5</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">10K+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">99%</div>
            <div className="text-gray-600">Satisfaction Rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">24/7</div>
            <div className="text-gray-600">Customer Support</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}