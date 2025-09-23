# TTG Quasar Application - Deployment Guide

**Version**: 2.0  
**Last Updated**: December 2024  
**Status**: Production Ready

## 🚀 **Overview**

This guide provides comprehensive instructions for deploying the TTG Quasar Application to production. The application is designed for deployment on Firebase Hosting with Firebase backend services.

## 📋 **Prerequisites**

### Required Tools

- Node.js 18+
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Git
- Firebase project with billing enabled

### Required Accounts

- Firebase account with active project
- Google Cloud Platform account (for Firebase)
- Domain name (optional, for custom domain)

## 🔧 **Pre-Deployment Checklist**

### ✅ **Security Verification**

- [ ] Firestore security rules deployed and tested
- [ ] All critical vulnerabilities resolved
- [ ] Security headers configured
- [ ] Input validation implemented
- [ ] Rate limiting configured

### ✅ **Build Verification**

- [ ] TypeScript compilation successful
- [ ] All tests passing (495/495)
- [ ] No linting errors
- [ ] Production build successful
- [ ] Bundle size optimized

### ✅ **Configuration Verification**

- [ ] Environment variables configured
- [ ] Firebase project settings correct
- [ ] API keys configured
- [ ] Domain settings configured (if applicable)
- [ ] CLCA integration configured (if using CLCA features)
- [ ] CLCA_INGEST_URL accessible
- [ ] CLCA_JWT_SECRET secured

## 🏗️ **Build Process**

### 1. **Install Dependencies**

```bash
# Install project dependencies
npm install

# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools
```

### 2. **Environment Configuration**

```bash
# Copy environment template
cp .env.example .env.local

# Configure environment variables
# Edit .env.local with your production values
```

**Required Environment Variables**:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Application Configuration
VITE_APP_NAME=TTG Quasar
VITE_APP_VERSION=2.0.0
VITE_APP_ENVIRONMENT=production
VITE_APP_BASE_URL=https://your-ttg-domain.com

# Google Calendar (if using calendar features)
VITE_GOOGLE_CALENDAR_CLIENT_ID=your_client_id

# CLCA Integration (Optional)
CLCA_INGEST_URL=https://your-clca-courier-api.com
CLCA_JWT_SECRET=your-jwt-secret-key-here
```

### 3. **Build Application**

```bash
# Run production build
npm run build

# Verify build output
ls -la dist/spa/
```

**Expected Build Output**:

```
dist/spa/
├── assets/           # Optimized JS/CSS bundles
├── favicon/          # Favicon files
├── images/           # Static images
├── index.html        # Main HTML file
└── manifest.json     # PWA manifest
```

## 🔥 **Firebase Deployment**

### 1. **Firebase Login**

```bash
# Login to Firebase
firebase login

# Verify login
firebase projects:list
```

### 2. **Firebase Project Setup**

```bash
# Initialize Firebase in project (if not already done)
firebase init

# Select services:
# - Hosting: Configure files for Firebase Hosting
# - Firestore: Configure security rules and indexes
# - Storage: Configure security rules
```

### 3. **Deploy Firestore Security Rules**

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Verify rules deployment
firebase firestore:rules:get
```

### 4. **Deploy Storage Security Rules**

```bash
# Deploy Storage security rules
firebase deploy --only storage

# Verify storage rules
firebase storage:rules:get
```

### 5. **Deploy Application**

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy everything (if needed)
firebase deploy
```

## 🌐 **Domain Configuration**

### 1. **Custom Domain Setup**

```bash
# Add custom domain
firebase hosting:sites:create your-domain

# Configure domain
firebase hosting:channel:deploy live --site your-domain
```

### 2. **SSL Certificate**

- Firebase automatically provides SSL certificates
- Custom domains get automatic SSL via Let's Encrypt
- Certificate provisioning takes 5-10 minutes

### 3. **DNS Configuration**

Configure your domain's DNS records:

```
Type: A
Name: @
Value: 151.101.1.195
Value: 151.101.65.195

Type: CNAME
Name: www
Value: your-project.web.app
```

## 📊 **Post-Deployment Verification**

### 1. **Application Health Check**

```bash
# Test application endpoints
curl -I https://your-domain.com
curl -I https://your-domain.com/api/health

# Verify security headers
curl -I https://your-domain.com | grep -E "(X-Content-Type-Options|X-Frame-Options|CSP)"
```

### 2. **CLCA Integration Verification**

```bash
# Test CLCA integration (if configured)
# Check environment variables are set
echo $CLCA_INGEST_URL
echo $CLCA_JWT_SECRET

# Test CLCA API connectivity
curl -I $CLCA_INGEST_URL/health

# Verify JWT token generation
# Check browser console for CLCA integration status
```

### 3. **Firebase Services Verification**

```bash
# Check Firestore rules
firebase firestore:rules:get

# Check Storage rules
firebase storage:rules:get

# View hosting status
firebase hosting:sites:list
```

### 4. **Performance Testing**

```bash
# Test page load times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com

