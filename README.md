# ReFAQ - Re Protocol FAQ Assistant

An AI-powered FAQ assistant for Re Protocol, built with React, TypeScript, Vite, and TailwindCSS v4. Get instant answers about reUSD, reUSDe, yields, and more!

## Features

- **AI-Powered Responses** - Powered by Groq API with X.AI's Grok model
- **Real-time Chat Interface** - Smooth typewriter effect with glass morphism design
- **Yield Calculator** - Calculate returns for reUSD and reUSDe strategies
- **Modern UI** - Dark theme with TailwindCSS v4 and glass effects
- **Fast Performance** - Built with Vite for lightning-fast development and builds
- **Responsive Design** - Works perfectly on desktop and mobile
- **Secure** - API keys stored in environment variables

## Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** TailwindCSS v4
- **AI:** Groq API (X.AI Grok model)
- **Icons:** Custom SVG icons
- **Fonts:** Inter (Google Fonts)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/refaq.git
   cd refaq
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Add your Groq API key to `.env`:
   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:5173](http://localhost:5173)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Vite) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests (if configured) |

## Design Features

### Glass Morphism
- User messages have a beautiful glass effect with backdrop blur
- Semi-transparent backgrounds with subtle borders
- Modern, clean aesthetic

### Typewriter Effect
- AI responses appear word by word with smooth animations
- Custom CSS animations for enhanced user experience
- Fast and responsive typing effect

### Dark Theme
- Carefully crafted color palette
- High contrast for readability
- Consistent with Re Protocol branding

## AI Capabilities

The assistant can help with:

- **Token Information** - reUSD vs reUSDe differences
- **Yield Calculations** - APY estimates and projections
- **Risk Assessment** - Understanding different risk levels
- **Getting Started** - Step-by-step guidance
- **Technical Details** - Smart contracts, addresses, processes
- **Strategy Comparison** - Which token suits your needs

## Project Structure

```
refaq/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   └── ChatInterface.tsx
│   ├── services/          # API services
│   │   └── groqApi.ts
│   ├── index.css          # Global styles
│   ├── index.tsx          # App entry point
│   └── vite-env.d.ts      # Vite type definitions
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # TailwindCSS configuration
└── package.json
```

## Configuration

### TailwindCSS v4
The project uses TailwindCSS v4 with custom theme configuration:
- Custom color palette for Re Protocol branding
- Glass morphism utilities
- Responsive design system

### Vite Configuration
- TypeScript support
- PostCSS integration
- Hot Module Replacement (HMR)
- Optimized builds

## Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel/Netlify
The project is ready for deployment on any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Re Protocol](https://re.xyz/) for the amazing DeFi platform
- [Groq](https://groq.com/) for the AI API
- [Vite](https://vitejs.dev/) for the blazing fast build tool
- [TailwindCSS](https://tailwindcss.com/) for the utility-first CSS framework

## Support

If you have any questions or need help:
- Open an issue on GitHub
- Check the [Re Protocol documentation](https://docs.re.xyz/)
- Visit [re.xyz](https://re.xyz/) for more information

---

**Built with ❤️ for the Re Protocol community**