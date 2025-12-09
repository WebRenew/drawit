/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type checking enabled - errors will fail the build
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