# Test API response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/events
```

## 🔍 **Monitoring & Analytics**

### 1. **Firebase Analytics**

- Automatically enabled with Firebase SDK
- View analytics in Firebase Console
- Monitor user engagement and performance

### 2. **Error Tracking**

- Application includes built-in error tracking
- Errors logged to Firebase Analytics
- Monitor error rates in Firebase Console

### 3. **Performance Monitoring**

- Firebase Performance Monitoring enabled
- Track page load times and API performance
- View performance metrics in Firebase Console

### 4. **CLCA Integration Monitoring**

- Monitor CLCA sync success rates
- Track dead letter queue size
- Monitor JWT token generation
- View CLCA integration status in admin interface

## 🔄 **CLCA Integration Deployment**

### 1. **CLCA Configuration**

If using CLCA integration features:

```bash
# Set CLCA environment variables
export CLCA_INGEST_URL=https://your-clca-courier-api.com
export CLCA_JWT_SECRET=your-secure-jwt-secret-key

# Verify CLCA API accessibility
curl -I $CLCA_INGEST_URL/health
```

### 2. **Firestore Security Rules for CLCA**

Update your Firestore security rules to include CLCA collections:

```javascript
// CLCA sync status (readable by authenticated users)
match /clcaSyncStatus/{docId} {
  allow read, write: if request.auth != null;
}

// Dead letter queue (admin only)
match /deadLetterQueue/{docId} {
  allow read, write: if request.auth != null &&
    get(/databases/$(database)/documents/players/$(request.auth.uid)).data.role == 'admin';
}

// CLCA metrics (admin only)
match /clcaMetrics/{docId} {
  allow read, write: if request.auth != null &&
    get(/databases/$(database)/documents/players/$(request.auth.uid)).data.role == 'admin';
}
```

### 3. **CLCA Integration Testing**

```bash
# Run CLCA integration tests
npm test test/integration/clca-integration.test.ts

# Test CLCA service configuration
# Check browser console for CLCA integration status
```

### 4. **CLCA Monitoring**

- Access admin interface at `/admin/clca`
- Monitor sync statistics and failed items
- View dead letter queue status
- Retry failed syncs as needed

## 🛠️ **Maintenance & Updates**

### 1. **Regular Updates**

```bash
# Update dependencies
npm update

# Run security audit
npm audit

# Fix security vulnerabilities
npm audit fix
```

### 2. **Deployment Updates**

```bash
# Build and deploy updates
npm run build
firebase deploy --only hosting

# Deploy with specific project
firebase deploy --project your-project-id
```

### 3. **Rollback Procedures**

```bash
# List previous deployments
firebase hosting:releases:list

# Rollback to previous version
firebase hosting:releases:rollback

# Rollback to specific version
firebase hosting:releases:rollback --version VERSION_ID
```

## 🔐 **Security Considerations**

### 1. **Environment Variables**

- Never commit `.env.local` to version control
- Use Firebase Functions for sensitive server-side operations
- Rotate API keys regularly

### 2. **Firestore Security**

- Regularly review and update security rules
- Monitor Firestore usage and costs
- Implement proper data validation

### 3. **HTTPS & Security Headers**

- Firebase Hosting provides automatic HTTPS
- Security headers configured in `quasar.config.ts`
- Content Security Policy implemented

## 📈 **Performance Optimization**

### 1. **Bundle Optimization**

- Code splitting implemented
- Lazy loading for routes
- Tree shaking enabled
- Minification and compression

### 2. **Caching Strategy**

- Static assets cached by Firebase CDN
- Service worker for offline functionality
- Browser caching headers configured

### 3. **Database Optimization**

- Firestore indexes configured
- Query optimization implemented
- Connection pooling enabled

## 🚨 **Troubleshooting**

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### Deployment Failures

```bash
# Check Firebase CLI version
firebase --version

# Update Firebase CLI
npm install -g firebase-tools@latest

# Re-authenticate
firebase logout
firebase login
```

#### Domain Issues

```bash
# Check domain configuration
firebase hosting:sites:list

# Verify DNS propagation
nslookup your-domain.com
```

### Support Resources

- Firebase Documentation: https://firebase.google.com/docs
- Quasar Documentation: https://quasar.dev/
- Vue.js Documentation: https://vuejs.org/

## 📋 **Deployment Checklist**

### Pre-Deployment

- [ ] All tests passing
- [ ] Security review complete
- [ ] Environment variables configured
- [ ] Firebase project configured
- [ ] Domain DNS configured (if applicable)

### Deployment

- [ ] Dependencies installed
- [ ] Production build successful
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Application deployed to hosting

### Post-Deployment

- [ ] Application accessible
- [ ] Security headers present
- [ ] SSL certificate active
- [ ] Analytics tracking
- [ ] Performance monitoring active

## 🎯 **Success Metrics**

### Deployment Success Criteria

- ✅ Application loads in < 3 seconds
- ✅ All security headers present
- ✅ SSL certificate active
- ✅ Firebase services operational
- ✅ Analytics tracking active
- ✅ Error monitoring functional

### Performance Targets

- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Uptime**: 99.9%
- **Error Rate**: < 0.1%

---

**Deployment Status**: ✅ **PRODUCTION READY**  
**Last Deployed**: December 2024  
**Environment**: Production
