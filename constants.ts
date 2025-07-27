import type { Language, SocialPlatform, Tone } from './types';
import { 
  TwitterIcon, LinkedInIcon, FacebookIcon, InstagramIcon, ThreadsIcon, YouTubeIcon, 
  TikTokIcon, PinterestIcon, RedditIcon, TumblrIcon, QuoraIcon, WhatsAppIcon, 
  SnapchatIcon, DiscordIcon, TwitchIcon, WeChatIcon 
} from './components/icons';

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  // Major Social
  { id: 'facebook', name: 'Facebook', charLimit: 63206, icon: FacebookIcon, brandColor: '#1877F2' },
  { id: 'instagram', name: 'Instagram', charLimit: 2200, icon: InstagramIcon, brandColor: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' },
  { id: 'twitter', name: 'Twitter (X)', charLimit: 280, icon: TwitterIcon, brandColor: '#000000' },
  { id: 'threads', name: 'Threads', charLimit: 500, icon: ThreadsIcon, brandColor: '#000000' },
  { id: 'linkedin', name: 'LinkedIn', charLimit: 3000, icon: LinkedInIcon, brandColor: '#0A66C2' },
  // Visual
  { id: 'pinterest', name: 'Pinterest', charLimit: 500, icon: PinterestIcon, brandColor: '#E60023' },
  { id: 'tiktok', name: 'TikTok', charLimit: 2200, icon: TikTokIcon, brandColor: '#000000' },
  { id: 'douyin', name: 'Douyin', charLimit: 2200, icon: TikTokIcon, brandColor: '#000000' },
  { id: 'snapchat', name: 'Snapchat', charLimit: 250, icon: SnapchatIcon, brandColor: '#FFFC00', textColor: '#000000' },
  { id: 'youtube', name: 'YouTube', charLimit: 10000, icon: YouTubeIcon, brandColor: '#FF0000' },
  // Community & Text
  { id: 'reddit', name: 'Reddit', charLimit: 40000, icon: RedditIcon, brandColor: '#FF4500' },
  { id: 'tumblr', name: 'Tumblr', charLimit: 10000, icon: TumblrIcon, brandColor: '#36465D' },
  { id: 'quora', name: 'Quora', charLimit: 10000, icon: QuoraIcon, brandColor: '#B92B27' },
  // Messaging & Other
  { id: 'whatsapp', name: 'WhatsApp', charLimit: 700, icon: WhatsAppIcon, brandColor: '#25D366' },
  { id: 'discord', name: 'Discord', charLimit: 2000, icon: DiscordIcon, brandColor: '#5865F2' },
  { id: 'wechat', name: 'WeChat', charLimit: 2000, icon: WeChatIcon, brandColor: '#09B83E' },
  { id: 'twitch', name: 'Twitch', charLimit: 140, icon: TwitchIcon, brandColor: '#9146FF' },
];

export const SUPPORTED_LANGUAGES: Language[] = [
  { name: 'English', code: 'en-US' },
  { name: 'Hindi', code: 'hi-IN' },
  { name: 'Bengali', code: 'bn-IN' },
  { name: 'Telugu', code: 'te-IN' },
  { name: 'Marathi', code: 'mr-IN' },
  { name: 'Tamil', code: 'ta-IN' },
  { name: 'Gujarati', code: 'gu-IN' },
  { name: 'Urdu', code: 'ur-IN' },
  { name: 'Kannada', code: 'kn-IN' },
  { name: 'Odia', code: 'or-IN' },
  { name: 'Malayalam', code: 'ml-IN' },
  { name: 'Punjabi', code: 'pa-IN' },
  { name: 'Assamese', code: 'as-IN' },
  { name: 'Japanese', code: 'ja-JP' },
  { name: 'Spanish', code: 'es-ES' },
  { name: 'Chinese (Simplified)', code: 'zh-CN' },
  { name: 'Afrikaans', code: 'af-ZA' },
  { name: 'Arabic (Egypt)', code: 'ar-EG' },
  { name: 'Basque', code: 'eu-ES' },
  { name: 'Catalan', code: 'ca-ES' },
  { name: 'Czech', code: 'cs-CZ' },
  { name: 'Dutch', code: 'nl-NL' },
  { name: 'Finnish', code: 'fi-FI' },
  { name: 'French', code: 'fr-FR' },
  { name: 'Galician', code: 'gl-ES' },
  { name: 'German', code: 'de-DE' },
  { name: 'Greek', code: 'el-GR' },
  { name: 'Hebrew', code: 'he-IL' },
  { name: 'Hungarian', code: 'hu-HU' },
  { name: 'Icelandic', code: 'is-IS' },
  { name: 'Indonesian', code: 'id-ID' },
  { name: 'Italian', code: 'it-IT' },
  { name: 'Korean', code: 'ko-KR' },
];

export const TONES: Tone[] = [
    { id: 'default', name: 'Default', instruction: 'Act as an expert social media manager.' },
    { id: 'professional', name: 'Professional', instruction: 'Adopt a formal, professional, and business-oriented tone.' },
    { id: 'casual', name: 'Casual', instruction: 'Use a friendly, relaxed, and conversational tone.' },
    { id: 'witty', name: 'Witty', instruction: 'Inject clever humor and wit into the post.' },
    { id: 'inspirational', name: 'Inspirational', instruction: 'Write in a motivational and inspiring tone.' },
    { id: 'urgent', name: 'Urgent', instruction: 'Create a sense of urgency and encourage immediate action.' },
];
