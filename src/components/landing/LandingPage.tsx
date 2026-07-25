'use client';

import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection';
import { StatsSection } from './StatsSection';
import { GallerySection } from './GallerySection';
import { AnnouncementsSection } from './AnnouncementsSection';
import { OfficersSection } from './OfficersSection';
import { AchievementsSection } from './AchievementsSection';
import { TimelineSection } from './TimelineSection';
import { ContactSection } from './ContactSection';
import { LandingNavbar } from './LandingNavbar';
import { LandingFooter } from './LandingFooter';
import { ParticlesBackground } from '../ui/ParticlesBackground';
import { MouseGlow } from '../ui/MouseGlow';

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <ParticlesBackground />
      <MouseGlow />
      
      {/* Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[128px] animate-pulse delay-1000" />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-500/10 rounded-full blur-[128px] animate-pulse delay-2000" />
      </div>

      <div className="relative z-10">
        <LandingNavbar />
        <HeroSection />
        <AboutSection />
        <StatsSection />
        <GallerySection />
        <AnnouncementsSection />
        <OfficersSection />
        <AchievementsSection />
        <TimelineSection />
        <ContactSection />
        <LandingFooter />
      </div>
    </div>
  );
}
