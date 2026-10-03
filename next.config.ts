import type { NextConfig } from 'next';

// Directory indexes let GitHub Pages serve shared links such as /story/ directly.
const nextConfig: NextConfig = { output: 'export', trailingSlash: true };

export default nextConfig;
