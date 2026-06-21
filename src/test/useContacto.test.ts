import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContacto } from '../hooks/useContacto';
import { contactService } from '../api/contactService';

vi.mock('../api/contactService', () => ({
  contactService: {
    crearMensaje: vi.fn(),
    listarTodos: vi.fn(),
    listarPorUsuario: vi.fn(),
  },
}));

describe('useContacto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe inicializar con estado vacío', () => {
    const { result } = renderHook(() => useContacto());
    expect(result.current.mensajes).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('debe crear mensaje exitosamente', async () => {
    const mockMensaje = {
      id: 1,
      nombre: 'Juan',
      email: 'juan@email.com',
      asunto: 'Consulta',
      mensaje: 'Hola',
    };
    vi.mocked(contactService.crearMensaje).mockResolvedValue(mockMensaje);

    const { result } = renderHook(() => useContacto());

    let response: any;
    await act(async () => {
      response = await result.current.crearMensaje({
        nombre: 'Juan',
        email: 'juan@email.com',
        asunto: 'Consulta',
        mensaje: 'Hola',
      });
    });

    expect(response.success).toBe(true);
    expect(response.data).toEqual(mockMensaje);
  });

  it('debe manejar error al crear mensaje', async () => {
    vi.mocked(contactService.crearMensaje).mockRejectedValue(new Error('Error de envío'));

    const { result } = renderHook(() => useContacto());

    let response: any;
    await act(async () => {
      response = await result.current.crearMensaje({
        nombre: 'Juan',
        email: 'juan@email.com',
        asunto: 'Consulta',
        mensaje: 'Hola',
      });
    });

    expect(response.success).toBe(false);
    expect(result.current.error).toBe('Error de envío');
  });

  it('debe listar todos los mensajes', async () => {
    const mockMensajes = [
      { id: 1, nombre: 'Juan', email: 'juan@email.com', asunto: 'Consulta', mensaje: 'Hola' },
      { id: 2, nombre: 'María', email: 'maria@email.com', asunto: 'Duda', mensaje: 'Buenos días' },
    ];
    vi.mocked(contactService.listarTodos).mockResolvedValue(mockMensajes);

    const { result } = renderHook(() => useContacto());

    let response: any;
    await act(async () => {
      response = await result.current.listarTodos();
    });

    expect(result.current.mensajes).toHaveLength(2);
    expect(response.success).toBe(true);
  });

  it('debe listar mensajes por usuario', async () => {
    const mockMensajes = [{ id: 1, nombre: 'Juan', email: 'juan@email.com', asunto: 'Consulta', mensaje: 'Hola', usuarioId: 1 }];
    vi.mocked(contactService.listarPorUsuario).mockResolvedValue(mockMensajes);

    const { result } = renderHook(() => useContacto());

    let response: any;
    await act(async () => {
      response = await result.current.listarPorUsuario(1);
    });

    expect(response.success).toBe(true);
    expect(result.current.mensajes).toHaveLength(1);
  });
});
