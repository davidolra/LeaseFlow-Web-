import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUsuarios } from '../hooks/useUsuarios';

const { mockLogin, mockObtenerPorId } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockObtenerPorId: vi.fn(),
}));

vi.mock('../api/userService', () => ({
  userService: {
    login: mockLogin,
    obtenerPorId: mockObtenerPorId,
  },
}));

vi.mock('../api', () => ({
  userService: {
    login: mockLogin,
    obtenerPorId: mockObtenerPorId,
  },
  rolService: { listar: vi.fn() },
  estadoUsuarioService: { listar: vi.fn() },
}));

describe('useUsuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('debe inicializar con estado vacío', () => {
    const { result } = renderHook(() => useUsuarios());
    expect(result.current.usuario).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('debe hacer login exitosamente', async () => {
    const mockResponse = {
      success: true,
      mensaje: 'Login exitoso',
      usuario: { id: 1, email: 'test@email.com', pnombre: 'Test', rolId: 3 },
    };
    mockLogin.mockResolvedValue(mockResponse as any);

    const { result } = renderHook(() => useUsuarios());

    let loginResult: any;
    await act(async () => {
      loginResult = await result.current.login({ email: 'test@email.com', clave: 'pass123' });
    });

    expect(loginResult).toEqual(mockResponse);
    expect(localStorage.getItem('isLoggedIn')).toBe('true');
    expect(localStorage.getItem('userId')).toBe('1');
  });

  it('debe manejar error de login', async () => {
    const mockError = new Error('Credenciales inválidas');
    mockLogin.mockRejectedValue(mockError);

    const { result } = renderHook(() => useUsuarios());

    await act(async () => {
      try {
        await result.current.login({ email: 'test@email.com', clave: 'wrong' });
      } catch (err) {
        // Error esperado
      }
    });

    expect(result.current.error).toBe('Credenciales inválidas');
  });

  it('debe hacer logout correctamente', () => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userId', '1');
    localStorage.setItem('userEmail', 'test@email.com');
    localStorage.setItem('userRole', 'ARRENDATARIO');

    const { result } = renderHook(() => useUsuarios());

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('isLoggedIn')).toBeNull();
    expect(result.current.usuario).toBeNull();
  });

  it('debe obtener usuario actual', async () => {
    localStorage.setItem('userId', '1');
    const mockUsuario = { id: 1, email: 'test@email.com', pnombre: 'Test', papellido: 'Apellido' };
    mockObtenerPorId.mockResolvedValue(mockUsuario);

    const { result } = renderHook(() => useUsuarios());

    let usuario: any;
    await act(async () => {
      usuario = await result.current.obtenerUsuarioActual();
    });

    expect(usuario).toEqual(mockUsuario);
    expect(result.current.usuario).toEqual(mockUsuario);
  });
});