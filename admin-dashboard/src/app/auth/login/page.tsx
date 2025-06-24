'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Car, Key, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import toast from 'react-hot-toast';

interface LoginForm {
  username: string;
  password: string;
}

interface AdminKeyForm {
  adminKey: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithKey } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'credentials' | 'adminKey'>('credentials');
  const [isLoading, setIsLoading] = useState(false);

  const credentialsForm = useForm<LoginForm>();
  const adminKeyForm = useForm<AdminKeyForm>();

  const handleCredentialsLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const success = await login(data);
      if (success) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminKeyLogin = async (data: AdminKeyForm) => {
    setIsLoading(true);
    try {
      const success = await loginWithKey(data.adminKey);
      if (success) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Admin key login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Travel Booking System Administration
          </p>
        </div>

        <Card>
          {/* Login Type Selector */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginType('credentials')}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                loginType === 'credentials'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="h-4 w-4 mr-2" />
              Credentials
            </button>
            <button
              type="button"
              onClick={() => setLoginType('adminKey')}
              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                loginType === 'adminKey'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Key className="h-4 w-4 mr-2" />
              Admin Key
            </button>
          </div>

          {/* Credentials Login Form */}
          {loginType === 'credentials' && (
            <form onSubmit={credentialsForm.handleSubmit(handleCredentialsLogin)} className="space-y-4">
              <Input
                label="Username"
                type="text"
                {...credentialsForm.register('username', { 
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' }
                })}
                error={credentialsForm.formState.errors.username?.message}
                placeholder="Enter your username"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  {...credentialsForm.register('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  error={credentialsForm.formState.errors.password?.message}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Sign In
              </Button>
            </form>
          )}

          {/* Admin Key Login Form */}
          {loginType === 'adminKey' && (
            <form onSubmit={adminKeyForm.handleSubmit(handleAdminKeyLogin)} className="space-y-4">
              <Input
                label="Admin Key"
                type="password"
                {...adminKeyForm.register('adminKey', { 
                  required: 'Admin key is required',
                  minLength: { value: 10, message: 'Admin key must be at least 10 characters' }
                })}
                error={adminKeyForm.formState.errors.adminKey?.message}
                placeholder="Enter your admin key"
                helperText="Use your system admin key for quick access"
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Authenticate
              </Button>
            </form>
          )}

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Demo Credentials:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Username:</strong> testadmin</p>
              <p><strong>Password:</strong> Admin123!</p>
              <p><strong>Admin Key:</strong> your_super_secret_admin_key_2024</p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 Travel Booking System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}