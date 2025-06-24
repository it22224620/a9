'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Phone, Mail } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="section-padding bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center text-white"
        >
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
            Ready for Your Next Adventure?
          </h2>
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Book your journey today and discover the breathtaking beauty of Sri Lanka with our premium travel services.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span>Book Your Journey</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a
              href="tel:+94771234567"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white/20"
            >
              <Phone className="w-5 h-5 mr-2" />
              <span>Call Now</span>
            </a>
          </div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Call Us</h3>
              <p className="opacity-90">+94 77 123 4567</p>
              <p className="opacity-75 text-sm">Available 24/7</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email Us</h3>
              <p className="opacity-90">info@naturetravel.lk</p>
              <p className="opacity-75 text-sm">Quick response guaranteed</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <ArrowRight className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Book Online</h3>
              <p className="opacity-90">Easy & Secure</p>
              <p className="opacity-75 text-sm">Instant confirmation</p>
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-12 pt-8 border-t border-white/20"
          >
            <p className="text-white/75 mb-4">Trusted by thousands of travelers</p>
            <div className="flex items-center justify-center space-x-8 opacity-60">
              <div className="text-sm">✓ Secure Payments</div>
              <div className="text-sm">✓ 24/7 Support</div>
              <div className="text-sm">✓ Instant Confirmation</div>
              <div className="text-sm">✓ Best Prices</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}