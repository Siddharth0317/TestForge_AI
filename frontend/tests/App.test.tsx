import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../src/app/App';

describe('Frontend Shell Smoke Test', () => {
  it('renders application header and title', () => {
    render(<App />);

    expect(screen.getByText('TestForge AI')).toBeInTheDocument();
    expect(screen.getByText('From Requirements to Verified Tests')).toBeInTheDocument();
    expect(screen.getByText('Foundation Ready')).toBeInTheDocument();
  });

  it('renders core architectural feature cards', () => {
    render(<App />);

    expect(screen.getByText('Deterministic Gates')).toBeInTheDocument();
    expect(screen.getByText('Hybrid AI & ML')).toBeInTheDocument();
    expect(screen.getByText('Controlled Execution')).toBeInTheDocument();
  });
});

