import { Observable } from 'rxjs'
import moment from 'moment'

export interface PowerData {
  pv: number
  grid: number
  load: number
  pvday: number
}

export function observeData(): Observable<any> {
  const getJson = async (url: string): Promise<any> => {
    let resp = await fetch(url)
    return await resp.json()
  }
  const getMillis = (): number => {
    let d = new Date()
    return d.getMilliseconds()
  }
  const waitMillis = (ms: number): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, ms)
    })
  }
  return Observable.create(async (observer) => {
    const dom = 'http://192.168.1.250:8157/http://192.168.1.240'
    const powerflow = '/solar_api/v1/GetPowerFlowRealtimeData.fcgi'
    let froniusdata: PowerData = {pv: 0, grid: 0, load: 0, pvday: 0}
    let oldtime = getMillis()
    while (1) {
      try {
        let fdata = await getJson(dom + powerflow)
        froniusdata.pv = fdata.Body.Data.Site.P_PV
        froniusdata.grid = fdata.Body.Data.Site.P_Grid
        froniusdata.load = fdata.Body.Data.Site.P_Load
        froniusdata.pvday =  fdata.Body.Data.Site.E_Day
        observer.next(froniusdata)
      } catch(e) {
        console.error('observeData() explode', e)
      }
      const elapsed = getMillis() - oldtime
      await waitMillis(Math.max(5000-elapsed, 0))
      oldtime = getMillis()
    }
  })
}

export async function getCalcArchive() {
  const dom = 'http://192.168.1.250:8157/http://192.168.1.240'
  const archivepull = '/solar_api/v1/GetArchiveData.cgi?Scope=System'
  const getJson = async (url: string): Promise<any> => {
    let resp = await fetch(url)
    return await resp.json()
  }
  const getArchive = async (channel: string) => {
    const channelparms = '&Channel=' + channel
    let now = new Date()
    now.setMinutes(0)
    now.setHours(0)
    now.setSeconds(0)
    const urlparms = '&StartDate='+now.toISOString() + '&EndDate='+now.getFullYear().toString()+'-'+(now.getMonth()+1).toString()+'-'+now.getDate()
    let rawdata = await getJson(dom + archivepull + channelparms + urlparms)
    let clean1 = rawdata.Body.Data
    return clean1[Object.keys(clean1)[0]].Data[channel].Values
  }
  console.log('fetching EnergyReal_WAC_Sum_Produced')
  let produced  = await getArchive('EnergyReal_WAC_Sum_Produced')
  console.log('fetching EnergyReal_WAC_Plus_Absolute')
  let exportedplus = await getArchive('EnergyReal_WAC_Plus_Absolute')
  console.log('fetching EnergyReal_WAC_Minus_Absolute')
  let exportedminus = await getArchive('EnergyReal_WAC_Minus_Absolute')
  console.log('fetching PowerReal_PAC_Sum')
  let pvpower = await getArchive('PowerReal_PAC_Sum')
  let proddat = []
  let consdat = []
  let powdat = []
  let loaddat = []
  let cumulative = 0
  let previous = 0
  for (const key of Object.keys(produced)) {
    if ((key in exportedplus) && (key in exportedminus)  && (key in pvpower)) {
      cumulative += produced[key]
      proddat.push({t: moment().startOf('day').seconds(parseInt(key)), y: cumulative})
      powdat.push({t: moment().startOf('day').seconds(parseInt(key)), y: pvpower[key]})
      let eplus = -1*(exportedplus[0]-exportedplus[key])
      let eminus = -1*(exportedminus[0]-exportedminus[key])
      let cumload = eplus + (cumulative - eminus)
      consdat.push({
        t: moment().startOf('day').seconds(parseInt(key)),
        y: cumload
      })
      loaddat.push({
        t: moment().startOf('day').seconds(parseInt(key)),
        y: (cumload - previous) * 12
      })
      previous = cumload
    }
  }
  return [proddat, consdat, powdat, loaddat]
}

export function observeArchive(): Observable<any> {
  const getMillis = (): number => {
    let d = new Date()
    return d.getMilliseconds()
  }
  const waitMillis = (ms: number): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, ms)
    })
  }
  return Observable.create(async (observer) => {
    let oldtime = getMillis()
    while (1) {
      try {
        let result = await getCalcArchive()
        observer.next(result)
      } catch(e) {
        console.error('observeArchive() explode', e)
      }
      const elapsed = getMillis() - oldtime
      await waitMillis(Math.max(900000-elapsed, 0))
      oldtime = getMillis()
    }
  })
}