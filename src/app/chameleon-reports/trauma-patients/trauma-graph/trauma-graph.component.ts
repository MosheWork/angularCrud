import {
  Component, Input, OnChanges, SimpleChanges,
  AfterViewInit, ViewChild, ElementRef, OnDestroy
} from '@angular/core';
import { Chart, registerables } from 'chart.js';

type TraumaDataset = {
  label: string;
  data: number[];

  // Chart.js accepts several types; keep them wide but guard to strings for coloring
  backgroundColor?: string | string[] | CanvasGradient | CanvasPattern;
  borderColor?: string | string[] | CanvasGradient | CanvasPattern;

  barPercentage?: number;
  categoryPercentage?: number;
  borderWidth?: number;
};

export type TraumaChartConfig = { labels: string[]; datasets: TraumaDataset[] };

@Component({
  selector: 'app-trauma-graph',
  templateUrl: './trauma-graph.component.html',
  styleUrls: ['./trauma-graph.component.scss']
})
export class TraumaGraphComponent implements OnChanges, AfterViewInit, OnDestroy {
  /** Chart.js config built by the parent (TraumaPatientsComponent) */
  @Input() config?: TraumaChartConfig;

  /** Optional: chart height in px (default 360) */
  @Input() height = 360;

  @ViewChild('canvasRef', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  private palette = [
    'rgba(54, 162, 235, 0.6)',   // blue
    'rgba(255, 99, 132, 0.6)',   // red
    'rgba(255, 206, 86, 0.6)',   // yellow
    'rgba(75, 192, 192, 0.6)',   // green
    'rgba(153, 102, 255, 0.6)',  // purple
    'rgba(255, 159, 64, 0.6)',   // orange
    'rgba(99, 255, 132, 0.6)',   // light green
    'rgba(132, 99, 255, 0.6)',   // violet
    'rgba(99, 132, 255, 0.6)'    // indigo
  ];

  constructor() {
    Chart.register(...registerables);
  }

  ngAfterViewInit(): void {
    this.safeRender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) this.safeRender();
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private safeRender(): void {
    // Ensure canvas exists (important when toggling with *ngIf)
    requestAnimationFrame(() => this.render());
  }

  private render(): void {
    if (!this.canvasRef?.nativeElement) return;
    if (!this.config || !Array.isArray(this.config.labels) || !Array.isArray(this.config.datasets)) return;

    // Normalize datasets and safely resolve colors to strings
    const datasets = (this.config.datasets as TraumaDataset[]).map((ds, i) => {
      const bgStr = this.resolveColorToString(ds.backgroundColor, this.palette[i % this.palette.length]);

      // Derive border color from background if not provided, ensuring it's a string
      const derivedBorder = bgStr.replace(/0\.\d+/, '1'); // bump alpha to 1
      const borderStr = this.resolveColorToString(ds.borderColor, derivedBorder);

      return {
        ...ds,
        backgroundColor: bgStr,
        borderColor: borderStr,
        barPercentage: ds.barPercentage ?? 0.7,
        categoryPercentage: ds.categoryPercentage ?? 0.6,
        borderWidth: ds.borderWidth ?? 1
      };
    });

    // Recreate the chart
    this.destroyChart();
    const ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.config.labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { stacked: false },
          y: { beginAtZero: true, stacked: false, ticks: { precision: 0 } }
        }
      }
    });

    // DEBUG (optional):
    // console.log('[TraumaGraph] rendered:', { labels: this.config.labels, datasets });
  }

  /** Convert Chart.js color inputs to a single string, or use fallback */
  private resolveColorToString(
    input: TraumaDataset['backgroundColor'],
    fallback: string
  ): string {
    if (typeof input === 'string') return input;
    if (Array.isArray(input)) {
      const firstStr = input.find((c): c is string => typeof c === 'string');
      if (firstStr) return firstStr;
    }
    // CanvasGradient/CanvasPattern or undefined => fallback
    return fallback;
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }
}
