'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import Layout from '../../../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import { routesAPI } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface Route {
  id: string;
  from: string;
  to: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface RouteForm {
  from: string;
  to: string;
  description: string;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RouteForm>();

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await routesAPI.getAll();
      if (response.success) {
        setRoutes(response.data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to fetch routes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoute = () => {
    setEditingRoute(null);
    reset();
    setIsModalOpen(true);
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    reset({
      from: route.from,
      to: route.to,
      description: route.description,
    });
    setIsModalOpen(true);
  };

  const handleDeleteRoute = async (route: Route) => {
    if (!confirm(`Are you sure you want to delete the route from ${route.from} to ${route.to}?`)) {
      return;
    }

    try {
      await routesAPI.delete(route.id);
      toast.success('Route deleted successfully');
      fetchRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Failed to delete route');
    }
  };

  const onSubmit = async (data: RouteForm) => {
    setIsSubmitting(true);
    try {
      if (editingRoute) {
        await routesAPI.update(editingRoute.id, data);
        toast.success('Route updated successfully');
      } else {
        await routesAPI.create(data);
        toast.success('Route created successfully');
      }
      setIsModalOpen(false);
      fetchRoutes();
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error(`Failed to ${editingRoute ? 'update' : 'create'} route`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
            <p className="text-gray-600">Manage travel routes and destinations</p>
          </div>
          <Button onClick={handleCreateRoute} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Route</span>
          </Button>
        </div>

        {/* Routes Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>All Routes</span>
            </CardTitle>
          </CardHeader>
          <CardContent padding={false}>
            {isLoading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : routes.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No routes found</p>
                <p className="text-sm">Create your first route to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.from}</TableCell>
                      <TableCell className="font-medium">{route.to}</TableCell>
                      <TableCell className="text-gray-600">
                        {route.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          route.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {route.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(route.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRoute(route)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRoute(route)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Route Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingRoute ? 'Edit Route' : 'Create New Route'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="From"
              {...register('from', { 
                required: 'Origin city is required',
                minLength: { value: 2, message: 'Origin must be at least 2 characters' }
              })}
              error={errors.from?.message}
              placeholder="e.g., Colombo"
            />

            <Input
              label="To"
              {...register('to', { 
                required: 'Destination city is required',
                minLength: { value: 2, message: 'Destination must be at least 2 characters' }
              })}
              error={errors.to?.message}
              placeholder="e.g., Kandy"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Optional description of the route"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {editingRoute ? 'Update Route' : 'Create Route'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}