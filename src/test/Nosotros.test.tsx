import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Nosotros from '../paginas/nosotros';

describe('Nosotros Component', () => {
  it('debe renderizar el título y contenido', () => {
    render(
      <MemoryRouter>
        <Nosotros />
      </MemoryRouter>
    );

    expect(screen.getByText(/sobre nosotros/i)).toBeInTheDocument();
    // "Leaseflow" aparece en múltiples nodos (strong y párrafo)
    expect(screen.getAllByText(/Leaseflow/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/sin\s+comisiones/i)).toBeInTheDocument();
  });
});
