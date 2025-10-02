/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_VPIO_API_URL: process.env.NEXT_PUBLIC_VPIO_API_URL,
    NEXT_PUBLIC_VPIO_API_KEY: process.env.NEXT_PUBLIC_VPIO_API_KEY,
  },
}

module.exports = nextConfig