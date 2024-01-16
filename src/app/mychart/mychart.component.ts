import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';

import { EmployeeService } from '../services/employee.service';

Chart.register(...registerables);

@Component({
  selector: 'app-mychart',
  templateUrl: './mychart.component.html',
  styleUrls: ['./mychart.component.scss'],
})
export class MychartComponent implements OnInit {
  constructor(private service: EmployeeService) {}
  chartdata: any;
  labeldata: any[] = [];
  realdata: any[] = [];
  colordata: any[] = [];

  ngOnInit(): void {
    this.service.getHosList().subscribe((result) => {
      this.chartdata = result;
      if (this.chartdata != null) {
        for (let i = 0; i < this.chartdata.length; i++) {
          //console.log(this.chartdata[i]);

          this.labeldata.push(this.chartdata[i].name);
          this.realdata.push(this.chartdata[i].admission_No);
        }
        this.RenderChart(this.labeldata, this.realdata, 'bar', 'barchart');
        this.RenderChart(this.labeldata, this.realdata, 'pie', 'piechart');
        this.RenderChart(this.labeldata, this.realdata, 'doughnut', 'dochart');
        this.RenderChart(this.labeldata, this.realdata, 'polarArea', 'pochart');
        this.RenderChart(this.labeldata, this.realdata, 'radar', 'rochart');
      }
    });
  }
  RenderChart(labeldata: any, maindata: any, type: any, id: any) {
    const ctx = document.getElementById('myChart');
    new Chart(id, {
      type: type,
      data: {
        labels: labeldata,
        datasets: [
          {
            label: '# of Votes',
            data: maindata,
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }
}
