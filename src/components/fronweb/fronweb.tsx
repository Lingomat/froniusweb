import { Component, State, Element, Method, Prop } from '@stencil/core';
import { observeData, PowerData} from '../../utils/utils';
import Chart from 'chart.js'
import moment from 'moment'
import Subscription from 'rxjs'
import { createInputFiles } from 'typescript';

@Component({
  tag: 'fronweb-component',
  styleUrl: 'fronweb.css',
  shadow: true
})
export class FronwebComponent {
  @Prop() apiurl: string = ''
  @Element() private element: HTMLElement;
  @State() powerdata: PowerData = {pv: 0, grid: 0, load: 0, pvday: 0}
  canvasElement: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  chart: Chart = null
  datasub: Subscription.Subscription
  started: boolean = false

  async componentDidLoad() {
    this.canvasElement = this.element.shadowRoot.querySelector('#power');
    this.ctx = this.canvasElement.getContext('2d')
    this.subscribeToData()
  }

  formatPower (num: number, h: boolean = false): string {
    let hours: string = h ? 'h' : ''
    if (Math.abs(num) < 1000) {
      return Math.round(num).toString()+'W' + hours
    } else {
      return (num/1000).toFixed(1)+'kW' + hours
    }
  }

  @Method()
  pause() {
    if (this.datasub) {
      this.datasub.unsubscribe()
      this.started = false
    }
  }
  @Method()
  resume() {
    if (!this.started) {
      this.subscribeToData()
    }
  }

  subscribeToData() {
    this.datasub = observeData(this.apiurl).subscribe((dat) => {
      if (dat.realtime) {
        this.powerdata = dat.realtime
        this.powerdata = Object.assign({}, dat.realtime) // copy needed to trigger state refresh
      }
      if (dat.archive) {
        this.doPChart(dat.archive.produced, dat.archive.consumed, dat.archive.power, dat.archive.load)
      }
    })
    this.started = true
  }

  async doPChart(produced: {t: moment.Moment, y: number}[], consumed: {t: moment.Moment, y: number}[], power: {t: moment.Moment, y: number}[], loaddat: {t: moment.Moment, y: number}[]) {
    if (this.chart) {
      this.chart.data.datasets[0].data = produced
      this.chart.data.datasets[1].data = consumed
      this.chart.data.datasets[2].data = power
      this.chart.data.datasets[3].data = loaddat
      this.chart.update()
    } else {
      this.setupChart(produced, consumed, power, loaddat)
    }
  }

  setupChart(produced: {t: moment.Moment, y: number}[], consumed: {t: moment.Moment, y: number}[], power: {t: moment.Moment, y: number}[], loaddat: {t: moment.Moment, y: number}[]) {
    this.chart = new Chart(this.ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: "Produced",
          borderColor: 'rgba(99,255,99,0.4)',
          backgroundColor: 'rgba(99,255,99,0.4)',
          fill: true,
          showLine: true,
          data: produced,
          yAxisID: 'B',
          borderWidth: 0
        }, {
          label: "Consumed",
          borderColor: 'rgba(255,99,99,0.4)',
          backgroundColor: 'rgba(255,99,99,0.4)',
          fill: true,
          showLine: true,
          data: consumed,
          yAxisID: 'B',
          borderWidth: 0
        }, {
          label: "PV",
          borderColor: 'rgb(55, 150, 55)',
          fill: false,
          showLine: true,
          data: power,
          yAxisID: 'A'
        }, {
          label: "Load",
          borderColor: 'rgb(150, 55, 55)',
          fill: false,
          showLine: true,
          data: loaddat,
          yAxisID: 'A'
        }]
      },
      options: {
        responsive:true,
        maintainAspectRatio: false,
        legend: {
          display: false
        },
        tooltips: {
          enabled: false
        },
        elements: { 
          point: { radius: 0 },
          line: { borderWidth: 2}
        },
        scales: {
          xAxes: [{
              type: 'time',
              time: {
                min: moment().startOf('day'),
              },
              ticks: {
                fontColor: 'rgb(120,120,120)',
                suggestedMax: moment().endOf('day'),
              },
              gridLines: {
                color: 'rgba(200,200,200,0.4)'
              },
          }],
          yAxes: [{
            id: 'A',
            type: 'linear',
            position: 'left',
            ticks: {
              fontColor: 'rgb(120,120,120)',
              callback: function(value) {
                return value + 'W';
              }
            },
            gridLines: {
              color: 'rgba(50,50,200,0.4)'
            },
          }, {
            id: 'B',
            type: 'linear',
            position: 'right',
            ticks: {
              fontColor: 'rgb(120,120,120)',
              callback: function(value) {
                return value/1000 + 'kWh';
              }
            }
          }]
        }
      }
    })
  }

  getGridColour(): string {
    const clamp = (val, min, max) => {
      return val > max ? max : val < min ? min : val;
    }
    let clamped = clamp(this.powerdata.grid, -3000, 3000)
    let scaled = Math.round(clamped / (3000/128))
    let redcol = 128 + scaled
    let greencol = 128 - scaled
    let str = 'rgb(' + redcol.toString() + ',' + greencol.toString() + ',50)'
    //console.log(str)
    return str
  }

  render() {
    return <div id="wrapper">
      <div class="text">
        <div class="row">
          <div class="column label"><span class="txt output">Solar</span></div>
          <div class="column value"><span class="txt output">{this.formatPower(this.powerdata.pv)}</span></div>
          <div class="column label"><span class="txt output">Today</span></div>
          <div class="column value"><span class="txt output">{this.formatPower(this.powerdata.pvday, true)}</span></div>
        </div>
        <div class="row">
          <div class="column label"><span class="txt" style={{color: this.getGridColour()}}>Grid</span></div>
          <div class="column value"><span class="txt" style={{color: this.getGridColour()}}>{this.formatPower(this.powerdata.grid)}</span></div>
          <div class="column label"><span class="txt load">House</span></div>
          <div class="column value"><span class="txt load">{this.formatPower(this.powerdata.load*-1)}</span></div>
        </div>
        <div class="row">
          
        </div>
      </div>
      <div class="chart-container">
          <canvas id="power"></canvas>
      </div>
    </div>;
  }
}
