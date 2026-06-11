/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'qcepxveeuscqvsuhbqyd.supabase.co' },
      { protocol: 'https', hostname: 'mintong.netlify.app' },
    ],
  },
}
module.exports = nextConfig
