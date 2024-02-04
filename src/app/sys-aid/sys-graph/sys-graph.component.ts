import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-sys-graph',
  templateUrl: './sys-graph.component.html',
  styleUrls: ['./sys-graph.component.scss']
})
export class SysGraphComponent implements OnInit, OnChanges {
  @Input() graphData: any; // Define an input property

  private chart?: Chart; // Hold the chart instance



  constructor() {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['graphData'] && this.graphData) {
      this.createChart(); // Call createChart to update the chart
    }
  }

  createChart() {
    if (!this.graphData || this.graphData.length === 0) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const barColors = [
      'rgba(255, 99, 132, 0.2)',  // red
      'rgba(54, 162, 235, 0.2)',  // blue
      'rgba(255, 206, 86, 0.2)',  // yellow
      'rgba(75, 192, 192, 0.2)',  // green
      'rgba(153, 102, 255, 0.2)', // purple
      'rgba(255, 159, 64, 0.2)'   // orange
      // ...add more colors as needed
    ];

    const statusCounts = this.graphData.reduce((acc: { [key: string]: number }, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.keys(statusCounts).map(key => statusCounts[key]);
    const chartLabels = Object.keys(statusCounts);

    this.renderChart(chartLabels, chartData, barColors);
  }

  renderChart(labels: string[], data: number[], barColors: string[]) {
    const ctx = document.getElementById('myChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Count',
          data: data,
          backgroundColor: barColors,
          borderColor: barColors.map((color: string) => color.replace('0.2', '1')), // darker color for border
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
