import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RPM Manager",
    short_name: "RPM",
    description: "Auto Repair Shop Management",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1d4ed8",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/icons/screenshot-desktop.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: "RPM Manager Dashboard",
      },
    ],
    categories: ["business", "productivity"],
    shortcuts: [
      {
        name: "New Work Order",
        url: "/work-orders/new",
        description: "Create a new work order",
      },
      {
        name: "New Customer",
        url: "/customers/new",
        description: "Add a new customer",
      },
      {
        name: "Inventory",
        url: "/inventory",
        description: "View parts inventory",
      },
    ],
  }
}
