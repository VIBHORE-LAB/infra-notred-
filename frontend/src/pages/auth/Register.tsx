import React, { useState } from 'react';
import { Typography } from '@mui/material';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import { useRegister } from '../../hooks/useRegister';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { loading, error, register } = useRegister();
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    };

    const response = await register(payload);
    if (response) {
      alert('Registration successful! Please sign in.');
      navigate('/login');
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Set up your team access and start managing project delivery securely."
      footer={(
        <>
          Already have an account?{' '}
          <button className="font-semibold text-[#0f5fa8] hover:underline" onClick={() => navigate('/login')}>
            Sign in
          </button>
        </>
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.name, e.target.value)}
        />
        <TextInput
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.name, e.target.value)}
        />
      </div>

      <div className="space-y-4 mt-4">
        <TextInput
          label="Work Email"
          name="email"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.name, e.target.value)}
        />
        <TextInput
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.name, e.target.value)}
        />
        <TextInput
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.name, e.target.value)}
        />
      </div>

      {error && (
        <Typography color="error" variant="body2" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-2 text-center">
          {error}
        </Typography>
      )}

      <div className="mt-5">
        <Button onClick={handleSubmit} variantType="primary" disabled={loading} fullWidth>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </div>
    </AuthLayout>
  );
};

export default Register;
