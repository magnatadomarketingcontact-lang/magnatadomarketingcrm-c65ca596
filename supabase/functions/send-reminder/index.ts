import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ZAPI_INSTANCE_ID = Deno.env.get('ZAPI_INSTANCE_ID')
    const ZAPI_TOKEN = Deno.env.get('ZAPI_TOKEN')

    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
      throw new Error('Z-API credentials not configured')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Find patients with appointments tomorrow that haven't been reminded
    const { data: patients, error: fetchError } = await supabase
      .from('patients')
      .select('id, name, phone, appointment_date, user_id, status')
      .eq('appointment_date', tomorrowStr)
      .in('status', ['agendado', 'veio'])

    if (fetchError) throw fetchError

    if (!patients || patients.length === 0) {
      return new Response(JSON.stringify({ message: 'No reminders to send', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check which patients already got a reminder for this date
    const patientIds = patients.map(p => p.id)
    const { data: existingLogs } = await supabase
      .from('reminder_logs')
      .select('patient_id')
      .in('patient_id', patientIds)
      .eq('appointment_date', tomorrowStr)
      .eq('status', 'sent')

    const alreadySent = new Set((existingLogs || []).map(l => l.patient_id))
    const toSend = patients.filter(p => !alreadySent.has(p.id))

    const results = []

    for (const patient of toSend) {
      // Format phone for Z-API (remove non-digits, ensure country code)
      let phone = patient.phone.replace(/\D/g, '')
      if (phone.startsWith('0')) phone = phone.slice(1)
      if (!phone.startsWith('55')) phone = '55' + phone

      const message = `Olá ${patient.name}! 😊\n\nLembramos que você tem uma consulta agendada para amanhã (${new Date(tomorrowStr).toLocaleDateString('pt-BR')}).\n\nCaso precise reagendar, entre em contato conosco.\n\nAguardamos você! 🦷`

      try {
        // Send via Z-API
        const zapiResponse = await fetch(
          `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: phone,
              message: message,
            }),
          }
        )

        const zapiData = await zapiResponse.json()

        if (!zapiResponse.ok) {
          throw new Error(`Z-API error [${zapiResponse.status}]: ${JSON.stringify(zapiData)}`)
        }

        // Log success using service role (bypasses RLS)
        await supabase.from('reminder_logs').insert({
          patient_id: patient.id,
          user_id: patient.user_id,
          appointment_date: tomorrowStr,
          status: 'sent',
          message_type: 'whatsapp',
        })

        results.push({ patient_id: patient.id, status: 'sent' })
      } catch (sendError) {
        const errorMsg = sendError instanceof Error ? sendError.message : 'Unknown error'
        console.error(`Failed to send to ${patient.name}:`, errorMsg)

        await supabase.from('reminder_logs').insert({
          patient_id: patient.id,
          user_id: patient.user_id,
          appointment_date: tomorrowStr,
          status: 'failed',
          message_type: 'whatsapp',
          error_message: errorMsg,
        })

        results.push({ patient_id: patient.id, status: 'failed', error: errorMsg })
      }
    }

    return new Response(JSON.stringify({ message: 'Reminders processed', results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in send-reminder:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
