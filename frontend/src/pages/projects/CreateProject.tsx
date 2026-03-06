import React, { useState } from 'react';
import { Typography, MenuItem } from '@mui/material';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import { useProjects } from '../../hooks/useProjects';

const PROJECT_STATUSES = ['Planned', 'In Progress', 'On Hold', 'Completed'];
const PROJECT_TYPES = ['Road', 'Bridge', 'Building', 'Water Supply', 'Electricity', 'Other'];

const CreateProject: React.FC = () => {
  const { createProject, loading, error } = useProjects();
  const [form, setForm] = useState({
    name: '',
    description: '',
    estimatedBudget: '',
    fundingSource: '',
    startDate: '',
    endDate: '',
    deadline: '',
    status: 'Planned',
    projectType: 'Road',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    areaInSqFt: '',
    teamsize: '',
  });
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    const payload = {
      ...form,
      estimatedBudget: parseFloat(form.estimatedBudget),
      areaInSqFt: parseFloat(form.areaInSqFt),
      teamsize: parseInt(form.teamsize, 10),
    };

    const result = await createProject(payload);
    if (result) {
      setSuccess(true);
      setForm({
        name: '',
        description: '',
        estimatedBudget: '',
        fundingSource: '',
        startDate: '',
        endDate: '',
        deadline: '',
        status: 'Planned',
        projectType: 'Road',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        areaInSqFt: '',
        teamsize: '',
      });
    }
  };

  return (
    <div className="app-surface p-6 md:p-8 max-w-4xl mx-auto">
      <Typography variant="h5" className="font-semibold text-slate-900 mb-2">
        New Infrastructure Project
      </Typography>
      <p className="text-sm muted-text mb-6">All fields are aligned in one uniform form for easy input.</p>

      {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">Project created successfully.</div>}
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">{error}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0 md:col-span-2">
          <TextInput
            label="Project Name"
            name="name"
            value={form.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
          />
        </div>

        <div className="min-w-0 md:col-span-2">
          <TextInput
            label="Description"
            name="description"
            value={form.description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('description', e.target.value)}
            multiline
            minRows={3}
          />
        </div>

        <div className="min-w-0">
          <TextInput
            label="Funding Source"
            name="fundingSource"
            value={form.fundingSource}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('fundingSource', e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <TextInput
            label="Estimated Budget (INR)"
            name="estimatedBudget"
            type="number"
            value={form.estimatedBudget}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('estimatedBudget', e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <TextInput
            label="Team Size"
            name="teamsize"
            type="number"
            value={form.teamsize}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('teamsize', e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <TextInput
            label="Start Date"
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('startDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </div>

        <div className="min-w-0">
          <TextInput
            label="End Date"
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('endDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </div>

        <div className="min-w-0">
          <TextInput
            label="Delivery Deadline"
            name="deadline"
            type="date"
            value={form.deadline}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('deadline', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </div>

        <div className="min-w-0">
          <TextInput
            label="Status"
            name="status"
            value={form.status}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('status', e.target.value)}
            select
          >
            {PROJECT_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextInput>
        </div>

        <div className="min-w-0">
          <TextInput
            label="Project Type"
            name="projectType"
            value={form.projectType}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('projectType', e.target.value)}
            select
          >
            {PROJECT_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextInput>
        </div>

        <div className="min-w-0">
          <TextInput
            label="City"
            name="city"
            value={form.city}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('city', e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <TextInput
            label="State"
            name="state"
            value={form.state}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('state', e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <TextInput
            label="Country"
            name="country"
            value={form.country}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('country', e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <TextInput
            label="Zip Code"
            name="zipCode"
            value={form.zipCode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('zipCode', e.target.value)}
          />
        </div>

        <div className="min-w-0 md:col-span-2">
          <TextInput
            label="Site Area (sq ft)"
            name="areaInSqFt"
            type="number"
            value={form.areaInSqFt}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('areaInSqFt', e.target.value)}
          />
        </div>

        <div className="pt-2 md:col-span-2">
          <Button type="submit" variantType="primary" disabled={loading} fullWidth>
            {loading ? 'Creating project...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;
