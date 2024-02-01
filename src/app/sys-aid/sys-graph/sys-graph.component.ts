import { Component, OnInit, Input } from '@angular/core';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-sys-graph',
  templateUrl: './sys-graph.component.html',
  styleUrls: ['./sys-graph.component.scss']
})
export class SysGraphComponent implements OnInit {

  @Input() graphData: any; // Define an input property

  data = {
    // Your data array or object
};
  constructor() { 
    Chart.register(...registerables);

  }


  ngOnInit(): void {
    this.createChart();

  }
  createChart() {
  if (!this.graphData || this.graphData.length === 0) return; 

  // Example: Assuming you want to create a bar chart showing the count of items for each 'status'
  const statusCounts = this.graphData.reduce((acc: {[key: string]: number}, item: any) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const chartLabels = Object.keys(statusCounts);
  const chartData = Object.keys(statusCounts).map(key => statusCounts[key]);

  this.renderChart(chartLabels, chartData);
}
renderChart(labels: string[], data: number[]) {
  const ctx = document.getElementById('myChart') as HTMLCanvasElement;
  const myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Count',
        data: data,
        backgroundColor: [/* colors */],
        borderColor: [/* border colors */],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

}


