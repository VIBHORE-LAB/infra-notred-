import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography } from '@mui/material';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import { useLogin } from '../../hooks/useLogin';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useLogin();
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async () => {
    if (!email || !password) {
      alert('Please fill in both email and password');
      return;
    }

    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Use your company credentials to access the infrastructure command center."
      footer={(
        <>
          No account yet?{' '}
          <button className="font-semibold text-[#0f5fa8] hover:underline" onClick={() => navigate('/register')}>
            Create one
          </button>
        </>
      )}
    >
      <div className="space-y-4 gap-2 flex flex-col">
        <TextInput
          label="Work Email"
          name="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          
        />
        <TextInput
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        />

        {error && (
          <Typography color="error" variant="body2" className="rounded-lg border border-red-200 bg-red-50 p-2 text-center">
            {error}
          </Typography>
        )}

        <Button onClick={handleSubmit} variantType="primary" disabled={loading} fullWidth>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
    </AuthLayout>
  );
};

export default Login;
