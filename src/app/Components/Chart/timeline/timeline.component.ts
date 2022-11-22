import { Component, OnInit, AfterViewInit } from '@angular/core';
import { GoogleChartInterface, GoogleChartType, ChartSelectEvent } from 'ng2-google-charts';
import { DateFormat } from 'ng2-google-charts/lib/google-charts-datatable';
import { empty } from 'rxjs';

@Component({
  selector: 'timeline-chart',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnInit, AfterViewInit {
  startHour: number = 7;
  endHour: number = 21;
  defaultHeight: number = 45;
  selectedDate: string = '2022-11-9';
  defaultPodColor: string = 'green';

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
  }

  public timeline: GoogleChartInterface = {
    chartType: GoogleChartType.Timeline,
    dataTable: this.processedAvailableHour(),
    options: {
      height: (this.defaultHeight * this.uniquePod().length) + 55,
      hAxis: {
        minValue: new Date(this.selectedDate).setHours(this.startHour),  
        maxValue: new Date(this.selectedDate).setHours(this.endHour),  
      },
      timeline: { },
      colors: this.timelineColor()
    }
  };

  public select(event: ChartSelectEvent) {
    alert(event.selectedRowValues);
  }

  private uniquePod()
  {
    let preparePod = [];
    for(let data of this.dataReceived()) {
      preparePod.push(data.podType);
    }

    return preparePod.filter(this.onlyUnique);
  }

  private processedAvailableHour()
  {
    let availableHour = this.generateAvailableHour();

    return this.uniquePod().map(podType => {
      return availableHour.filter(e => e.podType === podType);
    }).flatMap((podGroup) => {
      return podGroup.map((pod) => {
        return [
          pod.podType,
          pod.label,
          pod.startTime,
          pod.endTime
        ];
      });
    });
  }

  private generateAvailableHour()
  {
    let booked =  this.dataReceived();
    let uniquePod = this.uniquePod();

    var availableHour = [];
    for (let pod of uniquePod.entries()) {
      let emptyPod = booked.filter((e:any) => e[0] === pod[1] && e[1] === null);
      let podColor = emptyPod.length > 0 ? emptyPod[0][4]: this.defaultPodColor;

      for (let i = this.startHour; i < this.endHour; i++) {
        let currentStart = new Date(this.selectedDate + ' ' + i + ':00:00');
        let currentEnd = new Date(this.selectedDate + ' ' + i + ':30:00');

        let currentSecondStart = new Date(this.selectedDate + ' ' + i + ':30:00');
        let currentSecondEnd = new Date(this.selectedDate + ' ' + (i + 1)+ ':00:00');

        availableHour.push({
            ['podType']: pod[1],
            ['label']: '',
            ['startTime']: currentStart,
            ['endTime']: currentEnd,
            ['color']: podColor
        });

        availableHour.push({
            ['podType']: pod[1],
            ['label']: '',
            ['startTime']: currentSecondStart,
            ['endTime']: currentSecondEnd,
            ['color']: podColor
        });

      }
    }

    //booked
    for (let podTime of booked) {
      let bookStart = (podTime.startTime.getHours() * 60) + podTime.startTime.getMinutes(); 
      let bookEnd = (podTime.endTime.getHours() * 60) + podTime.endTime.getMinutes();
      let toBeRemove = [];
      
      for (let [index, pod] of availableHour.entries()) {
        let currentStart = (pod.startTime.getHours() * 60) + pod.startTime.getMinutes(); 
        let currentEnd = (pod.endTime.getHours() * 60) + pod.endTime.getMinutes(); 
        
        if(currentStart >= bookStart && currentEnd <= bookEnd && pod.podType == podTime.podType) {
          toBeRemove.push(index);
        }
      }
      for(let removeIndex of toBeRemove.reverse()) {
        availableHour.splice(removeIndex, 1);
      }

      let bookedStartHour = podTime.startTime.getHours();
      if(bookedStartHour >= this.startHour) {
        availableHour.push(podTime);
      }
    }

    // Timeline chart will auto exclude item with index: 0. Add redundancy to prevent that
    availableHour.push(availableHour[0]);

    return availableHour;
  }

  private timelineColor()
  {
    let availableHour = this.generateAvailableHour();
  
    let podTypeList = [];
    for(let podType of this.uniquePod()) {
      let pereparePodList = availableHour.filter((pod) => {
        return pod.podType == podType;
      }).sort(function(a, b){
        return a.startHour - b.startHour;
      });

      let preparePod = [];
      for(let data of pereparePodList) {
        preparePod.push(data.label != '' ? data.label : data.podType);
      }

      let podList = preparePod.filter(this.onlyUnique);

      podTypeList.push({podType: podList})
    }

    var colors: string[] = [];
    for(let podTypes of podTypeList) {
      podTypes['podType'].forEach(item => {
        let bookedDetail = availableHour.find(pod => pod.label === item);
        let emptyPodDetail = availableHour.find(pod => pod.podType === item);

        let itemColor = this.uniquePod().includes(item) || bookedDetail == undefined || bookedDetail.length < 4 ? emptyPodDetail.color : bookedDetail.color;
        colors.push(itemColor);
      });
    }
    console.log(colors);
    return colors;
  }

  private onlyUnique(value: any, index: any, self: any) {
    return self.indexOf(value) === index;
  }

  private dataReceived()
  {
    let data = JSON.parse('{"result":{"stat":[{"x":"aaaTestPod3","y":[1667989800000,1667995200000],"fillColor":"#FF4560","label":"NotAvailable"},{"x":"TestPod3","y":[1667989800000,1667995200000],"fillColor":"#FF4560","label":"admin:1.5hr(s)"},{"x":"TestPod2","y":[1667995200000,1668002400000],"fillColor":"#FF4560","label":"Jon:2hr(s)"},{"x":"TestPod1","y":[1668009600000,1668016800000],"fillColor":"#FF4560","label":"Samsung:2hr(s)"},{"x":"TestPod2","y":[1668002400000,1668009600000],"fillColor":"#FF4560","label":"admin:2hr(s)"},{"x":"TestPod4","y":[],"fillColor":null,"label":null},{"x":"podmansd","y":[],"fillColor":null,"label":null},{"x":"e12312312","y":[],"fillColor":"#C8C8C8","label":"NotAvailable"},{"x":"asdasdasd","y":[],"fillColor":null,"label":null}]},"targetUrl":null,"success":true,"error":null,"unAuthorizedRequest":false,"__abp":true}');
    // let data = JSON.parse('{"result":{"stat":[{"x":"TestPod3","y":[1667989800000,1667995200000],"fillColor":"#FF4560","label":"admin:1.5hr(s)"}]},"targetUrl":null,"success":true,"error":null,"unAuthorizedRequest":false,"__abp":true}');

    return  data['result']['stat'].map(this.mapData, this.selectedDate);
  }

  private mapData(dataDetail: any)
  {
    let emptySlot = new Date(0,0,0,0,0,0);
    let emptySlotStart = dataDetail['label'] != undefined ? new Date(this + ' 07:00:00') : emptySlot;
    let emptySlotEnd = dataDetail['label'] != undefined ? new Date(this + ' 21:00:00') : emptySlot;

    let fillColor = dataDetail['fillColor'] ?? 'green';

    return {
        ['podType']: dataDetail['x'].toUpperCase(),
        ['label']: dataDetail['label'],
        ['startTime']: dataDetail['y'].length > 0  ? TimelineComponent.timeConvert(dataDetail['y'][0]): emptySlotStart,
        ['endTime']: dataDetail['y'].length > 0  ? TimelineComponent.timeConvert(dataDetail['y'][1]): emptySlotEnd,
        ['color']: fillColor
    };
  }

  static timeConvert(datetime: number)
  {
    return new Date(new Date(datetime).toLocaleString('en', {timeZone: 'GMT'}));
  }

}
