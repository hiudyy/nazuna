import https from 'https'
import fs from 'fs'
import verificarAPI from '../API.js'

const CONFIG_FILE = JSON.parse(
  fs.readFileSync(new URL('../../config.json', import.meta.url), 'utf8')
)

const MODELOS_VALIDOS = ['masculino', 'feminino', 'robo', 'alien']

async function tts(query, modelo = 'feminino') {
  const checkAPI = await verificarAPI()

  if (checkAPI !== true) {
    return {
      ok: false,
      msg: checkAPI
    }
  }

  try {
    if (!query || typeof query !== 'string') {
      return {
        ok: false,
        msg: 'Texto inválido'
      }
    }

    if (!MODELOS_VALIDOS.includes(modelo)) {
      return {
        ok: false,
        msg: `Modelo inválido. Use: ${MODELOS_VALIDOS.join(', ')}`
      }
    }

    const { apikey_vex, site_vex } = CONFIG_FILE

    const api = new URL('/api/ias/tts', site_vex)
    api.searchParams.set('apikey', apikey_vex)
    api.searchParams.set('query', query)
    api.searchParams.set('modelo', modelo)

    const data = await new Promise((resolve, reject) => {
      https.get(api, res => {
        const chunks = []

        res.on('data', chunk => chunks.push(chunk))

        res.on('end', () => {
          const buffer = Buffer.concat(chunks)
          const contentType = res.headers['content-type'] || 'audio/mpeg'
          const codigo = res.statusCode
          const isJson = contentType.includes('application/json')

          if (codigo !== 200 || isJson) {
            const texto = buffer.toString('utf8').trim()
            let corpo = null

            try {
              corpo = JSON.parse(texto)
            } catch {}

            return resolve({
              erro: true,
              corpo,
              texto,
              codigo
            })
          }

          resolve({
            erro: false,
            audio: buffer,
            contentType,
            codigo
          })
        })
      }).on('error', reject)
    })

    if (data.erro) {
      if (data.corpo) {
        const check = await verificarAPI(data.corpo)

        if (check !== true) {
          return {
            ok: false,
            msg: check,
            codigo: data.codigo
          }
        }
      }

      return {
        ok: false,
        msg: data.corpo?.message || data.texto || `Erro na API: HTTP ${data.codigo}`,
        codigo: data.codigo
      }
    }

    return {
      ok: true,
      audio: data.audio,
      contentType: data.contentType,
      codigo: data.codigo,
      modelo,
      message: 'sucesso'
    }
  } catch (err) {
    return {
      ok: false,
      msg: err.message
    }
  }
}

export { tts, MODELOS_VALIDOS }