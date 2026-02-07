// Basic tests for frontend component
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App Component', () => {
    it('renders the header', () => {
        render(<App />);
        expect(screen.getByText('Inventory Management')).toBeDefined();
    });

    it('renders the form section', () => {
        render(<App />);
        expect(screen.getByText('Add New Item')).toBeDefined();
    });

    it('renders form inputs', () => {
        render(<App />);
        expect(screen.getByLabelText('Name:')).toBeDefined();
        expect(screen.getByLabelText('Quantity:')).toBeDefined();
        expect(screen.getByLabelText('Price:')).toBeDefined();
    });

    it('renders submit button', () => {
        render(<App />);
        expect(screen.getByRole('button', { name: /Add Item/i })).toBeDefined();
    });

    it('renders items list section', () => {
        render(<App />);
        expect(screen.getByText('Items List')).toBeDefined();
    });
});
