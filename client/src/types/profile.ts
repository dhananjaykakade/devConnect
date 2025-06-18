export type Profile = {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  techStack: string[]; // Changed to string array
};