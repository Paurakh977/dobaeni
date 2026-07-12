"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import SmoothScroll from "./SmoothScroll";
import CustomCursor from "./CustomCursor";
import Preloader from "./Preloader";
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

  return (
    <div className="dobaeni-page">
      <div className="dobaeni-noise" />

      <AnimatePresence>
        {loading && <Preloader onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      <CustomCursor />

      <SmoothScroll>
        <Navbar />
        <main>
          <Hero isIntro={!loading} />
          <Marquee />
          <RevealSection />
          <GallerySection />
          <FeaturesSection />
          <ManifestoSection />
        </main>
        <Footer />
      </SmoothScroll>
    </div>
  );
}
