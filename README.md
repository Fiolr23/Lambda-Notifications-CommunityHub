# Lambda-Notifications-CommunityHub

Función AWS Lambda (`communityhub-activity-reminders`) que genera recordatorios de actividades próximas.

## Qué hace

EventBridge la dispara cada cierto tiempo. En cada ejecución se conecta a la misma MongoDB que usa el backend, busca actividades activas dentro de las próximas 24 horas y, si todavía no tienen recordatorio, crea uno en la colección `notifications`. El backend expone `GET /api/notifications` para que el frontend los muestre.

```
EventBridge → Lambda → MongoDB (crea notificación) → Backend → Frontend
```

## Estructura

- `src/index.mjs` — handler (`index.handler`)
- `src/reminders.mjs` — busca eventos próximos y crea las notificaciones
- `src/db.mjs` — conexión a MongoDB, reutilizada entre invocaciones
- `src/local-test.mjs` — para probar el handler en tu máquina

## Variables de entorno

Solo `MONGODB_URI` (secreta). Copiá `.env.example` a `.env` para probar local; nunca subas `.env` a git.

## Probar local

```bash
npm install
npm run test:local
```

Corre el mismo handler que en AWS, contra tu base real, y muestra cuántas actividades revisó y cuántas notificaciones creó.

## Desplegar a AWS

La función ya está creada en la consola de AWS. Para subir código nuevo:

1. `npm install --omit=dev`
2. Comprimí `src/`, `node_modules/` y `package.json` en un `.zip` (sin `.env`)
3. Consola AWS → función → **Código** → **Cargar desde** → **.zip file**
4. Confirmá que el Handler sea `index.handler`
5. Probar con el botón **Probar** de la consola

## Notas

No usa `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`: Lambda corre con su propio rol de IAM. Evita duplicar notificaciones comprobando antes de insertar, y además la colección `notifications` tiene un índice único `(event, type)` como respaldo.
