import { getDb } from './db.mjs'

// Ventana de aviso: recordatorios para actividades dentro de las proximas 24 horas
const REMINDER_WINDOW_HOURS = 24

// Costa Rica es siempre UTC-6. AWS Lambda corre en UTC, asi que sin este ancla "20:31"
// se interpretaria mal y una actividad de esta noche pareceria ya pasada.
const LOCAL_UTC_OFFSET = '-06:00'

// Combina fecha + hora del evento en un solo momento, en hora de Costa Rica
const combineDateAndHour = (date, hour) => {
  const isoDate = new Date(date).toISOString().slice(0, 10)
  return new Date(`${isoDate}T${hour}:00${LOCAL_UTC_OFFSET}`)
}

// Busca activas en la ventana y crea un recordatorio por cada una que no tenga ya uno
// (el indice unico event+type es el respaldo anti-duplicados)
export const generateReminders = async () => {
  const db = await getDb()
  const events = db.collection('events')
  const notifications = db.collection('notifications')

  const now = new Date()
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000)

  // "date" solo guarda el dia (medianoche UTC); un evento de HOY parece "pasado" si se
  // compara contra la hora actual. Por eso el limite inferior es el inicio del dia en
  // Costa Rica, no en UTC (despues de las 18:00 local, UTC ya paso a "manana").
  const nowInCostaRica = new Date(now.getTime() - 6 * 60 * 60 * 1000)
  const startOfToday = new Date(
    Date.UTC(nowInCostaRica.getUTCFullYear(), nowInCostaRica.getUTCMonth(), nowInCostaRica.getUTCDate())
  )

  // Traemos activas de los proximos ~2 dias y filtramos con precision en memoria,
  // porque la fecha exacta depende de combinar "date" + "hour".
  const candidateEvents = await events
    .find({
      status: 'active',
      date: { $gte: startOfToday, $lte: new Date(now.getTime() + 48 * 60 * 60 * 1000) },
    })
    .toArray()

  const upcomingEvents = candidateEvents.filter((event) => {
    const eventDateTime = combineDateAndHour(event.date, event.hour)
    return eventDateTime >= now && eventDateTime <= windowEnd
  })

  let createdCount = 0

  for (const event of upcomingEvents) {
    const alreadyExists = await notifications.findOne({ event: event._id, type: 'reminder' })
    if (alreadyExists) continue

    try {
      await notifications.insertOne({
        event: event._id,
        organizer: event.organizer,
        type: 'reminder',
        message: `Tu actividad "${event.title}" comienza pronto: ${event.hour} en ${event.location}.`,
        read: false,
        createdAt: new Date(),
      })
      createdCount += 1
    } catch (error) {
      // codigo 11000 = duplicado (otra ejecucion ya creo esta notificacion): se ignora sin romper el proceso
      if (error.code !== 11000) throw error
    }
  }

  return { checked: upcomingEvents.length, created: createdCount }
}
