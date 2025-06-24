'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  name: string;
  description: string;
}

interface BookingProgressProps {
  steps: Step[];
  currentStep: number;
}

export default function BookingProgress({ steps, currentStep }: BookingProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  step.id < currentStep
                    ? 'bg-green-500 text-white'
                    : step.id === currentStep
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.id < currentStep ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <span>{step.id}</span>
                )}
              </motion.div>
              
              {/* Step Label */}
              <div className="absolute top-14 left-1/2 transform -translate-x-1/2 text-center min-w-max">
                <div className={`font-medium text-sm ${
                  step.id <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-4 transition-all duration-300 ${
                step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}