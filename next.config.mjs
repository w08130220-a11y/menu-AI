/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 防點擊劫持
          { key: "X-Frame-Options", value: "DENY" },
          // 防 MIME 類型嗅探
          { key: "X-Content-Type-Options", value: "nosniff" },
          // 限制 Referrer 外洩
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 停用不需要的瀏覽器功能
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // 內容安全政策（Next.js inline runtime 需 unsafe-inline）
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
