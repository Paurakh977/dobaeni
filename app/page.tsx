"use client";

import { useState, useEffect } from "react";
import Preloader from "./Preloader";
import CustomCursor from "./CustomCursor";
import SmoothScroll from "./SmoothScroll";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Marquee from "./Marquee";
import RevealSection from "./RevealSection";
import GallerySection from "./GallerySection";
import FeaturesSection from "./FeaturesSection";
import ManifestoSection from "./ManifestoSection";
import Footer from "./Footer";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Preloader onComplete={() => setLoading(false)} />;
  }

  return (
    <SmoothScroll>
      <CustomCursor />
      <Navbar />
      <main>
        <Hero isIntro />
        <Marquee />
        <RevealSection />
        <GallerySection />
        <FeaturesSection />
        <ManifestoSection />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
