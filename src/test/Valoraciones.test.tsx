import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Valoraciones from '../paginas/Valoraciones';
import API_CONFIG from '../config/apiConfig';

const mockFetch = vi.fn();
global.fetch = mockFetch;
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('Valoraciones - Alto Impacto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockNavigate.mockClear();
    localStorage.clear();
  });

  describe('Validaciones iniciales', () => {
    it('envía a login si no hay sesión activa', async () => {
      localStorage.clear();
      render(<MemoryRouter><Valoraciones /></MemoryRouter>);
      const stars = screen.getAllByText('★');
      fireEvent.click(stars[4]);
      fireEvent.click(screen.getByRole('button', { name: /enviar reseña/i }));
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', expect.any(Object)));
    });

    it('envía a login si no hay userId', async () => {
      localStorage.setItem('isLoggedIn', 'true');
      render(<MemoryRouter><Valoraciones /></MemoryRouter>);
      const stars = screen.getAllByText('★');
      fireEvent.click(stars[4]);
      fireEvent.click(screen.getByRole('button', { name: /enviar reseña/i }));
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', expect.any(Object)));
    });
  });

  describe('Rating', () => {
    it('habilita botón solo cuando rating > 0', async () => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', '5');
      render(<MemoryRouter><Valoraciones /></MemoryRouter>);
      const btn = screen.getByRole('button', { name: /enviar reseña/i });
      expect(btn).toBeDisabled();
      const stars = screen.getAllByText('★');
      fireEvent.click(stars[3]);
      expect(btn).not.toBeDisabled();
    });

    it('resetea rating a 0 al hacer click en la misma estrella', async () => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', '5');
      render(<MemoryRouter><Valoraciones /></MemoryRouter>);
      const stars = screen.getAllByText('★');
      fireEvent.click(stars[3]);
      
      // Simulamos comportamiento esperando que el fix 1.3 de Valoraciones.tsx esté aplicado
      fireEvent.click(stars[3]);
      const btn = screen.getByRole('button', { name: /enviar reseña/i });
      await waitFor(() => expect(btn).toBeDisabled());
    });
  });

  describe('Envío exitoso', () => {
    it('envía reseña y limpia formulario', async () => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', '5');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '',
      });

      render(<MemoryRouter><Valoraciones /></MemoryRouter>);

      const stars = screen.getAllByText('★');
      fireEvent.click(stars[3]);

      fireEvent.change(screen.getByPlaceholderText(/escribe tu comentario/i), {
        target: { value: 'Muy bueno' },
      });

      fireEvent.click(screen.getByRole('button', { name: /enviar reseña/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`${API_CONFIG.REVIEW_SERVICE}/reviews`, expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"puntaje":4'),
        }));
      });
      await waitFor(() => expect(screen.getByText(/reseña enviada/i)).toBeInTheDocument());
    });
  });

  describe('Manejo de errores', () => {
    it('maneja error 500 genérico', async () => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', '5');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
        headers: new Headers({ 'Content-Type': 'text/plain' })
      });

      render(<MemoryRouter><Valoraciones /></MemoryRouter>);
      const stars = screen.getAllByText('★');
      fireEvent.click(stars[4]);
      fireEvent.click(screen.getByRole('button', { name: /enviar reseña/i }));

      await waitFor(() => expect(screen.getByText(/error 500:/i)).toBeInTheDocument());
    });

    it('parsea mensaje JSON del error', async () => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', '5');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: 'Campo rating requerido' }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      render(<MemoryRouter><Valoraciones /></MemoryRouter>);
      const stars = screen.getAllByText('★');
      fireEvent.click(stars[2]);
      fireEvent.click(screen.getByRole('button', { name: /enviar reseña/i }));

      await waitFor(() => expect(screen.getByText(/campo rating requerido/i)).toBeInTheDocument());
    });

    it('muestra texto plano si el error no es JSON', async () => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', '5');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: async () => 'Bad Gateway',
        headers: new Headers({ 'Content-Type': 'text/plain' })
      });

      render(<MemoryRouter><Valoraciones /></MemoryRouter>);
      const stars = screen.getAllByText('★');
      fireEvent.click(stars[4]);
      fireEvent.click(screen.getByRole('button', { name: /enviar reseña/i }));

      await waitFor(() => expect(screen.getByText(/error 502:/i)).toBeInTheDocument());
    });
  });

  describe('Notificaciones', () => {
    it('limpia notificación automáticamente', async () => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', '5');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '',
      });

      render(<MemoryRouter><Valoraciones /></MemoryRouter>);
      const stars = screen.getAllByText('★');
      fireEvent.click(stars[3]);
      fireEvent.click(screen.getByRole('button', { name: /enviar reseña/i }));

      await waitFor(() => screen.getByText(/reseña enviada/i));
      
      // Avanzar timer y esperar ciclo de React sin fakeTimers persistentes
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      });
      expect(screen.queryByText(/reseña enviada/i)).not.toBeInTheDocument();
    });
  });

  describe('Callback onEnviar', () => {
    it('llama a onEnviar con rating y comentario después de éxito', async () => {
      const onEnviar = vi.fn();
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', '5');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '',
      });

      render(<MemoryRouter><Valoraciones onEnviar={onEnviar} /></MemoryRouter>);

      const stars = screen.getAllByText('★');
      fireEvent.click(stars[4]);
      fireEvent.change(screen.getByPlaceholderText(/escribe tu comentario/i), {
        target: { value: 'Excelente' },
      });
      fireEvent.click(screen.getByRole('button', { name: /enviar reseña/i }));

      await waitFor(() => expect(onEnviar).toHaveBeenCalledWith(5, 'Excelente'));
    });
  });
});