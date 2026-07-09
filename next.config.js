/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'qcepxveeuscqvsuhbqyd.supabase.co' },
      { protocol: 'https', hostname: 'mintong.netlify.app' },
      { protocol: 'https', hostname: 'img.youtube.com' }, // 유튜브 영상 썸네일
    ],
  },
}
module.exports = nextConfig
