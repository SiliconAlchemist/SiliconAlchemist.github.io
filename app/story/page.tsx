import type { Metadata } from 'next';
import { Profile } from '../profile';

export const metadata: Metadata = {
  title: 'My Story | Shrikant Garg',
  description: 'Shrikant Garg’s experience, education, projects, and technical skills.',
};

export default function StoryPage() {
  return (
    <main className="story-page">
      <nav className="story-navigation" aria-label="Story navigation">
        <a href="/">← Back to the island</a>
        <span>My Story</span>
      </nav>
      <Profile />
    </main>
  );
}
