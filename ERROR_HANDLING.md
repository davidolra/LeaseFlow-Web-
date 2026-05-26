# Error Handling Guide - LeaseFlow

## Overview

LeaseFlow utiliza un sistema centralizado y type-safe de manejo de errores basado en clases de error específicas y un servicio singleton `ErrorHandlerService`. Este sistema proporciona:

- ✅ **Tipado estricto**: Eliminación de `any`, uso consistente de `unknown`
- ✅ **Clasificación automática**: Los errores se categorizan por tipo y severidad
- ✅ **Logging consistente**: Logs estructurados con contexto
- ✅ **Mantenibilidad**: Código centralizado y reutilizable
- ✅ **Testing**: Errores fáciles de testear y mockear

---

## Architecture

```
src/core/errors/
├── AppError.ts           # Clases base y específicas de error
├── ErrorHandler.ts       # Singleton service para manejo centralizado
└── index.ts             # Exportaciones públicas
```

### Jerarquía de Clases

```
AppError (clase base)
├── ApiError (errores HTTP 4xx/5xx)
├── NetworkError (errores de conexión)
├── ValidationError (errores de validación)
├── AuthError (HTTP 401)
├── PermissionError (HTTP 403)
├── NotFoundError (HTTP 404)
├── ConflictError (HTTP 409)
└── ServerError (HTTP 5xx)
```

---

## Usage

### 1. En Servicios API

**Antes (Anti-pattern):**
```typescript
async crear(datos: CreateRequest): Promise<Data> {
  try {
    const response = await fetch(`${BASE_URL}/api`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(datos),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudo crear`);
    }

    return await response.json();
  } catch (error: any) {  // ❌ Tipado inseguro
    console.error('Error:', error);
    throw error;
  }
}
```

**Después (Pattern recomendado):**
```typescript
import { ErrorHandlerService } from '../core/errors';

async function parseErrorResponse(response: Response): Promise<{ message: string }> {
  try {
    return await response.json();
  } catch {
    return { message: `Error ${response.status}: ${response.statusText}` };
  }
}

async crear(datos: CreateRequest): Promise<Data> {
  try {
    const response = await fetch(`${BASE_URL}/api`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(datos),
    });

    if (!response.ok) {
      const errorData = await parseErrorResponse(response);
      throw ErrorHandlerService.handle(
        { status: response.status, message: errorData.message },
        'crear'
      );
    }

    return await response.json();
  } catch (error: unknown) {  // ✅ Tipado seguro
    throw ErrorHandlerService.handle(error, 'crear');
  }
}
```

### 2. En Hooks

```typescript
import { ErrorHandlerService } from '../core/errors';
import type { MiDTO } from '../types';

