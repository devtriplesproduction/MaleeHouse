"use client";
import React from "react";

export default function TestErrorPage() {
  // This will throw during SSR or client render immediately
  if (typeof window === 'undefined') {
    throw new Error("REAL Server/React Error Boundary Test: Cannot read properties of undefined (reading 'test')");
  }

  return <div>Loading...</div>;
}
