import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/auth/",
          "/onboarding/",
          "/membership/",
        ],
      },
    ],
    sitemap: "https://semzoprive.com/sitemap.xml",
    host: "https://semzoprive.com",
  }
}
