import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import Vistas from '../paginas/Vistas';

vi.mock('../hooks/usePropiedades', () => ({
  usePropiedades: () => ({
    propiedades: [{ id: 1, titulo: 'Propiedad Test', comuna: { nombre: 'Santiago' }, fotos: [] }],
    cargando: false,
    totalPaginas: 1,
    paginaActual: 1,
    cambiarPagina: vi.fn(),
  }),
}));

describe('Vistas Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe renderizar el contador inicial', () => {
    render(<Vistas propiedadId={1} />);
    const counter = document.querySelector('.vistas-counter span.number');
    expect(counter).toBeInTheDocument();
    expect(parseInt(counter?.textContent || '0')).toBeGreaterThan(0);
  });

  it('debe incrementar el contador con el tiempo', async () => {
    render(<Vistas propiedadId={1} />);
    const counter = document.querySelector('.vistas-counter span.number');
    const initialCount = parseInt(counter?.textContent || '0');
    expect(initialCount).toBeGreaterThan(0);

    // Avanzar el timer 2 segundos para activar el intervalo
    await vi.advanceTimersByTimeAsync(2000);

    // Flush de microtareas y tick extra para que React actualice el DOM
    await act(async () => {
      await Promise.resolve();
    });

    const updatedCounter = document.querySelector('.vistas-counter span.number');
    const updatedCount = parseInt(updatedCounter?.textContent || '0');
    expect(updatedCount).toBeGreaterThan(initialCount);
  });
});
