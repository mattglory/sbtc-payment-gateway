# ESG Analyzer Component

A premium, AI-powered ESG (Environmental, Social, and Governance) analysis tool built for fintech applications.

## Features

### 🎨 Premium UI/UX
- Modern, responsive design optimized for mobile and desktop
- Smooth animations and hover effects
- Professional fintech-style interface
- Loading skeletons for better perceived performance

### 📊 Data Visualization
- Interactive radial bar charts for ESG breakdown
- Comparative bar charts vs industry averages
- Animated score progress bars
- Professional score cards with color-coded ratings

### 🤖 AI Integration
- OpenAI GPT-4 powered analysis
- Structured response parsing with Zod validation
- Comprehensive ESG scoring (0-100 scale)
- Detailed analysis for Environmental, Social, and Governance factors

### 🔒 Security & Performance
- Input validation and sanitization
- Error handling with user-friendly messages
- Rate limiting awareness
- Authentication ready

## Usage

```jsx
import ESGAnalyzer from './components/ai/ESGAnalyzer';
import './styles/esg-animations.css';

function App() {
  return (
    <div>
      <ESGAnalyzer />
    </div>
  );
}
```

## Component Structure

```
src/components/ai/
├── ESGAnalyzer.jsx          # Main component
├── README.md                # This file
└── index.js                 # Export file

src/components/ui/
├── LoadingSkeleton.jsx      # Loading states
├── ChartTooltip.jsx         # Chart tooltip component
└── index.js                 # Export file

src/styles/
└── esg-animations.css       # Custom animations and styles
```

## API Integration

The component integrates with the ESG scoring API at `/api/ai/esg-score`:

```javascript
// Request format
{
  "companyName": "Apple Inc.",
  "sector": "Technology",
  "description": "Company description..."
}

// Response format
{
  "success": true,
  "esgScores": {
    "environmental": 75,
    "social": 82,
    "governance": 88,
    "overall": 82
  },
  "analysis": {
    "environmental": "Analysis text...",
    "social": "Analysis text...",
    "governance": "Analysis text...",
    "summary": "Executive summary...",
    "risks": ["Risk 1", "Risk 2"],
    "opportunities": ["Opportunity 1", "Opportunity 2"]
  }
}
```

## Customization

### Styling
- Modify `src/styles/esg-animations.css` for custom animations
- Update Tailwind classes in the component for theme changes
- Customize color schemes in the `getScoreColor` and `getScoreGradient` functions

### Charts
- Charts are built with Recharts library
- Easily customizable colors, dimensions, and data formatting
- Responsive design built-in

### Form Fields
- Easy to add/remove form fields
- Validation schema can be extended
- Dropdown options are configurable

## Dependencies

- React 19+
- Recharts for charts
- Lucide React for icons
- Clsx for conditional styling
- Tailwind CSS for styling

## Performance Notes

- Uses loading skeletons to improve perceived performance
- Debounced form inputs (can be added)
- Optimized re-renders with proper state management
- Lazy loading ready for route-based code splitting

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliant
- Reduced motion support

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- [ ] Real-time collaboration features
- [ ] Export to PDF/Excel functionality
- [ ] Historical data tracking
- [ ] Portfolio-level ESG analysis
- [ ] Integration with external ESG data providers
- [ ] Custom scoring methodology options