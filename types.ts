
export interface SocialPlatform {
  id: string;
  name: string;
  charLimit: number;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  brandColor: string;
  textColor?: string;
}

export interface Language {
  name: string;
  code: string; // BCP 47 language code
}

export interface Tone {
  id: string;
  name: string;
  instruction: string;
}

export interface GeneratedContent {
  postText: string;
  hashtags: string[];
  bestTimeToPost: string;
  sources: { uri: string; title: string; }[] | null;
  userImage: string | null; // Image used for context.
}

export interface HistoryItem extends GeneratedContent {
  id:string;
  userInput: string;
  platformId: string;
  languageCode: string;
  toneId: string;
  useGoogleSearch: boolean;
  date: string; // ISO string for display
}