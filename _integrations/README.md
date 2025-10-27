# Integrations Module

This module contains the Integrations page component for the PocketBoss dashboard, based on the Figma design.

## Components

### IntegrationsContent

The main component that renders the integrations page with:

- Header section with title and "Connect Project" button
- Grid of integration cards
- Integration status section
- Add new integration functionality

## Features

- **Integration Cards**: Display available integrations with images from Figma
- **Connect/Disconnect**: Toggle integration status
- **Add New Integration**: Placeholder for adding new integrations
- **Status Tracking**: Visual indicators for connection status
- **Responsive Design**: Works on desktop and mobile devices

## Assets

The component uses images downloaded from the Figma design:

- `integration-card-1.png`: Project Management Integration card
- `integration-card-2.svg`: Document Management System card

## Usage

```tsx
import { IntegrationsContent } from "./_integrations";

export default function IntegrationsPage() {
  return <IntegrationsContent />;
}
```

## Design Source

Based on Figma design: [Pocketboss - Cursor](https://www.figma.com/design/mql7d23sCiDhskx8HaSVlk/Pocketboss---Cursor?node-id=5692-21392&t=4XAlPqRv1nAGamZU-11)

## Styling

Uses Tailwind CSS classes consistent with the existing design system:

- Gray color palette (gray-50, gray-200, gray-900, etc.)
- Consistent spacing and typography
- Hover effects and transitions
- Shadow effects for cards
