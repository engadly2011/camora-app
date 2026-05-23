"use client";

import { useState } from "react";
import { CalculatorShell } from "@/components/calculator/CalculatorShell";
import { HeroSection }     from "./HeroSection";

export function LandingPage() {
  const [showCalculator, setShowCalculator] = useState(false);

  if (showCalculator) {
    return <CalculatorShell />;
  }

  return <HeroSection onLaunch={() => setShowCalculator(true)} />;
}
