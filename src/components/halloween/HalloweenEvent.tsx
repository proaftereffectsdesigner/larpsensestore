"use client";

import React from "react";
import SpiderWeb from "./SpiderWeb";
import { HALLOWEEN_EVENT_ENABLED } from "./HalloweenConfig";

export default function HalloweenEvent() {
  if (!HALLOWEEN_EVENT_ENABLED) return null;

  return (
    <>
      {/* Top Right Corner Spiderweb & Hanging Dangling Spider */}
      <SpiderWeb />
    </>
  );
}
