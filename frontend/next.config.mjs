/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@refinedev/antd"],
    output: "standalone",
    rewrites: async () => {
        return {
            beforeFiles: [
                {
                    source: "/api/:path*",
                    destination: `${process.env.BACKEND_INTERNAL_URL}/api/:path*`,
                },
            ],
        };
    },
};

export default nextConfig;
