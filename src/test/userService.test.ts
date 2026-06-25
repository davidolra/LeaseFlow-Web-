import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService, rolService, estadoUsuarioService } from '../api';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('userService - Servicios de Usuario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('login', () => {
    it('debe hacer login exitosamente', async () => {
      const mockResponse = {
        success: true,
        mensaje: 'Login exitoso',
        usuario: { id: 1, email: 'juan@email.com', pnombre: 'Juan', papellido: 'Perez', rolId: 3 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await userService.login({ email: 'juan@email.com', clave: 'pass123' });

      expect(result.success).toBe(true);
      expect(result.usuario?.email).toBe('juan@email.com');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/usuarios/login'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-App-Client': expect.any(String), // ✅ Agregado: acepta la clave sin hardcodearla
          },
          body: JSON.stringify({ email: 'juan@email.com', clave: 'pass123' }),
        })
      );
    });

    it('debe manejar credenciales inválidas (401)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Email o contraseña incorrectos' }),
      });

      await expect(userService.login({ email: 'wrong@email.com', clave: 'wrong' })).rejects.toThrow();
    });

    it('debe manejar error 500', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Error interno' }),
      });

      await expect(userService.login({ email: 'test@email.com', clave: 'pass' })).rejects.toThrow();
    });
  });

  describe('registrar', () => {
    it('debe registrar usuario exitosamente', async () => {
      const mockUsuario = { id: 1, email: 'nuevo@email.com', pnombre: 'Nuevo' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockUsuario,
      });

      const result = await userService.registrar({
        pnombre: 'Nuevo',
        papellido: 'Apellido',
        fnacimiento: '1995-01-01',
        email: 'nuevo@email.com',
        rut: '12345678-9',
        ntelefono: '+56912345678',
        clave: 'pass123',
        estadoId: 1,
        rolId: 3,
      });

      expect(result).toEqual(mockUsuario);
    });

    it('debe manejar email duplicado (409)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Email ya registrado' }),
      });

      await expect(
        userService.registrar({
          pnombre: 'Test',
          papellido: 'Test',
          fnacimiento: '1995-01-01',
          email: 'test@email.com',
          rut: '12345678-9',
          ntelefono: '+56912345678',
          clave: 'pass',
          estadoId: 1,
          rolId: 3,
        })
      ).rejects.toThrow();
    });
  });

  describe('obtenerPorId', () => {
    it('debe obtener usuario por ID', async () => {
      const mockUsuario = { id: 1, email: 'juan@email.com', pnombre: 'Juan' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUsuario,
      });

      const result = await userService.obtenerPorId(1);

      expect(result).toEqual(mockUsuario);
    });

    it('debe manejar usuario no encontrado (404)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Usuario no encontrado' }),
      });

      await expect(userService.obtenerPorId(999)).rejects.toThrow();
    });
  });

  describe('listar', () => {
    it('debe listar usuarios', async () => {
      const mockUsuarios = [
        { id: 1, pnombre: 'User1', email: 'u1@email.com' },
        { id: 2, pnombre: 'User2', email: 'u2@email.com' },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUsuarios,
      });

      const result = await userService.listar();

      expect(result).toHaveLength(2);
    });
  });

  describe('actualizar', () => {
    it('debe actualizar usuario', async () => {
      const mockActualizado = { id: 1, pnombre: 'Actualizado', email: 'test@email.com' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockActualizado,
      });

      const result = await userService.actualizar(1, { pnombre: 'Actualizado' });

      expect(result).toEqual(mockActualizado);
    });
  });

  describe('eliminar', () => {
    it('debe eliminar usuario (204 No Content)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

      await userService.eliminar(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/usuarios/1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'X-App-Client': expect.any(String), // ✅ Agregado: acepta la clave sin hardcodearla
          },
        })
      );
    });

    it('debe manejar 409 Conflict (dependencias)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Tiene propiedades o solicitudes' }),
      });

      await expect(userService.eliminar(1)).rejects.toThrow(
        'No se puede eliminar este usuario porque tiene entidades asociadas.'
      );
    });

    it('debe manejar 404 y 405 (fallback a "no endpoint compatible")', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Usuario no encontrado' }),
      });

      await expect(userService.eliminar(999)).rejects.toThrow('No se encontró un endpoint compatible para eliminar el usuario.');
    });

    it('debe manejar 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Error interno' }),
      });

      await expect(userService.eliminar(1)).rejects.toThrow();
    });
  });

  describe('existe', () => {
    it('debe verificar si usuario existe', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => true,
      });

      const result = await userService.existe(1);

      expect(result).toBe(true);
    });

    it('debe retornar false si hay error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await userService.existe(999);

      expect(result).toBe(false);
    });
  });
});

describe('rolService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('debe listar roles', async () => {
    const mockRoles = [
      { id: 1, nombre: 'ADMIN' },
      { id: 2, nombre: 'PROPIETARIO' },
      { id: 3, nombre: 'ARRIENDATARIO' },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockRoles,
    });

    const result = await rolService.listar();

    expect(result).toHaveLength(3);
  });
});

describe('estadoUsuarioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('debe listar estados', async () => {
    const mockEstados = [
      { id: 1, nombre: 'ACTIVO' },
      { id: 2, nombre: 'INACTIVO' },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockEstados,
    });

    const result = await estadoUsuarioService.listar();

    expect(result).toHaveLength(2);
  });
});