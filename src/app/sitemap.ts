import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://camora.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url:             BASE_URL,
      lastModified:    now,
      changeFrequency: "weekly",
      priority:        1.0,
    },
    {
      url:             `${BASE_URL}/cctv-storage-calculator`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.9,
    },
    {
      url:             `${BASE_URL}/ip-camera-bandwidth-calculator`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.9,
    },
    {
      url:             `${BASE_URL}/raid-storage-calculator`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${BASE_URL}/nvr-storage-estimator`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.8,
    },
  ];
}
