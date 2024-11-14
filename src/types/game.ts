export interface Vote {
  id: string;
  user: string;
  game: string;
  score: number;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  url: string;
  picture_url: string;
  submitted_by: string;
  expand?: {
    votes: Vote[];
  };
} 