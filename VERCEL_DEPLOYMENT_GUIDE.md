# Vercel Deployment Guide for Num1Store

## Updated Configuration Summary

Your code has been optimized for Vercel deployment with the following improvements:

### 1. Package.json Updates
- ✅ Added Vercel-specific scripts (`lint:fix`, `type-check`, `build:analyze`)
- ✅ Added bundle analyzer dependency
- ✅ Added sitemap generation
- ✅ Fixed lint script to use Next.js linter

### 2. Next.js Configuration Optimizations
- ✅ Enhanced image optimization with additional device sizes
- ✅ Added experimental performance features
- ✅ Implemented bundle splitting for better performance
- ✅ Added security headers
- ✅ Added SEO redirects
- ✅ Console removal in production

### 3. Vercel Configuration Enhancements
- ✅ Added security headers
- ✅ Optimized function memory allocation
- ✅ Added image caching headers
- ✅ Configured build environment variables

### 4. Additional Features
- ✅ Created environment variables template
- ✅ Added sitemap generation configuration
- ✅ Optimized build performance

## Deployment Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Copy the variables from `env.example` to your Vercel project:
- Supabase credentials
- Razorpay keys
- Shiprocket credentials
- Analytics IDs (optional)

### 3. Deploy to Vercel
```bash
vercel --prod
```

## Performance Optimizations

### Build Optimization
- Bundle splitting for vendor libraries
- Tree shaking for unused code
- Image optimization with WebP/AVIF formats
- CSS optimization

### Runtime Optimization
- Server-side minification
- React server component optimization
- Keep-alive HTTP connections
- Security headers

### Caching Strategy
- Static assets cached for 1 year
- Images cached indefinitely
- API routes with appropriate caching

## Monitoring

### Build Analysis
Run bundle analysis locally:
```bash
npm run build:analyze
```

### Type Checking
Ensure type safety:
```bash
npm run type-check
```

### Linting
Check code quality:
```bash
npm run lint:fix
```

## Environment Variables Required

### Essential
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

### Optional
- `SHIPROCKET_EMAIL`
- `SHIPROCKET_PASSWORD`
- `NEXT_PUBLIC_GA_ID`

## Post-Deployment Checklist

- [ ] Verify all API endpoints work
- [ ] Test payment integration
- [ ] Check image optimization
- [ ] Validate SEO metadata
- [ ] Test mobile responsiveness
- [ ] Verify analytics tracking

## Troubleshooting

### Build Issues
- Check environment variables
- Verify Node.js version (18+ recommended)
- Clear build cache: `vercel build --force`

### Performance Issues
- Run bundle analysis
- Check Core Web Vitals
- Monitor Vercel Analytics

### API Issues
- Verify Supabase connection
- Check CORS settings
- Test rate limiting

## Support

For deployment issues, check:
1. Vercel deployment logs
2. Build output in Vercel dashboard
3. Runtime logs in Vercel functions

Your application is now fully optimized for Vercel deployment! 🚀
