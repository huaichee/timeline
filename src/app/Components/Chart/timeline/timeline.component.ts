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
  defaultHeight: number = 55;
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
      height: this.defaultHeight * this.uniquePod().length,
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
    let dataDetails = this.dataReceived();
    let preparePod = [];
    for(let data of dataDetails) {
      preparePod.push(data[0]);
    }

    return preparePod.filter(this.onlyUnique);
  }

  private processedAvailableHour()
  {
    let availableHour = this.generateAvailableHour();
    
    for(let bookedPod of availableHour) {
      if(bookedPod.length > 4) {
        bookedPod.pop(1);
      }
    }

    return availableHour;
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

        availableHour.push([pod[1], '', currentStart, currentEnd, podColor]);
        availableHour.push([pod[1], '', currentSecondStart, currentSecondEnd, podColor]);
      }
    }

    //booked
    for (let podTime of booked) {
      let bookStart = (new Date(podTime[2]).getHours() * 60) + new Date(podTime[2]).getMinutes(); 
      let bookEnd = (new Date(podTime[3]).getHours() * 60) + new Date(podTime[3]).getMinutes();
      let toBeRemove = [];
      
      for (let [index, pod] of availableHour.entries()) {
        let currentStart = (new Date(pod[2]).getHours() * 60) + new Date(pod[2]).getMinutes(); 
        let currentEnd = (new Date(pod[3]).getHours() * 60) + new Date(pod[3]).getMinutes(); 
        
        if(currentStart >= bookStart && currentEnd <= bookEnd && pod[0] == podTime[0]) {
          toBeRemove.push(index);
        }
      }
      
      for(let removeIndex of toBeRemove.reverse()) {
        availableHour.splice(removeIndex, 1);
      }

      let bookedStartHour = podTime[2].getHours();
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
  
    // console.log(availableHour);
    let podTypeList = [];
    for(let podType of this.uniquePod()) {
      let pereparePodList = availableHour.filter((obj) => {
        return obj[0] == podType;
      }).sort(function(a, b){
        return a[2] - b[2]
      });

      let preparePod = [];
      for(let data of pereparePodList) {
        preparePod.push(data[1] != '' ? data[1] : data[0]);
      }

      let podList = preparePod.filter(this.onlyUnique);

      podTypeList.push({podType: podList})
    }

    var colors: string[] = [];
    for(let podTypes of podTypeList) {
      podTypes['podType'].forEach(item => {
        let bookedDetail = availableHour.find(pod => pod[1] === item);
        let emptyPodDetail = availableHour.find(pod => pod[0] === item);

        let itemColor = this.uniquePod().includes(item) || bookedDetail == undefined || bookedDetail.length < 4 ? emptyPodDetail[4] : bookedDetail[4];
        colors.push(itemColor);
      });
    }
    
    return colors;
  }

  private onlyUnique(value: any, index: any, self: any) {
    return self.indexOf(value) === index;
  }

  private dataReceived()
  {
    // let data = JSON.parse('{"result": {"stat": [{"x": "Pod 1","y": [1668466800000.0,1668510000000.0],"fillColor": "#FF4560","label": "Alan : 2 hr(s)"},{"x": "Pod 1","y": [1668510000000.0,1668513600000.0],"fillColor": "#77b5fe","label": "Admin : 1 hr(s)"},{"x": "Pod 2","y": [1668495600000.0,1668497400000.0],"fillColor": "#FF4560","label": "Admin : 0.5 hr(s)"},{"x": "Pod 2","y": [1668528000000.0,1668533400000.0],"fillColor": "#FF4560","label": "Alan : 1.5 hr(s)"},{"x": "Pod 3","y": [],"fillColor": null,"label": null},{"x": "Pod 4","y": [],"fillColor": "#77b5fe","label": null}]},"targetUrl": null,"success": true,"error": null,"unAuthorizedRequest": false,"__abp": true}');

    let data = JSON.parse('{"result":{"stat":[{"x":"TestPod3","y":[1667989800000,1667995200000],"fillColor":"#FF4560","label":"admin:1.5hr(s)"},{"x":"TestPod2","y":[1667995200000,1668002400000],"fillColor":"#FF4560","label":"Jon:2hr(s)"},{"x":"TestPod1","y":[1668009600000,1668016800000],"fillColor":"#FF4560","label":"Samsung:2hr(s)"},{"x":"TestPod2","y":[1668002400000,1668009600000],"fillColor":"#FF4560","label":"admin:2hr(s)"},{"x":"TestPod4","y":[],"fillColor":null,"label":null},{"x":"podmansd","y":[],"fillColor":null,"label":null},{"x":"e12312312","y":[],"fillColor":"#C8C8C8","label":"NotAvailable"},{"x":"asdasdasd","y":[],"fillColor":null,"label":null}]},"targetUrl":null,"success":true,"error":null,"unAuthorizedRequest":false,"__abp":true}');

    return data['result']['stat'].map(this.mapData);
  }

  private mapData(dataDetail: any)
  {
    let emptySlot = new Date(0,0,0,0,0,0);
    let fillColor = dataDetail['fillColor'] ?? 'green';
    return [
      dataDetail['x'].toUpperCase(),
      dataDetail['label'],
      dataDetail['y'].length > 0  ? TimelineComponent.timeConvert(dataDetail['y'][0]): emptySlot,
      dataDetail['y'].length > 0  ? TimelineComponent.timeConvert(dataDetail['y'][1]): emptySlot,
      fillColor
    ];
  }

  static timeConvert(datetime: number)
  {

    return new Date(new Date(datetime).toLocaleString('en', {timeZone: 'GMT'}));
  }

}
