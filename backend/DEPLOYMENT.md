# Deployment Guide - Student Portfolio Backend

## 🚀 Deployment Options

This guide covers deploying the Student Portfolio Management System backend to various cloud platforms.

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database setup completed
- [ ] Security settings reviewed
- [ ] File upload storage configured
- [ ] CORS origins updated
- [ ] Rate limiting configured

## 🌐 Platform-Specific Deployment

### 1. Render (Recommended)

Render provides excellent free tier hosting with automatic deployments.

#### Setup Steps:

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Connect Repository**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service**
   ```
   Name: student-portfolio-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   DB_URL=postgresql://user:password@host:port/database
   JWT_SECRET=your_production_jwt_secret
   FRONTEND_URL=https://your-frontend-domain.com
   PORT=10000
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy

#### Database Setup (Render PostgreSQL):
1. Create PostgreSQL service in Render
2. Copy connection string to `DB_URL`
3. Database will be automatically created

### 2. Heroku

#### Setup Steps:

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew install heroku/brew/heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create student-portfolio-backend
   ```

3. **Add PostgreSQL Addon**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_production_jwt_secret
   heroku config:set FRONTEND_URL=https://your-frontend-domain.com
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

### 3. Railway

#### Setup Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click "Deploy from GitHub repo"
   - Select your repository

3. **Add Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will provide connection details

4. **Configure Environment Variables**
   ```
   NODE_ENV=production
   DB_URL=postgresql://user:password@host:port/database
   JWT_SECRET=your_production_jwt_secret
   FRONTEND_URL=https://your-frontend-domain.com
   ```

5. **Deploy**
   - Railway automatically detects Node.js
   - Deployment happens automatically on git push

### 4. DigitalOcean App Platform

#### Setup Steps:

1. **Create DigitalOcean Account**
   - Go to [digitalocean.com](https://digitalocean.com)
   - Sign up

2. **Create App**
   - Go to Apps → "Create App"
   - Connect GitHub repository

3. **Configure App Spec**
   ```yaml
   name: student-portfolio-backend
   services:
   - name: api
     source_dir: /server
     github:
       repo: your-username/your-repo
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: JWT_SECRET
       value: your_production_jwt_secret
     - key: FRONTEND_URL
       value: https://your-frontend-domain.com
   databases:
   - name: postgres-db
     engine: PG
     version: "13"
   ```

4. **Deploy**
   - Click "Create Resources"
   - DigitalOcean will deploy automatically

## 🗄️ Database Setup

### Managed PostgreSQL Services

#### 1. Neon (Recommended for Development)
- **Free tier**: 3 databases, 0.5GB storage
- **Setup**: 
  1. Go to [neon.tech](https://neon.tech)
  2. Create account
  3. Create new project
  4. Copy connection string

#### 2. Supabase
- **Free tier**: 500MB database, 2GB bandwidth
- **Setup**:
  1. Go to [supabase.com](https://supabase.com)
  2. Create new project
  3. Get connection details from Settings → Database

#### 3. PlanetScale
- **Free tier**: 1 database, 1GB storage
- **Setup**:
  1. Go to [planetscale.com](https://planetscale.com)
  2. Create account
  3. Create new database
  4. Get connection string

### Database Migration

The application automatically creates tables on startup. For production:

1. **Backup Strategy**
   ```bash
   # Create backup
   pg_dump $DATABASE_URL > backup.sql
   
   # Restore backup
   psql $DATABASE_URL < backup.sql
   ```

2. **Connection Pooling**
   ```javascript
   // Already configured in database.js
   const pool = new Pool({
     connectionString: process.env.DB_URL,
     ssl: { rejectUnauthorized: false },
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

## 🔒 Security Configuration

### Environment Variables for Production

```env
# Server
NODE_ENV=production
PORT=10000

# Database
DB_URL=postgresql://user:password@host:port/database

# JWT (Generate strong secret)
JWT_SECRET=your_super_strong_jwt_secret_here_minimum_32_characters
JWT_EXPIRE=7d

# CORS (Update with your frontend URL)
FRONTEND_URL=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Security Best Practices

1. **JWT Secret**
   ```bash
   # Generate strong secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **HTTPS**
   - Most platforms provide HTTPS automatically
   - Update CORS origins to use HTTPS

3. **Database Security**
   - Use connection pooling
   - Enable SSL connections
   - Regular backups
   - Strong passwords

4. **File Upload Security**
   - Validate file types
   - Limit file sizes
   - Scan for malware (consider cloud storage)

## 📁 File Storage

### Local Storage (Development)
```javascript
// Already configured
const uploadDir = './uploads';
```

### Cloud Storage (Production)

#### AWS S3 Setup
```javascript
// Install AWS SDK
npm install aws-sdk multer-s3

// Update upload configuration
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    key: function (req, file, cb) {
      cb(null, `certificates/${Date.now()}-${file.originalname}`);
    }
  })
});
```

#### Google Cloud Storage
```javascript
// Install Google Cloud Storage
npm install @google-cloud/storage multer-gcs

