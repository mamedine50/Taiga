import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Les packages du workspace sont consommés en TypeScript brut.
  transpilePackages: ["@taiga/core", "@taiga/i18n", "@taiga/supabase", "@taiga/types"],
};

export default withNextIntl(nextConfig);
