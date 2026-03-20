import React, { useMemo, useState } from 'react';
import { Camera, PencilLine, Phone, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const Profile: React.FC = () => {
  const { user, loading, uploadingAvatar, error, saveProfile, uploadAvatar } = useProfile();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const initials = useMemo(
    () => `${firstName.charAt(0)}${lastName.charAt(0)}`.trim().toUpperCase() || 'U',
    [firstName, lastName]
  );

  React.useEffect(() => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setPhone(user?.phone ?? '');
    setBio(user?.bio ?? '');
  }, [user?.bio, user?.firstName, user?.lastName, user?.phone]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await saveProfile({ firstName, lastName, phone, bio });
    if (result) {
      toast.success('Profile updated.');
    } else {
      toast.error('Unable to update the profile.');
    }
  };

  const handleAvatarChange = async (file?: File | null) => {
    if (!file) return;
    const uploadedUrl = await uploadAvatar(file);
    if (uploadedUrl) {
      toast.success('Avatar updated.');
    } else {
      toast.error('Unable to upload the avatar.');
    }
  };

  return (
    <div className="page-grid">
      <Card className="border-border/80">
        <CardHeader className="gap-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>My profile</CardTitle>
              <CardDescription className="mt-1">
                Keep your name, phone number, bio, and avatar up to date across the workspace.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
          <div className="space-y-5">
            <div className="soft-panel flex flex-col items-center text-center">
              <Avatar size="lg" className="h-24 w-24">
                <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.email || 'User avatar'} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <h2 className="mt-4 text-xl font-semibold text-foreground">
                {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Team member'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{user?.email || 'No email available'}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {user?.role || 'User'}
              </p>

              <label className="mt-5 w-full">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void handleAvatarChange(event.target.files?.[0])}
                />
                <span className="file-picker inline-flex cursor-pointer items-center justify-center gap-2">
                  <Camera className="h-4 w-4" />
                  {uploadingAvatar ? 'Uploading avatar…' : 'Upload avatar'}
                </span>
              </label>
            </div>

            <div className="soft-panel space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary" />
                <span>Role-based access is tied to your account role.</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>Phone and bio help teammates identify the right contact quickly.</span>
              </div>
            </div>
          </div>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Edit details</CardTitle>
              <CardDescription>Changes are applied to your active workspace profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSave}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input
                      id="first-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input
                      id="last-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-address">Email</Label>
                  <Input
                    id="email-address"
                    value={user?.email ?? ''}
                    className="h-11 rounded-xl"
                    disabled
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value={user?.role ?? ''} className="h-11 rounded-xl" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-number">Phone</Label>
                    <Input
                      id="phone-number"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    className="rounded-xl"
                    rows={6}
                    placeholder="Add a short introduction or role summary."
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="rounded-xl" disabled={loading}>
                  <PencilLine className="h-4 w-4" />
                  {loading ? 'Saving…' : 'Save changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
