import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * TEST DE ESTRÉS: Click Rápido
 * Simula cambios rápidos en filtros y botones
 */

describe('Estrés: Click Rápido - Cambios de Estado', () => {
  it('debe manejar cambios rápidos en selects sin errores', () => {
    const onChange = vi.fn();

    render(
      <select onChange={onChange} data-testid="test-select">
        <option value="">Seleccionar</option>
        <option value="1">Opción 1</option>
        <option value="2">Opción 2</option>
        <option value="3">Opción 3</option>
      </select>
    );

    const select = screen.getByTestId('test-select');

    // Cambios rápidos consecutivos
    fireEvent.change(select, { target: { value: '1' } });
    fireEvent.change(select, { target: { value: '2' } });
    fireEvent.change(select, { target: { value: '3' } });
    fireEvent.change(select, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it('debe manejar clicks rápidos en botones', () => {
    const onClick = vi.fn();

    render(
      <button onClick={onClick} data-testid="test-btn">
        Click me
      </button>
    );

    const button = screen.getByTestId('test-btn');

    // 10 clicks rápidos
    for (let i = 0; i < 10; i++) {
      fireEvent.click(button);
    }

    expect(onClick).toHaveBeenCalledTimes(10);
  });
});

describe('Estrés: Scroll Masivo', () => {
  it('debe manejar scroll event sin errores', () => {
    const onScroll = vi.fn();

    render(
      <div onScroll={onScroll} style={{ height: 100, overflow: 'auto' }} data-testid="scroll-div">
        <div style={{ height: 1000 }}>Contenido largo</div>
      </div>
    );

    const div = screen.getByTestId('scroll-div');

    // Disparar scroll varias veces
    for (let i = 0; i < 5; i++) {
      fireEvent.scroll(div, { target: { scrollTop: i * 100 } });
    }

    expect(onScroll).toHaveBeenCalled();
  });
});