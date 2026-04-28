/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://num1-store.vercel.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/api/*', '/admin/*'],
  transform: async (config, path) => {
    // Custom transformation for specific paths
    if (path.includes('/products/')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      };
    }
    
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
  additionalPaths: async (config) => [
    {
      loc: '/about',
      changefreq: 'monthly',
      priority: 0.5,
    },
    {
      loc: '/contact',
      changefreq: 'monthly',
      priority: 0.5,
    },
  ],
};
