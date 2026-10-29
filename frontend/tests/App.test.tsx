import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../src/app/App';

describe('Frontend Application Shell', () => {
  it('renders sign-in form when unauthenticated', () => {
    render(<App />);

    expect(screen.getByText('Sign In to TestForge AI')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('user@testforge.local')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders quick-fill demo account shortcuts', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /^admin$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^qa engineer$/i })).toBeInTheDocument();
  });
});
