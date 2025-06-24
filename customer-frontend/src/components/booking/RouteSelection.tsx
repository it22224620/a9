'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, ArrowRight, Clock, Star } from 'lucide-react';
import { useBooking } from '../../contexts/BookingContext';
import { getAllRoutes } from '../../lib/api';
import toast from 'react-hot-toast';

interface Route {
  id: string;
  from: string;
  to: string;
  description: string;
  isActive: boolean;
}

export default function RouteSelection() {
  const { setSelectedRoute, nextStep } = useBooking();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await getAllRoutes();
      if (response.success) {
        setRoutes(response.data);
      } else {
        toast.error('Failed to load routes');
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter(route =>
    route.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRouteSelect = (route: Route) => {
    setSelectedRouteId(route.id);
    setSelectedRoute(route);
  };

  const handleContinue = () => {
    if (!selectedRouteId) {
      toast.error('Please select a route to continue');
      return;
    }
    nextStep();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Loading available routes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Destination</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select from our carefully curated routes that showcase the most beautiful destinations across Sri Lanka.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search destinations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRoutes.map((route, index) => (
          <motion.div
            key={route.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => handleRouteSelect(route)}
            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedRouteId === route.id
                ? 'border-primary-500 bg-primary-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-primary-300'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {route.from} → {route.to}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>3-4 hours journey</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-600">4.8</span>
              </div>
            </div>

            <p className="text-gray-600 mb-4 leading-relaxed">
              {route.description || 'Experience the beautiful journey through scenic landscapes and cultural landmarks.'}
            </p>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Starting from <span className="font-semibold text-primary-600">LKR 1,500</span>
              </div>
              <ArrowRight className={`w-5 h-5 transition-colors ${
                selectedRouteId === route.id ? 'text-primary-600' : 'text-gray-400'
              }`} />
            </div>
          </motion.div>
        ))}
      </div>

      {filteredRoutes.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No routes found</h3>
          <p className="text-gray-600">Try adjusting your search terms or browse all available routes.</p>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleContinue}
          disabled={!selectedRouteId}
          className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
            selectedRouteId
              ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue to Vehicle Selection
        </button>
      </div>
    </div>
  );
}