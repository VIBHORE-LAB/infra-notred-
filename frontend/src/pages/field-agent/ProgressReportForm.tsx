import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, MapPinned } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProgressReport } from '../../hooks/useProgressReport';

const ProgressReportForm: React.FC = () => {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { submitReport, submitLoading, error } = useProgressReport();
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const fileCountLabel = useMemo(() => {
    if (selectedFiles.length === 0) return 'No files selected';
    if (selectedFiles.length === 1) return selectedFiles[0].name;
    return `${selectedFiles.length} files selected`;
  }, [selectedFiles]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectId) {
      toast.error('This form needs a project id in the URL.');
      return;
    }

    if (!description.trim() || !latitude || !longitude) {
      toast.error('Fill in the description and coordinates first.');
      return;
    }

    const result = await submitReport(projectId, latitude, longitude, description, selectedFiles);
    if (result) {
      toast.success('Field report submitted.');
      setDescription('');
      setLatitude('');
      setLongitude('');
      setSelectedFiles([]);
      navigate(`/projects/${projectId}`);
    } else {
      toast.error('Unable to submit the report.');
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <Button variant="outline" className="w-fit rounded-xl" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="page-section">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Submit field report</h2>
          <p className="section-copy">
            Add a short operational update, attach photo evidence, and capture the location coordinates from the site.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="page-section space-y-6">
        <div className="space-y-2">
          <Label htmlFor="description">Site update</Label>
          <Textarea
            id="description"
            placeholder="Describe progress, blockers, or observations from the site."
            className="min-h-36 rounded-2xl"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <div className="relative">
              <MapPinned className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="latitude"
                type="number"
                step="any"
                className="h-11 rounded-xl pl-10"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <div className="relative">
              <MapPinned className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="longitude"
                type="number"
                step="any"
                className="h-11 rounded-xl pl-10"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="images">Photos</Label>
          <label
            htmlFor="images"
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <span>{fileCountLabel}</span>
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <ImagePlus className="h-4 w-4" />
              Choose files
            </span>
          </label>
          <Input
            id="images"
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              setSelectedFiles(Array.from(event.target.files ?? []));
            }}
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" disabled={submitLoading} className="rounded-xl">
          {submitLoading ? 'Submitting…' : 'Submit report'}
        </Button>
      </form>
    </div>
  );
};

export default ProgressReportForm;
