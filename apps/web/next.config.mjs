/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@cosmoslock/core',
    '@cosmoslock/vault',
    '@cosmoslock/server'
  ]
};

export default nextConfig;
