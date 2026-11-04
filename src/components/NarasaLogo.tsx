"use client";

import React from "react";

interface NarasaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export default function NarasaLogo({
  size = "md",
  showText = true,
  subtitle = "Narasi Rasa • Konseling Kampus",
  className = "",
}: NarasaLogoProps) {
  const dimensions = {
    sm: "h-10 w-10 rounded-xl",
    md: "h-12 w-12 rounded-2xl",
    lg: "h-16 w-16 rounded-[20px]",
    xl: "h-24 w-24 rounded-[26px]",
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`${dimensions} shrink-0 overflow-hidden bg-[#FCFBF8] border-2 border-white shadow-[0_8px_20px_rgba(108,74,50,0.14)] flex items-center justify-center p-1`}
      >
        <img
          src="/logo-narasa.jpg"
          alt="Logo NARASA - Narasi Rasa"
          className="h-full w-full object-contain"
        />
      </div>

      {showText && (
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg font-extrabold tracking-wide text-[#5C3D28]">
              NARASA
            </span>
            <span className="rounded-full bg-[#E5EDE8] px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-[#4F6857]">
              Narasi Rasa
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] font-semibold text-[#7A7067] leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

