export interface Vote {
  id: string;
  user: string;
  game: string;
  score: number;
  expand?: {
    user?: {
      name: string;
      avatarUrl: string;
    }
  }
}

export interface Game {
  id: string;
  name: string;
  description: string;
  url: string;
  picture_url: string;
  submitted_by: string;
  isActive: boolean;
  expand?: {
    votes: Vote[];
  };
} 