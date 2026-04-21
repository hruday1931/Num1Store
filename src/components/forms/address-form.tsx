'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import { MapPin, User, Phone, Building, Mailbox } from 'lucide-react';

interface AddressFormData {
  full_name: string;
  street_address: string;
  city: string;
  state: string;
  pin_code: string;
  phone_number: string;
}

interface AddressFormProps {
  initialData?: Partial<AddressFormData>;
  onSave: (address: AddressFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AddressForm({ initialData, onSave, onCancel, loading = false }: AddressFormProps) {
  const { success, error: showError } = useToast();
  
  const [formData, setFormData] = useState<AddressFormData>({
    full_name: initialData?.full_name || '',
    street_address: initialData?.street_address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pin_code: initialData?.pin_code || '',
    phone_number: initialData?.phone_number || '',
  });

  const [errors, setErrors] = useState<Partial<AddressFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<AddressFormData> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.street_address.trim()) {
      newErrors.street_address = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pin_code.trim()) {
      newErrors.pin_code = 'Pin code is required';
    } else if (!/^\d{6}$/.test(formData.pin_code)) {
      newErrors.pin_code = 'Please enter a valid 6-digit pin code';
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone_number.replace(/\D/g, ''))) {
      newErrors.phone_number = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fill in all required fields correctly');
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (field: keyof AddressFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          <User className="inline w-4 h-4 mr-1 text-gray-700" />
          Full Name *
        </label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => handleInputChange('full_name', e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors placeholder-gray-500 text-black bg-white font-medium ${
            errors.full_name ? 'border-red-500' : 'border-gray-300'
          }`}
          style={{ color: 'black' }}
          placeholder="John Doe"
          disabled={loading}
        />
        {errors.full_name && (
          <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          <Building className="inline w-4 h-4 mr-1 text-gray-700" />
          Street Address *
        </label>
        <textarea
          value={formData.street_address}
          onChange={(e) => handleInputChange('street_address', e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-none placeholder-gray-500 text-black bg-white font-medium ${
            errors.street_address ? 'border-red-500' : 'border-gray-300'
          }`}
          style={{ color: 'black' }}
          placeholder="123 Main Street, Apt 4B"
          rows={2}
          disabled={loading}
        />
        {errors.street_address && (
          <p className="mt-1 text-sm text-red-600">{errors.street_address}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            <MapPin className="inline w-4 h-4 mr-1 text-gray-700" />
            City *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors placeholder-gray-500 text-black bg-white font-medium ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            style={{ color: 'black' }}
            placeholder="Mumbai"
            disabled={loading}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            State *
          </label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors placeholder-gray-500 text-black bg-white font-medium ${
            errors.state ? 'border-red-500' : 'border-gray-300'
          } text-lg`}
            style={{ color: 'black' }}
            placeholder="Maharashtra"
            disabled={loading}
          />
          {errors.state && (
            <p className="mt-1 text-sm text-red-600">{errors.state}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            <Mailbox className="inline w-4 h-4 mr-1 text-gray-700" />
            Pin Code *
          </label>
          <input
            type="text"
            value={formData.pin_code}
            onChange={(e) => handleInputChange('pin_code', e.target.value.replace(/\D/g, '').slice(0, 6))}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors placeholder-gray-500 text-lg text-black bg-white font-medium ${
            errors.pin_code ? 'border-red-500' : 'border-gray-300'
          }`}
            style={{ color: 'black' }}
            placeholder="400001"
            maxLength={6}
            disabled={loading}
          />
          {errors.pin_code && (
            <p className="mt-1 text-sm text-red-600">{errors.pin_code}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            <Phone className="inline w-4 h-4 mr-1 text-gray-700" />
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone_number}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
              handleInputChange('phone_number', value);
            }}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors placeholder-gray-500 text-lg text-black bg-white font-medium ${
              errors.phone_number ? 'border-red-500' : 'border-gray-300'
            }`}
            style={{ color: 'black' }}
            placeholder="9876543210"
            maxLength={10}
            disabled={loading}
          />
          {errors.phone_number && (
            <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 flex-1"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            'Save Address'
          )}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
