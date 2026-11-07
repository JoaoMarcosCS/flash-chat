export interface PublicUser {
  id: string;
  name: string;
  nickname: string;
}

export interface UserProfile extends PublicUser {
  email: string;
}
