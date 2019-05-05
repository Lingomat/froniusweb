import { Observable } from 'rxjs'
import moment from 'moment'

export interface PowerData {
  pv: number
  grid: number
  load: number
  pvday: number
}

export interface ArchiveData {
  produced: {t: moment.Moment, y: number}[],
  consumed: {t: moment.Moment, y: number}[],
  power: {t: moment.Moment, y: number}[],
  load: {t: moment.Moment, y: number}[],
}

export function observeData(apiurl: string, realtimesec: number = 5, archivesec: number = 600): Observable<{realtime?: PowerData, archive?: ArchiveData}> {
  const getJson = async (url: string): Promise<any> => {
    let resp = await fetch(url)
    return await resp.json()
  }
  const getCalcArchive = async (apiurl: string): Promise<ArchiveData> => {
    const getArchive = async (channel: string) => {
      const channelparms = '&Channel=' + channel
      let now = new Date()
      now.setMinutes(0)
      now.setHours(0)
      now.setSeconds(0)
      const urlparms = '&StartDate='+now.toISOString() + '&EndDate='+now.getFullYear().toString()+'-'+(now.getMonth()+1).toString()+'-'+now.getDate()
      let rawdata = await getJson(apiurl + '/solar_api/v1/GetArchiveData.cgi?Scope=System' + channelparms + urlparms)
      let clean1 = rawdata.Body.Data
      return clean1[Object.keys(clean1)[0]].Data[channel].Values
    }
    console.log('fronweb: fetching EnergyReal_WAC_Sum_Produced')
    let produced  = await getArchive('EnergyReal_WAC_Sum_Produced')
    console.log('fronweb: fetching EnergyReal_WAC_Plus_Absolute')
    let exportedplus = await getArchive('EnergyReal_WAC_Plus_Absolute')
    console.log('fronweb: fetching EnergyReal_WAC_Minus_Absolute')
    let exportedminus = await getArchive('EnergyReal_WAC_Minus_Absolute')
    console.log('fronweb: fetching PowerReal_PAC_Sum')
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
    return {
      produced: proddat, 
      consumed: consdat,
      power: powdat,
      load: loaddat
    }
  }
  return Observable.create(function(observer) {
    let rtrunning: boolean = false
    let arunning: boolean = false
    const doRealtime = async () => {
      if (rtrunning) {
        return
      }
      rtrunning = true
      try {
        console.log('fronweb: fetching GetPowerFlowRealtimeData.fcgi')
        getJson(apiurl + '/solar_api/v1/GetPowerFlowRealtimeData.fcgi').then((fdata) => {
          observer.next({realtime: {
            pv: fdata.Body.Data.Site.P_PV,
            grid: fdata.Body.Data.Site.P_Grid,
            load: fdata.Body.Data.Site.P_Load,
            pvday: fdata.Body.Data.Site.E_Day
          }})
          rtrunning = false
        })
      } catch(e) {
        console.error('observeData() explode', e)
        rtrunning = false
      } 
    }
    const doArchive = async () => {
      if (arunning) {
        return
      }
      arunning = true
      try {
        getCalcArchive(apiurl).then((archivedata) => {
          observer.next({archive: archivedata})
          arunning = false
        })
      } catch(e) {
        console.error('observeData() explode', e)
        arunning = false
      }       
    }
    // right away
    doRealtime() 
    // realtime timer
    const rtinterval = setInterval(async () => {
      doRealtime()
    }, realtimesec*1000)
    // right away
    doArchive()
    // archive timer
    const ainterval = setInterval(async () => {
      doArchive()
    }, archivesec*1000)
    return () => {
      clearInterval(rtinterval)
      clearInterval(ainterval)
    }
  })
}
