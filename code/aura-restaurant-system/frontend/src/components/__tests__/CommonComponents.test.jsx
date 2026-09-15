import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../common/Button';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import Input from '../common/Input';

// Mock getStatusColor for StatusBadge tests
vi.mock('../../utils/helpers', () => ({
    getStatusColor: vi.fn((status) => {
        if (status === 'pending') return { bg: 'bg-neon-cyan/10', text: 'text-neon-cyan', dot: 'bg-neon-cyan' };
        if (status === 'ready') return { bg: 'bg-neon-green/10', text: 'text-neon-green', dot: 'bg-neon-green' };
        return { bg: 'bg-neon-cyan/10', text: 'text-neon-cyan', dot: 'bg-neon-cyan' };
    }),
}));

describe('Common Components', () => {
    describe('Button', () => {
        it('renders children text', () => {
            render(<Button>Click Me</Button>);
            expect(screen.getByText('Click Me')).toBeInTheDocument();
        });
        it('applies primary variant class by default', () => {
            render(<Button>Click</Button>);
            const btn = screen.getByText('Click');
            expect(btn.className).toContain('bg-gradient-to-r from-aura-600');
        });
        it('applies danger variant class', () => {
            render(<Button variant="danger">Click</Button>);
            const btn = screen.getByText('Click');
            expect(btn.className).toContain('bg-gradient-to-r from-red-600');
        });
        it('applies size class', () => {
            render(<Button size="lg">Click</Button>);
            const btn = screen.getByText('Click');
            expect(btn.className).toContain('px-7');
        });
        it('calls onClick handler', () => {
            const handleClick = vi.fn();
            render(<Button onClick={handleClick}>Click</Button>);
            fireEvent.click(screen.getByText('Click'));
            expect(handleClick).toHaveBeenCalledTimes(1);
        });
        it('disabled state prevents click', () => {
            const handleClick = vi.fn();
            render(<Button disabled onClick={handleClick}>Click</Button>);
            fireEvent.click(screen.getByText('Click'));
            expect(handleClick).not.toHaveBeenCalled();
            expect(screen.getByText('Click')).toBeDisabled();
        });
        it('applies custom className', () => {
            render(<Button className="custom-class">Click</Button>);
            expect(screen.getByText('Click').className).toContain('custom-class');
        });
    });

    describe('Card', () => {
        it('renders children', () => {
            render(<Card>Card Content</Card>);
            expect(screen.getByText('Card Content')).toBeInTheDocument();
        });
        it('applies custom className', () => {
            render(<Card className="my-card">Content</Card>);
            const content = screen.getByText('Content');
            expect(content.className).toContain('my-card');
        });
        it('hover classes when hover=true (default)', () => {
            render(<Card>Content</Card>);
            const content = screen.getByText('Content');
            expect(content.className).toContain('hover:');
        });
        it('no hover classes when hover=false', () => {
            render(<Card hover={false}>Content</Card>);
            const content = screen.getByText('Content');
            expect(content.className).not.toContain('hover:');
        });
        it('glow classes when glow=true', () => {
            render(<Card glow>Content</Card>);
            const content = screen.getByText('Content');
            expect(content.className).toContain('neon-border');
        });
        it('calls onClick handler', () => {
            const handleClick = vi.fn();
            render(<Card onClick={handleClick}>Content</Card>);
            fireEvent.click(screen.getByText('Content'));
            expect(handleClick).toHaveBeenCalled();
        });
    });

    describe('StatusBadge', () => {
        it('renders status text', () => {
            render(<StatusBadge status="pending" />);
            expect(screen.getByText('pending')).toBeInTheDocument();
        });
        it("applies correct color classes for 'pending'", () => {
            render(<StatusBadge status="pending" />);
            const badge = screen.getByText('pending');
            expect(badge.className).toContain('bg-neon-cyan/10');
            expect(badge.className).toContain('text-neon-cyan');
        });
        it("applies correct color classes for 'ready'", () => {
            render(<StatusBadge status="ready" />);
            const badge = screen.getByText('ready');
            expect(badge.className).toContain('bg-neon-green/10');
            expect(badge.className).toContain('text-neon-green');
        });
    });

    describe('Input', () => {
        it('renders with label', () => {
            render(<Input label="Username" id="user" onChange={() => {}} />);
            expect(screen.getByText('Username')).toBeInTheDocument();
        });
        it('renders without label', () => {
            const { container } = render(<Input id="user" onChange={() => {}} />);
            expect(container.querySelector('label')).not.toBeInTheDocument();
        });
        it('shows error message', () => {
            render(<Input error="Invalid input" onChange={() => {}} />);
            expect(screen.getByText('Invalid input')).toBeInTheDocument();
        });
        it('no error message when error is empty', () => {
            const { container } = render(<Input onChange={() => {}} />);
            expect(container.querySelector('p')).not.toBeInTheDocument();
        });
        it('renders icon when provided', () => {
            const MockIcon = () => <svg data-testid="icon" />;
            render(<Input icon={MockIcon} onChange={() => {}} />);
            expect(screen.getByTestId('icon')).toBeInTheDocument();
        });
    });
});
