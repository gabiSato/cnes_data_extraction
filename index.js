const axios = require('axios')
fs = require('fs')

const API_BASE_URL = 'http://cnes.datasus.gov.br/services'
const PARA_STATE_CODE = 15

axios.defaults.baseURL = API_BASE_URL
axios.defaults.headers.common['Referer'] = 'http://cnes.datasus.gov.br/pages/estabelecimentos/consulta.jsp'

let errorLogs = []

async function getCities() {
  console.log('fetching cities...')

  const response = await axios.get('/municipios', { params: { estado: PARA_STATE_CODE } })
    .catch(error => {
      const log = `error ${error.response?.status} getCities`

      errorLogs.push(log)
    })

  if (!response?.data) return

  return Object.entries(response.data).map(item => item[0])
}

async function getEstablishmentAddress(establishmentId) {
  console.log('fetching establishment address...')

  const response = await axios.get(`/estabelecimentos/${establishmentId}`)
    .catch(error => {
      const log = `error ${error.response?.status} ${establishmentId} getEstablishmentAddress`

      errorLogs.push(log)
    })

  if (!response?.data) return

  const { noLogradouro, nuEndereco } = response.data

  return `${noLogradouro} ${nuEndereco}`
}

async function getEstablishments(city) {
  console.log('fetching establishments...')

  const response = await axios.get('/estabelecimentos', { params: { municipio: city } })
    .catch(error => {
      const log = `error ${error.response?.status} in ${city} getEstablishments`

      errorLogs.push(log)
    })


  if (!response?.data) return

  let establishments = []

  for (let establishment of response.data) {
    const noEndereco = await getEstablishmentAddress(establishment.id)

    establishments.push({ ...establishment, noEndereco })
  }

  return establishments
}

function generateCsv(establishments) {
  console.log('writing csv...')

  const keys = Object.keys(establishments[0]).join(',')

  let data = [keys]

  establishments.forEach(establishment => {
    const establishmentStringfy = Object.values(establishment).join(',')

    data.push(establishmentStringfy)
  })

  return data.join('\n')
}

async function main() {
  const cities = await getCities()
  let establishments = []

  for (let city of cities) {
    console.log(city)

    const establishmentsByCity = await getEstablishments(city)

    establishments.push(...establishmentsByCity)
  }

  const csvData = generateCsv(establishments)

  fs.writeFile('estabelecimentos_cnes.csv', csvData, () => {})

  fs.writeFile('logs_de_erros.txt', errorLogs.join('\n'), () => {})
}

main()
