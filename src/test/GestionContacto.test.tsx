import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GestionContacto from '../paginas/GestionContacto';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GestionContacto Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    localStorage.clear();
  });

  it('muestra acceso denegado si no es ADMIN', () => {
    localStorage.setItem('userRole', 'ARRIENDATARIO');
    render(<MemoryRouter><GestionContacto /></MemoryRouter>);
    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();
  });

  it('muestra título para admin', () => {
    localStorage.setItem('userRole', 'ADMIN');
    localStorage.setItem('userId', '1');
    render(<MemoryRouter><GestionContacto /></MemoryRouter>);
    expect(screen.getByText(/gestión de contacto/i)).toBeInTheDocument();
  });
});