import { useEffect, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  username: string;
  name: string;
  avatar: string;
};

type Profile = {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  techStack: string[];
  followersCount: number;
  followingCount: number;
};

export function OtherUserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Followers/Following dialog state
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/auth/user/${userId}`);
        setProfile(res.data.data);
      } catch (err) {
        toast.error('Failed to load profile');
        navigate('/'); // Redirect if profile doesn't exist
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, navigate]);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center mt-10">Profile not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar Section */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4">
          <Avatar className="w-28 h-28 border border-gray-200 shadow-sm">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback className="bg-gray-100 text-gray-800 text-2xl">
              {profile.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
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

          {/* Follow Button (you can implement follow functionality here) */}
          <Button variant="outline" className="w-full">
            Follow
          </Button>
        </div>

        {/* Profile Details */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
            <span className="text-gray-600">@{profile.username}</span>
          </div>

          {/* Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <p className="text-gray-900 whitespace-pre-line">
              {profile.bio || 'No bio yet'}
            </p>
          </div>

          {profile.email && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">{profile.email}</p>
            </div>
          )}

          {/* Tech Stack */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tech Stack
            </label>
            <div className="flex flex-wrap gap-2">
              {profile.techStack.length > 0 ? (
                profile.techStack.map((tech, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 rounded-full bg-gray-100 border text-sm"
                  >
                    {tech}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No technologies listed</p>
              )}
            </div>
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