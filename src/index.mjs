import { generateReminders } from './reminders.mjs'

// Handler configurado en AWS: index.handler. Lo dispara el trigger de EventBridge.
export const handler = async (event) => {
  try {
    const result = await generateReminders()
    console.log('Recordatorios generados:', result)

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, ...result }),
    }
  } catch (error) {
    console.error('Error generando recordatorios:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: error.message }),
    }
  }
}
