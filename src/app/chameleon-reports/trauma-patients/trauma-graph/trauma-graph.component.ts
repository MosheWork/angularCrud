import {
  Component, Input, OnChanges, SimpleChanges,
  AfterViewInit, ViewChild, ElementRef, OnDestroy
} from '@angular/core';
import { Chart, registerables } from 'chart.js';

export type TraumaChartConfig = { labels: string[]; datasets: any[] };

@Component({
  selector: 'app-trauma-graph',
  templateUrl: './trauma-graph.component.html',
  styleUrls: ['./trauma-graph.component.scss']
})
export class TraumaGraphComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() config?: TraumaChartConfig;

  /** Hide numbers above bars (chartjs-plugin-datalabels). Default: false (hidden). */
  @Input() showValues = false;

  /** Optional height */
  @Input() height = 360;

  @ViewChild('canvasRef', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  private palette = [
    'rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)',
    'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
  ];

  constructor() { Chart.register(...registerables); }

  ngAfterViewInit(): void { this.safeRender(); }
  ngOnChanges(changes: SimpleChanges): void { if (changes['config']) this.safeRender(); }
  ngOnDestroy(): void { this.destroyChart(); }

  private safeRender(): void { requestAnimationFrame(() => this.render()); }

  private render(): void {
    if (!this.canvasRef?.nativeElement) return;
    if (!this.config?.labels || !this.config?.datasets) return;

    // apply default colors if dataset has none
    const datasets = this.config.datasets.map((ds, i) => {
      const bg = ds.backgroundColor ?? this.palette[i % this.palette.length];
      const border = Array.isArray(bg)
        ? bg.map((c: string) => c.replace('0.6','1'))
        : (bg as string).replace('0.6','1');
      return {
        barPercentage: 0.7,
        categoryPercentage: 0.6,
        borderWidth: 1,
        ...ds,
        backgroundColor: bg,
        borderColor: border
      };
    });

    this.destroyChart();
    const ctx = this.canvasRef.nativeElement.getContext('2d')!;

    // plugin options (will be ignored if datalabels plugin isn’t registered globally)
    const pluginOptions: any = {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
      datalabels: this.showValues ? { anchor: 'end', align: 'top', formatter: (v: number) => v } : { display: false }
    };

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: { labels: this.config.labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: pluginOptions,
        scales: {
          x: { stacked: false },
          y: { beginAtZero: true, stacked: false, ticks: { precision: 0 } }
        }
      } as any
    });
  }

  private destroyChart(): void { if (this.chart) { this.chart.destroy(); this.chart = undefined; } }
}
