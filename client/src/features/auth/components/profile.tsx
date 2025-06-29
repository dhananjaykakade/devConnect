import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus, X, Edit2, Save, Loader2, Upload, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import type { Profile } from '@/types/profile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

type User = {
  id: string;
  username: string;
  name: string;
  avatar: string;
};

export function ProfileComponent() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [newTech, setNewTech] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  // Followers/Following dialog state
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setProfile(res.data.data);
      } catch (err) {
        toast.error('Failed to load profile');
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/auth/profile', profile);
      toast.success('Profile updated');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const addTechStack = () => {
    if (newTech.trim()) {
      setProfile((prev) => ({
        ...prev!,
        techStack: [...prev!.techStack, newTech.trim()],
      }));
      setNewTech('');
    }
  };

  const removeTechStack = (index: number) => {
    setProfile((prev) => ({
      ...prev!,
      techStack: prev!.techStack.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'devconnect_unsigned');

      const res = await fetch('https://api.cloudinary.com/v1_1/dzfzgizf1/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        setProfile((prev) => ({
          ...prev!,
          avatar: data.secure_url,
        }));
        toast.success('Avatar updated');
      }
    } catch (err) {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const fetchFollowers = async () => {
    if (!profile) return;
    setIsLoadingFollowers(true);
    try {
      const res = await api.get(`/users/${profile.id}/followers`);
      setFollowers(res.data.data);
      setIsFollowersOpen(true);
    } catch (err) {
      toast.error('Failed to load followers');
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    if (!profile) return;
    setIsLoadingFollowing(true);
    try {
      const res = await api.get(`/users/${profile.id}/following`);
      setFollowing(res.data.data);
      setIsFollowingOpen(true);
    } catch (err) {
      toast.error('Failed to load following');
    } finally {
      setIsLoadingFollowing(false);
    }
  };

  const navigateToUserProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
    setIsFollowersOpen(false);
    setIsFollowingOpen(false);
  };

  if (!profile) return <div className="text-center mt-10">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar Section */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4">
          <Avatar className="w-28 h-28 border border-gray-200 shadow-sm relative">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback className="bg-gray-100 text-gray-800 text-2xl">
              {profile.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
            {isUploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full">
                <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
              </div>
            )}
          </Avatar>

          {/* Follow Stats */}
          <div className="flex gap-4 text-center">
            <button
              onClick={fetchFollowers}
              className="flex flex-col items-center hover:text-gray-900 transition-colors"
              disabled={isLoadingFollowers}
            >
              <span className="font-semibold">{profile.followersCount || 0}</span>
              <span className="text-sm text-gray-600">Followers</span>
            </button>
            <button
              onClick={fetchFollowing}
              className="flex flex-col items-center hover:text-gray-900 transition-colors"
              disabled={isLoadingFollowing}
            >
              <span className="font-semibold">{profile.followingCount || 0}</span>
              <span className="text-sm text-gray-600">Following</span>
            </button>
          </div>

          {isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1" /> Change Avatar
              </Button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageUpload}
              />
            </>
          )}
        </div>

        {/* Profile Details */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-1" /> Edit Profile
              </Button>
            )}
          </div>

          {/* Fields */}
          {['username', 'email', 'bio'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              {isEditing ? (
                field === 'bio' ? (
                  <Textarea
                    value={(profile as any)[field]}
                    onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
                    className="bg-gray-50 min-h-[80px]"
                  />
                ) : (
                  <Input
                    type={field === 'email' ? 'email' : 'text'}
                    value={(profile as any)[field]}
                    onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
                    className="bg-gray-50"
                  />
                )
              ) : (
                <p className="text-gray-900">
                  {field === 'username' ? `@${(profile as any)[field]}` : (profile as any)[field]}
                </p>
              )}
            </div>
          ))}

          {/* Tech Stack */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tech Stack
            </label>
            <div className="flex flex-wrap gap-2">
              {profile.techStack.map((tech, index) => (
                <div
                  key={index}
                  className="px-3 py-1 rounded-full bg-gray-100 border text-sm flex items-center gap-1"
                >
                  {tech}
                  {isEditing && (
                    <button
                      onClick={() => removeTechStack(index)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isEditing && (
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Add tech"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  className="bg-gray-50 flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addTechStack()}
                />
                <Button variant="outline" size="sm" onClick={addTechStack}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Followers Dialog */}
      <Dialog open={isFollowersOpen} onOpenChange={setIsFollowersOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Followers ({followers.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {followers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No followers yet</p>
            ) : (
              followers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => navigateToUserProfile(user.id)}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={isFollowingOpen} onOpenChange={setIsFollowingOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Following ({following.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {following.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Not following anyone yet</p>
            ) : (
              following.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => navigateToUserProfile(user.id)}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}