'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Car, Image } from 'lucide-react';
import Layout from '../../../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import { vehiclesAPI, routesAPI } from '../../../lib/api';
import { formatDate, formatCurrency } from '../../../lib/utils';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  routeId: string;
  bookingType: string;
  seatCount: number;
  isAvailable: boolean;
  imageUrl?: string;
  pricePerSeat: number;
  createdAt: string;
  route?: {
    from: string;
    to: string;
  };
}

interface Route {
  id: string;
  from: string;
  to: string;
}

interface VehicleForm {
  name: string;
  type: string;
  routeId: string;
  bookingType: string;
  seatCount: number;
  pricePerSeat: number;
  imageUrl: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleForm>();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vehiclesResponse, routesResponse] = await Promise.all([
        vehiclesAPI.getAll(),
        routesAPI.getAll()
      ]);

      if (vehiclesResponse.success) {
        setVehicles(vehiclesResponse.data);
      }

      if (routesResponse.success) {
        setRoutes(routesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVehicle = () => {
    setEditingVehicle(null);
    reset({
      name: '',
      type: 'bus',
      routeId: '',
      bookingType: 'common',
      seatCount: 30,
      pricePerSeat: 1500,
      imageUrl: '',
    });
    setIsModalOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    reset({
      name: vehicle.name,
      type: vehicle.type,
      routeId: vehicle.routeId,
      bookingType: vehicle.bookingType,
      seatCount: vehicle.seatCount,
      pricePerSeat: vehicle.pricePerSeat,
      imageUrl: vehicle.imageUrl || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (!confirm(`Are you sure you want to delete ${vehicle.name}?`)) {
      return;
    }

    try {
      await vehiclesAPI.delete(vehicle.id);
      toast.success('Vehicle deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    }
  };

  const onSubmit = async (data: VehicleForm) => {
    setIsSubmitting(true);
    try {
      const vehicleData = {
        ...data,
        seatCount: Number(data.seatCount),
        pricePerSeat: Number(data.pricePerSeat),
      };

      if (editingVehicle) {
        await vehiclesAPI.update(editingVehicle.id, vehicleData);
        toast.success('Vehicle updated successfully');
      } else {
        await vehiclesAPI.create(vehicleData);
        toast.success('Vehicle created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error(`Failed to ${editingVehicle ? 'update' : 'create'} vehicle`);
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
            <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
            <p className="text-gray-600">Manage your fleet of vehicles</p>
          </div>
          <Button onClick={handleCreateVehicle} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Vehicle</span>
          </Button>
        </div>

        {/* Vehicles Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>All Vehicles</span>
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
            ) : vehicles.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Car className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No vehicles found</p>
                <p className="text-sm">Add your first vehicle to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Price/Seat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {vehicle.imageUrl ? (
                            <img
                              src={vehicle.imageUrl}
                              alt={vehicle.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Car className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{vehicle.name}</p>
                            <p className="text-sm text-gray-500 capitalize">{vehicle.bookingType}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{vehicle.type}</TableCell>
                      <TableCell>
                        {vehicle.route ? (
                          `${vehicle.route.from} → ${vehicle.route.to}`
                        ) : (
                          'No route assigned'
                        )}
                      </TableCell>
                      <TableCell>{vehicle.seatCount}</TableCell>
                      <TableCell>{formatCurrency(vehicle.pricePerSeat)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          vehicle.isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {vehicle.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(vehicle.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditVehicle(vehicle)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVehicle(vehicle)}
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

        {/* Create/Edit Vehicle Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingVehicle ? 'Edit Vehicle' : 'Create New Vehicle'}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Vehicle Name"
                {...register('name', { 
                  required: 'Vehicle name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                error={errors.name?.message}
                placeholder="e.g., Express Bus #1"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  {...register('type', { required: 'Vehicle type is required' })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="bus">Bus</option>
                  <option value="van">Van</option>
                  <option value="car">Car</option>
                </select>
                {errors.type && (
                  <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route
                </label>
                <select
                  {...register('routeId', { required: 'Route is required' })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select a route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.from} → {route.to}
                    </option>
                  ))}
                </select>
                {errors.routeId && (
                  <p className="text-sm text-red-600 mt-1">{errors.routeId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Type
                </label>
                <select
                  {...register('bookingType', { required: 'Booking type is required' })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="common">Common</option>
                  <option value="individual">Individual</option>
                  <option value="vip">VIP</option>
                </select>
                {errors.bookingType && (
                  <p className="text-sm text-red-600 mt-1">{errors.bookingType.message}</p>
                )}
              </div>

              <Input
                label="Seat Count"
                type="number"
                {...register('seatCount', { 
                  required: 'Seat count is required',
                  min: { value: 1, message: 'Must have at least 1 seat' },
                  max: { value: 100, message: 'Cannot exceed 100 seats' }
                })}
                error={errors.seatCount?.message}
                placeholder="30"
              />

              <Input
                label="Price per Seat (LKR)"
                type="number"
                step="0.01"
                {...register('pricePerSeat', { 
                  required: 'Price per seat is required',
                  min: { value: 0, message: 'Price must be positive' }
                })}
                error={errors.pricePerSeat?.message}
                placeholder="1500.00"
              />
            </div>

            <Input
              label="Image URL (Optional)"
              {...register('imageUrl')}
              error={errors.imageUrl?.message}
              placeholder="https://example.com/vehicle-image.jpg"
              helperText="Provide a URL to an image of the vehicle"
            />

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
                {editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}