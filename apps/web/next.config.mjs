/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Les packages du workspace sont consommés en TypeScript brut.
  transpilePackages: ["@taiga/core", "@taiga/supabase", "@taiga/types"],
};

export default nextConfig;