const { Storage } = require('@google-cloud/storage');
const multerGCS = require('multer-gcs');

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
});

const upload = multer({
  storage: multerGCS({
    bucket: storage.bucket(process.env.GOOGLE_CLOUD_BUCKET),
    filename: function (req, file, cb) {
      cb(null, `certificates/${Date.now()}-${file.originalname}`);
    }
  })
});
```

## 🔧 Monitoring & Logging

### Application Monitoring

#### 1. Health Check Endpoint
```bash
# Already implemented
curl https://your-api-domain.com/api/health
```

#### 2. Logging
```javascript
// Already configured with Morgan
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
```

#### 3. Error Tracking
Consider adding Sentry for production error tracking:

```bash
npm install @sentry/node
```

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.requestHandler());
app.use(Sentry.errorHandler());
```

## 🚀 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: cd server && npm ci
      
    - name: Run tests
      run: cd server && npm test
      
    - name: Deploy to Render
      uses: johnbeynon/render-deploy-action@v0.0.8
      with:
        service-id: ${{ secrets.RENDER_SERVICE_ID }}
        api-key: ${{ secrets.RENDER_API_KEY }}
```

## 📊 Performance Optimization

### Production Optimizations

1. **Enable Compression**
   ```javascript
   // Already configured
   app.use(compression());
   ```

2. **Connection Pooling**
   ```javascript
   // Already configured
   const pool = new Pool({
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

3. **Rate Limiting**
   ```javascript
   // Already configured
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   ```

4. **Caching** (Optional)
   ```bash
   npm install redis
   ```

## 🔄 Backup & Recovery

### Database Backups

#### Automated Backups
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
```

#### Restore from Backup
```bash
# Restore database
psql $DATABASE_URL < backup_20231201_120000.sql
```

### File Backups
- Use cloud storage for automatic backups
- Implement versioning for important files
- Regular backup verification

## 📞 Troubleshooting

### Common Deployment Issues

#### 1. Build Failures
```bash
# Check Node.js version
node --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check SSL settings
psql $DATABASE_URL -c "SHOW ssl;"
```

#### 3. Environment Variable Issues
```bash
# Check environment variables
heroku config  # For Heroku
railway variables  # For Railway
```

#### 4. CORS Issues
```javascript
// Update CORS configuration
app.use(cors({
  origin: [
    'https://your-frontend-domain.com',
    'https://www.your-frontend-domain.com'
  ],
  credentials: true
}));
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancers
- Implement session management
- Database read replicas
- CDN for file uploads

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching
- Use connection pooling

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Database SSL enabled
- [ ] Strong JWT secret generated
- [ ] CORS origins updated
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] File upload limits set
- [ ] Error tracking configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Performance optimizations applied

## 📞 Support

For deployment issues:
1. Check platform-specific documentation
2. Review server logs
3. Verify environment variables
4. Test database connectivity
5. Check CORS configuration

Happy deploying! 🚀


