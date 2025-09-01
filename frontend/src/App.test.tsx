import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Payment Widget Demo heading', () => {
  render(<App />);
  const headingElement = screen.getByText('Payment Widget Demo');
  expect(headingElement).toBeInTheDocument();
});
