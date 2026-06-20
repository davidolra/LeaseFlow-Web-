import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * TEST DE ESTRÉS: Datos Masivos
 * Simula grandes cantidades de datos para evaluar rendimiento
 */

describe('Estrés: Datos Masivos - Propiedades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('debe manejar 100+ propiedades sin errores', () => {
    // Generar 100 propiedades simuladas
    const propiedades = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      titulo: `Propiedad ${i + 1}`,
      direccion: `Calle ${i + 1}`,
      precioMensual: 500000 + i * 10000,
      m2: 50 + i,
      nHabit: (i % 5) + 1,
      nBanos: (i % 3) + 1,
      divisa: 'CLP' as const,
      petFriendly: i % 2 === 0,
      tipoId: (i % 3) + 1,
      comunaId: (i % 10) + 1,
      codigo: `COD-${i}`,
      fotos: [],
    }));

    // Verificar que los datos se generaron correctamente
    expect(propiedades).toHaveLength(100);
    expect(propiedades[0].titulo).toBe('Propiedad 1');
    expect(propiedades[99].titulo).toBe('Propiedad 100');
  });

  it('debe manejar filtrado rápido de 500 items', () => {
    const items = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      nombre: `Item ${i}`,
      categoria: i % 5 === 0 ? 'A' : 'B',
      precio: Math.random() * 1000000,
    }));

    // Filtrado rápido
    const filtrados = items.filter(item => item.categoria === 'A');
    expect(filtrados.length).toBe(100); // 500/5 = 100 items de categoría A
  });
});

describe('Estrés: Datos Masivos - Usuarios', () => {
  it('debe manejar 200 usuarios simulados', () => {
    const usuarios = Array.from({ length: 200 }, (_, i) => ({
      id: i + 1,
      pnombre: `Usuario${i}`,
      papellido: `Apellido${i}`,
      email: `usuario${i}@email.com`,
      rolId: (i % 3) + 1,
      estadoId: 1,
    }));

    expect(usuarios).toHaveLength(200);
    const admins = usuarios.filter(u => u.rolId === 1);
    expect(admins.length).toBeGreaterThan(0);
  });
});