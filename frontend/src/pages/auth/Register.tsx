import * as React from 'react';
import { Box, Typography } from "@mui/material";
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import { useRegister } from '../../hooks/useRegister';
import { useState } from "react";
interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "" 
  });

  const { loading, error, register } = useRegister();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
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
      alert("Registration successful!");
      // Optionally reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={2} maxWidth={400} mx="auto">
      <Typography variant="h4">Register</Typography>

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
      <TextInput
        label="Email"
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
        value={formData.confirmPassword ?? ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.name, e.target.value)}
      />

      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}

      <Button onClick={handleSubmit} variantType='warning' disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </Button>
    </Box>
  );
};

export default Register;