export const useMiHook = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const operacion = async (datos: MiDTO) => {
    setLoading(true);
    setError(null);

    try {
      const resultado = await miService.crear(datos);
      // ...
    } catch (err: unknown) {
      const errorMsg = ErrorHandlerService.getUserMessage(err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return { error, loading, operacion };
};
```

### 3. En Componentes

```typescript
import { ErrorHandlerService } from '../core/errors';

const MiComponente: React.FC = () => {
  const handleClick = async () => {
    try {
      const resultado = await miService.operacion();
      // ...
    } catch (error: unknown) {
      if (ErrorHandlerService.isAuthError(error)) {
        navigate('/login');
      } else if (ErrorHandlerService.isValidationError(error)) {
        setFormErrors(error.details);
      } else {
        showNotification(ErrorHandlerService.getUserMessage(error));
      }
    }
  };

  return <button onClick={handleClick}>Operación</button>;
};
```

---

## Error Types

### AppError (Base)
Error genérico con propiedades comunes.

```typescript
new AppError(
  'Mensaje de error',
  ErrorType.UNKNOWN,      // Tipo de error
  ErrorSeverity.MEDIUM,   // Severidad
  undefined,              // Status code
  originalError           // Error original (para debugging)
)
```

### ApiError
Errores HTTP de API.

```typescript
new ApiError('API error message', 400, originalError);
// Severidad: HIGH
// Type: API
```

### NetworkError
Errores de conexión de red.

```typescript
new NetworkError('No se pudo conectar con el servidor', originalError);
// Severidad: HIGH
// Type: NETWORK
```

### ValidationError
Errores de validación de datos.

```typescript
new ValidationError(
  'Los datos no son válidos',
  { email: 'Email inválido', nombre: 'Campo requerido' },
  originalError
);
// Severidad: MEDIUM
// Type: VALIDATION
```

### AuthError
Errores de autenticación (HTTP 401).

```typescript
new AuthError('Tu sesión ha expirado', originalError);
// Severidad: HIGH
// Status Code: 401
// Type: AUTH
```

### PermissionError
Errores de permisos (HTTP 403).

```typescript
new PermissionError('No tienes permisos para esta acción', originalError);
// Severidad: HIGH
// Status Code: 403
// Type: PERMISSION
```

### NotFoundError
Recurso no encontrado (HTTP 404).

```typescript
new NotFoundError('El recurso no fue encontrado', originalError);
// Severidad: LOW
// Status Code: 404
// Type: NOT_FOUND
```

### ConflictError
Conflicto de datos (HTTP 409).

```typescript
new ConflictError('El email ya está registrado', originalError);
// Severidad: MEDIUM
// Status Code: 409
// Type: CONFLICT
```

### ServerError
Errores del servidor (HTTP 5xx).

```typescript
new ServerError('El servidor no está disponible', originalError);
// Severidad: CRITICAL
// Status Code: 500
// Type: SERVER
```

---

## ErrorHandlerService

### Métodos Principales

#### `handle(error: unknown, context?: string): AppError`
Clasifica y maneja un error, retornando una instancia `AppError`.

```typescript
try {
  await miService.operacion();
} catch (error: unknown) {
  const appError = ErrorHandlerService.handle(error, 'miOperacion');
  // appError es una instancia tipada de AppError o subclase
  console.log(appError.message);      // Mensaje de error
  console.log(appError.type);         // Tipo: API, NETWORK, AUTH, etc.
  console.log(appError.severity);     // Severidad: LOW, MEDIUM, HIGH, CRITICAL
  console.log(appError.statusCode);   // Status HTTP si aplica
}
```

#### `getUserMessage(error: unknown): string`
Obtiene un mensaje amigable para el usuario.

```typescript
try {
  await miService.operacion();
} catch (error: unknown) {
  const mensaje = ErrorHandlerService.getUserMessage(error);
  setError(mensaje);  // Mostrar a usuario
}
```

#### Type Guards
Verificar el tipo específico de error.

```typescript
try {
  await miService.operacion();
} catch (error: unknown) {
  if (ErrorHandlerService.isAuthError(error)) {
    // Redirigir a login
  } else if (ErrorHandlerService.isValidationError(error)) {
    // Mostrar errores de campo
  } else if (ErrorHandlerService.isNetworkError(error)) {
    // Reintentar
  } else if (ErrorHandlerService.isApiError(error)) {
    // Mostrar error genérico
  }
}
```

Métodos disponibles:
- `isApiError(error): error is ApiError`
- `isNetworkError(error): error is NetworkError`
- `isValidationError(error): error is ValidationError`
- `isAuthError(error): error is AuthError`
- `isPermissionError(error): error is PermissionError`
- `isNotFoundError(error): error is NotFoundError`
- `isConflictError(error): error is ConflictError`

---

## Properties

Todos los `AppError` tienen las siguientes propiedades:

```typescript
interface AppError {
  name: string;                    // Nombre de la clase
  message: string;                 // Mensaje de error
  type: ErrorType;                 // Tipo de error
  severity: ErrorSeverity;         // Severidad
  statusCode?: number;             // Status HTTP si aplica
  originalError?: unknown;         // Error original para debugging
  timestamp: Date;                 // Cuándo ocurrió el error
  
  // Métodos
  toJSON(): {...};                 // Serializar a JSON
}
```

---

## Severity Levels

- **LOW**: Advertencias, información no crítica
- **MEDIUM**: Errores que no afectan la operación principal
- **HIGH**: Errores importantes que requieren atención
- **CRITICAL**: Errores que rompen la aplicación

---

## Error Type Classification

| Status HTTP | Error Class | Severidad | Context |
|-------------|-------------|-----------|---------|
| 400 | ValidationError | MEDIUM | Datos inválidos |
| 401 | AuthError | HIGH | Autenticación requerida |
| 403 | PermissionError | HIGH | Acceso denegado |
| 404 | NotFoundError | LOW | Recurso no existe |
| 409 | ConflictError | MEDIUM | Conflicto de datos |
| 500 | ServerError | CRITICAL | Error interno servidor |
| Otros 4xx/5xx | ApiError | HIGH | Error API genérico |
| Network | NetworkError | HIGH | Conexión fallida |
| Unknown | AppError | MEDIUM | Desconocido |

---

## Logging

Los errores se loguean automáticamente con contexto y severidad:

```
🔴 CRITICAL ERROR [operacion]: ServerError {...}
❌ ERROR [operacion]: ApiError Error 500
⚠️  WARNING [operacion]: ValidationError Campos inválidos
ℹ️  INFO [operacion]: NotFoundError Recurso no encontrado
```

---

## Best Practices

### ✅ DO

1. **Usar `unknown` en catch blocks**
   ```typescript
   catch (error: unknown) {
     throw ErrorHandlerService.handle(error);
   }
   ```

2. **Proporcionar contexto operacional**
   ```typescript
   throw ErrorHandlerService.handle(error, 'crearUsuario');
   ```

3. **Usar type guards para decisiones específicas**
   ```typescript
   if (ErrorHandlerService.isAuthError(error)) {
     navigate('/login');
   }
   ```

4. **Obtener mensajes amigables para el usuario**
   ```typescript
   const msg = ErrorHandlerService.getUserMessage(error);
   ```

5. **Preservar errores originales**
   ```typescript
   new ApiError('User message', 500, originalError);
   ```

### ❌ DON'T

1. **No usar `any` en catch blocks**
   ```typescript
   catch (error: any) { }  // ❌
   ```

2. **No lanzar errores genéricos**
   ```typescript
   throw new Error('Something went wrong');  // ❌
   ```

3. **No ignorar errores de red**
   ```typescript
   } catch { }  // ❌
   ```

4. **No duplicar lógica de manejo de errores**
   ```typescript
   // ❌ Copiar/pegar handleError en múltiples servicios
   ```

5. **No crear errores sin contexto**
   ```typescript
   throw new ApiError('Error');  // ❌ Sin información útil
   ```

---

## Testing

Ver `src/test/errorHandler.test.ts` para ejemplos de testing.

```typescript
import { ErrorHandlerService, ValidationError } from '../core/errors';

describe('Mi Servicio', () => {
  it('debería manejar errores de validación', () => {
    const error = new ValidationError('Campo requerido', { name: 'Required' });
    
    expect(ErrorHandlerService.isValidationError(error)).toBe(true);
    expect(error.details).toEqual({ name: 'Required' });
  });
});
```

---

## Migration Guide

Si estás migrando código existente:

### 1. Imports
```typescript
// Antes
import { userService } from '../api/userService';

// Después
import { ErrorHandlerService } from '../core/errors';
import { userService } from '../api/userService';
```

### 2. Service Methods
```typescript
// Antes
} catch (error: any) {
  console.error('Error:', error);
  throw error;
}

// Después
} catch (error: unknown) {
  throw ErrorHandlerService.handle(error, 'operationName');
}
```

### 3. Hook Error Handling
```typescript
// Antes
} catch (err: any) {
  const msg = err.message || 'Error';
  setError(msg);
}

// Después
} catch (err: unknown) {
  setError(ErrorHandlerService.getUserMessage(err));
}
```

---

## References

- **Architecture**: Singleton pattern con error classification
- **Type Safety**: TypeScript strict mode, `unknown` over `any`
- **Testing**: Comprehensive test suite in `src/test/errorHandler.test.ts`
- **Standards**: Seguir patterns establecidos en servicios refactorizados

---

**Última actualización**: 2026-05-26  
**Status**: Implementado en toda la aplicación  
**Coverage**: 100% de servicios API, hooks y componentes principales
