# Beacon

Email-to-Vestaboard gateway with admin review. Send an email to `board@tillage.place` and, after admin approval, it posts to your Vestaboard.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create admin password hash

```bash
node -e "require('bcrypt').hash('your-password', 10).then(console.log)"
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` - PostgreSQL connection string
- `SENDGRID_API_KEY` - For auto-reply emails
- `VESTABOARD_API_KEY` - From Vestaboard app (Settings > Installable > Enable Read/Write API)
- `ADMIN_PASSWORD_HASH` - Output from step 2
- `SESSION_SECRET` - Random string for session encryption

### 4. Initialize database

```bash
psql $DATABASE_URL -f scripts/init-db.sql
```

### 5. Run locally

```bash
npm run dev
```

## Deploy to Heroku

```bash
# Create app
heroku create beacon-vestaboard

# Add Postgres
heroku addons:create heroku-postgresql:essential-0

# Set config
heroku config:set SENDGRID_API_KEY=SG.xxx
heroku config:set VESTABOARD_API_KEY=xxx
heroku config:set ADMIN_PASSWORD_HASH='$2b$10$...'
heroku config:set SESSION_SECRET=your-random-secret

# Initialize database
heroku pg:psql < scripts/init-db.sql

# Deploy
git push heroku main
```

## Configure SendGrid Inbound Parse

1. Add and verify your domain in SendGrid (Sender Authentication)
2. Set up MX record for `tillage.place` pointing to `mx.sendgrid.net`
3. Go to Settings > Inbound Parse > Add Host & URL
   - Subdomain: (leave blank for root domain, or use a subdomain)
   - Domain: `tillage.place`
   - URL: `https://your-app.herokuapp.com/webhook/email`
   - Check "POST the raw, full MIME message"

## Usage

1. Send email to `board@tillage.place`
2. Sender receives auto-reply confirmation
3. Admin logs in at `/admin` to review
4. Approve (optionally edit first) or reject
5. Approved messages post to Vestaboard
