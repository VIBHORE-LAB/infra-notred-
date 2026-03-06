import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography, MenuItem } from '@mui/material';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import { useProgressReport } from '../../hooks/useProgressReport';
import { Project, useProjects } from '../../hooks/useProjects';

const ProgressReportForm: React.FC = () => {
  const [projectId, setProjectId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { fetchAllProjects, projects, loading: projectsLoading } = useProjects();
  const { submitReport, submitLoading, error } = useProgressReport();

  useEffect(() => {
    fetchAllProjects();
  }, [fetchAllProjects]);

  const fillLocationFromDevice = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsError('');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setGpsLoading(false);
      },
      () => {
        setGpsError('Unable to auto-detect GPS. You can fill latitude/longitude manually.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  useEffect(() => {
    fillLocationFromDevice();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!projectId || !latitude || !longitude || !files || files.length === 0) {
      alert('Please fill project, location, and attach at least one image.');
      return;
    }

    const result = await submitReport(projectId, latitude, longitude, description, files);
    if (result) {
      setSuccessMessage('Progress report submitted successfully.');
      setDescription('');
      setFiles(null);
      fillLocationFromDevice();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="app-surface p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Typography variant="h5" className="font-semibold text-slate-900 mb-2">
              Field Progress Report
            </Typography>
            <p className="text-sm muted-text">
              Submit geo-tagged evidence from the site and keep the project timeline updated.
            </p>
          </div>
          <Link
            to="/field-agent/reports"
            className="rounded-xl border border-[#0f5fa8] px-4 py-2 text-sm font-semibold text-[#0f5fa8] hover:bg-[#eef6ff]"
          >
            View Past Reports
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="min-w-0 md:col-span-2">
              <TextInput
                label="Project"
                name="projectId"
                value={projectId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectId(e.target.value)}
                select
                helperText={projectsLoading ? 'Loading projects...' : 'Choose the project for this field report'}
              >
                {projects.map((project: Project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name} ({project.location?.city}, {project.location?.state})
                  </MenuItem>
                ))}
              </TextInput>
            </div>

            <div className="min-w-0">
              <TextInput
                label="Latitude"
                name="latitude"
                value={latitude}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLatitude(e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <TextInput
                label="Longitude"
                name="longitude"
                value={longitude}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            {gpsLoading ? (
              <span className="text-slate-600">Detecting GPS from device...</span>
            ) : gpsError ? (
              <span className="text-amber-700">{gpsError}</span>
            ) : (
              <span className="text-emerald-700">GPS auto-filled from your current location.</span>
            )}
          </div>

          <TextInput
            label="Remarks / Observation"
            name="description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            multiline
            minRows={4}
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Typography variant="body2" className="text-slate-700 font-semibold mb-2">
              Site Images
            </Typography>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(e.target.files)}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#dff0ff] file:text-[#0f5fa8] hover:file:bg-[#cbe7ff]"
            />
            <p className="text-xs text-slate-500 mt-2">Upload one or more clear images from the current site visit.</p>
          </div>

          {successMessage && (
            <Typography variant="body2" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
              {successMessage}
            </Typography>
          )}
          {error && (
            <Typography color="error" variant="body2" className="rounded-lg border border-red-200 bg-red-50 p-3">
              {error}
            </Typography>
          )}

          <Button type="submit" variantType="primary" disabled={submitLoading}>
            {submitLoading ? 'Uploading report...' : 'Submit Report'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProgressReportForm;
