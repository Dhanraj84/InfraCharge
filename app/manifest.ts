import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'InfraCharge',
    short_name: 'InfraCharge',
    description: 'EV Route Planner and Charging Finder for India',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#EF4444',
    icons: [
      {
        src: '/icon.png?v=2',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.png?v=2',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  }
}
