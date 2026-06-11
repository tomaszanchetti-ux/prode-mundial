export type AuthContext = {
  userId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  photoUrl: string | null;
};
