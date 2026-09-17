# Campus — frontend (React + Vite)

## Correrlo

```bash
cd frontend
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run dev              # http://localhost:5173
```

El backend de Django debe estar corriendo en http://127.0.0.1:8000.

## Estructura

```
src/
├── api.js            Un solo lugar que habla con el backend (token + errores)
├── AuthContext.jsx   Sesión global: login, logout, perfil
├── App.jsx           Rutas
├── components/
│   ├── Layout.jsx    Nav izquierda (desktop) + tabbar (móvil) + rail derecho
│   ├── Rail.jsx      Columna derecha: escuela + sugerencias
│   ├── Post.jsx      Publicación: like, comentarios, borrar
│   ├── Composer.jsx  Caja de "¿Qué está pasando?"
│   ├── EditProfile.jsx
│   ├── Avatar.jsx
│   ├── Skeleton.jsx
│   └── icons.jsx
└── pages/
    ├── Feed.jsx        /              Tu escuela | Siguiendo
    ├── Explore.jsx     /explorar      Búsqueda de estudiantes
    ├── Connections.jsx /conexiones    Sigues | Te siguen
    ├── Profile.jsx     /perfil, /u/:username
    ├── Login.jsx       /login
    └── Register.jsx    /registro
```

## Sistema de diseño

Los tokens viven en `src/index.css` como variables CSS. Cambia ahí, no en los componentes.

| Token | Valor | Uso |
|---|---|---|
| `--obsidian` | `#0C0F17` | Fondo |
| `--slate` | `#171B26` | Superficies elevadas |
| `--snow` | `#F4F6FB` | Texto principal |
| `--mist` | `#9AA3B5` | Texto secundario |
| `--violet` | `#7C3AED` | Acento de marca: acciones, nav activa, semestre |
| `--coral` | `#FF6B6B` | Solo alertas, likes activos, errores |

Tipografía: Space Grotesk (display, identidad) + Plus Jakarta Sans (todo lo demás).
