import {
  Component, Input, OnChanges, SimpleChanges,
  AfterViewInit, ViewChild, ElementRef, OnDestroy
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

export type TraumaChartConfig = { labels: string[]; datasets: any[] };

@Component({
  selector: 'app-trauma-graph',
  templateUrl: './trauma-graph.component.html',
  styleUrls: ['./trauma-graph.component.scss']
})
export class TraumaGraphComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() config?: TraumaChartConfig;

  /** Show numbers above bars (via chartjs-plugin-datalabels). Default: false. */
  @Input() showValues = false;

  /** Optional canvas height (px). */
  @Input() height = 360;

  /** If true, Y-axis is 0–100 and values/tooltip are shown as % */
  @Input() percent = false;

  @ViewChild('canvasRef', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  private palette = [
    'rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)',
    'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
  ];

  constructor() {
    // Register core chart types + the datalabels plugin
    Chart.register(...registerables, ChartDataLabels);
  }

  ngAfterViewInit(): void { this.safeRender(); }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['percent'] || changes['showValues']) this.safeRender();
  }
  ngOnDestroy(): void { this.destroyChart(); }

  private safeRender(): void { requestAnimationFrame(() => this.render()); }

  private render(): void {
    if (!this.canvasRef?.nativeElement) return;
    if (!this.config?.labels || !this.config?.datasets) return;

    // Apply default colors if a dataset has none
    const datasets = this.config.datasets.map((ds, i) => {
      const bg = ds.backgroundColor ?? this.palette[i % this.palette.length];
      const border = Array.isArray(bg)
        ? bg.map((c: string) => c.replace('0.6', '1'))
        : (bg as string).replace('0.6', '1');
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

    const isPercent = this.percent === true;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: { labels: this.config.labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
    
        // room for bottom "count/total" labels
        layout: { padding: { top: 6, right: 8, bottom: 28, left: 8 } },
    
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: isPercent
              ? { label: (c: any) => `${Math.round(c.raw)}%` }
              : undefined
          },
          datalabels: this.showValues
            ? {
                // two labels per bar: top % and bottom count/total
                labels: {
                  top: {
                    anchor: 'end',
                    align: 'top',
                    offset: 2,
                    formatter: (v: number) => (isPercent ? `${Math.round(v)}%` : `${v}`),
                    font: { weight: 'bold' },
                    clip: false
                  },
                  bottom: {
                    anchor: 'start',
                    align: 'bottom',
                    offset: 4,
                    formatter: (_: number, ctx: any) => {
                      const ds: any = ctx.dataset;
                      const count = ds?.rawCounts?.[ctx.dataIndex];
                      const total = ds?.rawTotal;
                      return count != null && total != null ? `${count}/${total}` : '';
                    },
                    clip: false
                  }
                }
              }
            : { display: false }
        },
    
        scales: {
          x: {
            position: 'top',      // bucket labels at top
            ticks: { padding: 8 }
          },
          y: {
            beginAtZero: true,
            max: isPercent ? 100 : undefined,
            ticks: isPercent
              ? { precision: 0, callback: (v: any) => `${v}%` }
              : { precision: 0 }
          }
        }
      } as any
    });
    

    // Optional: ensure the canvas area respects the height input
    // (If your template container already controls height, you can remove this line)
    this.canvasRef.nativeElement.style.height = `${this.height}px`;
  }

  private destroyChart(): void {
    if (this.chart) { this.chart.destroy(); this.chart = undefined; }
  }
}
