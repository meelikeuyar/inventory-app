import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it('should show login page for unauthenticated users', async () => {
    render(<App />);
    // Wait for lazy-loaded LoginPage to render
    const emailInput = await screen.findByPlaceholderText(/e-posta/i, {}, { timeout: 3000 });
    expect(emailInput).toBeTruthy();
  });
});
