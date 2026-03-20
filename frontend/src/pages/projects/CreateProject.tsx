import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import instance from '../../api/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface CreateProjectFormData {
  name: string;
  description: string;
  projectType: string;
  status: string;
  location: {
    city: string;
    state: string;
    country: string;
    zipCode: string;
    areaInSqFt: number;
  };
  timeline: {
    startDate: string;
    endDate: string;
    deadline: string;
  };
  funding: {
    estimatedBudget: number;
    fundingSource: string;
  };
}

const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<CreateProjectFormData>({
    name: '',
    description: '',
    projectType: 'Road',
    status: 'Planned',
    location: { city: '', state: '', country: 'India', zipCode: '000000', areaInSqFt: 1000 },
    funding: { estimatedBudget: 0, fundingSource: 'Government' },
    timeline: { startDate: '', endDate: '', deadline: new Date().toISOString().split('T')[0] },
  });

  const updateLocation = (field: keyof CreateProjectFormData['location'], value: string | number) => {
    setFormData((prev) => ({ ...prev, location: { ...prev.location, [field]: value } }));
  };

  const updateFunding = (field: keyof CreateProjectFormData['funding'], value: string | number) => {
    setFormData((prev) => ({ ...prev, funding: { ...prev.funding, [field]: value } }));
  };

  const updateTimeline = (field: keyof CreateProjectFormData['timeline'], value: string) => {
    setFormData((prev) => ({ ...prev, timeline: { ...prev.timeline, [field]: value } }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.description.trim() || !formData.location.city.trim() || !formData.location.state.trim()) {
      toast.error('Fill in the main project details first.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        projectType: formData.projectType,
        status: formData.status,
        city: formData.location.city,
        state: formData.location.state,
        country: formData.location.country,
        zipCode: formData.location.zipCode,
        areaInSqFt: Number(formData.location.areaInSqFt),
        startDate: formData.timeline.startDate,
        endDate: formData.timeline.endDate,
        deadline: formData.timeline.deadline,
        estimatedBudget: Number(formData.funding.estimatedBudget),
        fundingSource: formData.funding.fundingSource,
      };

      await instance.post('/projects/create', {
        req: { signature: 'create_project' },
        payload,
      });

      toast.success('Project created.');
      navigate('/dashboard');
    } catch {
      toast.error('Unable to create the project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <Button variant="outline" className="w-fit rounded-xl" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="page-section">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Create project</h2>
          <p className="section-copy">
            Add the core scope, schedule, budget, and location details. The rest of the workspace will build from this record.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="page-section space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" className="h-11 rounded-xl" value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              className="min-h-40 rounded-2xl"
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Project type</Label>
              <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, projectType: value }))} defaultValue={formData.projectType}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Road">Road</SelectItem>
                  <SelectItem value="Bridge">Bridge</SelectItem>
                  <SelectItem value="Building">Building</SelectItem>
                  <SelectItem value="Water">Water</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))} defaultValue={formData.status}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Choose status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="In Progress">In progress</SelectItem>
                  <SelectItem value="On Hold">On hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="page-section space-y-4">
            <h3 className="section-title">Location</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input className="h-11 rounded-xl" value={formData.location.city} onChange={(event) => updateLocation('city', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input className="h-11 rounded-xl" value={formData.location.state} onChange={(event) => updateLocation('state', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input className="h-11 rounded-xl" value={formData.location.country} onChange={(event) => updateLocation('country', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Zip code</Label>
                <Input className="h-11 rounded-xl" value={formData.location.zipCode} onChange={(event) => updateLocation('zipCode', event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Area in sq ft</Label>
                <Input type="number" className="h-11 rounded-xl" value={formData.location.areaInSqFt} onChange={(event) => updateLocation('areaInSqFt', Number(event.target.value))} />
              </div>
            </div>
          </div>

          <div className="page-section space-y-4">
            <h3 className="section-title">Funding and timeline</h3>
            <div className="space-y-2">
              <Label>Estimated budget</Label>
              <Input type="number" className="h-11 rounded-xl" value={formData.funding.estimatedBudget} onChange={(event) => updateFunding('estimatedBudget', Number(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Funding source</Label>
              <Input className="h-11 rounded-xl" value={formData.funding.fundingSource} onChange={(event) => updateFunding('fundingSource', event.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input type="date" className="h-11 rounded-xl" value={formData.timeline.startDate} onChange={(event) => updateTimeline('startDate', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input type="date" className="h-11 rounded-xl" value={formData.timeline.endDate} onChange={(event) => updateTimeline('endDate', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" className="h-11 rounded-xl" value={formData.timeline.deadline} onChange={(event) => updateTimeline('deadline', event.target.value)} />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-xl">
            {loading ? 'Creating…' : 'Create project'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;
