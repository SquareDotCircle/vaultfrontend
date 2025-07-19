# Go Offline - Vault Web

All of humanity's knowledge on a drive. Take control of the information you consume without the algorithmic manipulation.

## Deployment to Vercel

This project is configured to deploy easily to Vercel as a static site.

### Quick Deploy

1. **Connect to GitHub**: Push this repository to GitHub
2. **Import to Vercel**: 
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
3. **Deploy**: Vercel will automatically detect this as a static site and deploy

### Configuration

The site includes:
- `vercel.json` - Vercel configuration for proper headers and routing
- `package.json` - Node.js configuration (mainly for metadata)
- Static HTML/CSS/JS files

### Features

- 🚀 Static site deployment
- 🔒 Security headers configured
- 📱 Mobile responsive design
- 🎨 Cyberpunk aesthetic with Google Fonts
- 🎬 Video sections with scroll animations
- 💳 E-commerce integration ready

### Structure

```
/
├── index.html          # Main landing page
├── features.html       # Features page
├── how-it-works.html   # How it works page
├── shipping.html       # Shipping form
├── payment.html        # Payment page
├── style.css           # Main stylesheet
├── script.js           # Main JavaScript
├── payment.js          # Payment processing
├── shipping.js         # Shipping form logic
├── server.js           # Backend server (not used in static deployment)
├── vercel.json         # Vercel configuration
└── package.json        # Node.js configuration
```

### Local Development

Simply open `index.html` in a web browser or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

### Environment Variables

For the payment functionality, you'll need to set up Stripe environment variables in Vercel:

- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`

## License

ISC License 