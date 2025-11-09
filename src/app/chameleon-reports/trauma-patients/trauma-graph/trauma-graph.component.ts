import {
  Component, Input, OnChanges, SimpleChanges,
  AfterViewInit, ViewChild, ElementRef, OnDestroy
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

export type TraumaChartConfig = { labels: string[]; datasets: any[] };

@Component({
  selector: 'app-trauma-graph',
  template: `<canvas #canvasRef></canvas>`,
  styleUrls: ['./trauma-graph.component.scss']
})
export class TraumaGraphComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() config?: TraumaChartConfig;

  /** Show values (enables labels/plugins). */
  @Input() showValues = false;

  /** Canvas height (px). */
  @Input() height = 360;

  /** If true, bars are percentages (Y max 100) and tooltip shows % . */
  @Input() percent = false;

  @ViewChild('canvasRef', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  private palette = [
    'rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)',
    'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
  ];

  constructor() {
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
        barPercentage: 0.8,
        categoryPercentage: 0.85,
        borderWidth: 1,
        ...ds,
        backgroundColor: bg,
        borderColor: border
      };
    });

    this.destroyChart();
    const ctx = this.canvasRef.nativeElement.getContext('2d')!;
    const isPercent = this.percent === true;

    // ---------- Custom plugin: TOP % above each bar ----------
    const percentTopPlugin = {
      id: 'percentTopPlugin',
      afterDatasetsDraw: (chart: any) => {
        if (!this.showValues) return;
        const { ctx } = chart;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#000';

        chart.data.datasets.forEach((dataset: any, dsIndex: number) => {
          const meta = chart.getDatasetMeta(dsIndex);
          meta.data.forEach((bar: any, i: number) => {
            const v = dataset.data?.[i];
            if (v == null) return;
            const label = isPercent ? `${Math.round(v)}%` : `${Math.round(v)}`;
            const { x, y } = bar.tooltipPosition();
            ctx.fillText(label, x, y - 6); // slightly above bar
          });
        });

        ctx.restore();
      }
    };

    // ------ Custom plugin: BOTTOM time label under each bar ------
    const bottomTimePlugin = {
      id: 'bottomTimePlugin',
      afterDatasetsDraw: (chart: any) => {
        if (!this.showValues) return;
        const { ctx, chartArea, scales } = chart;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = '500 11px sans-serif';
        ctx.fillStyle = '#555';

        const baselineY = scales.y.getPixelForValue(0) + 12; // 12px below X-axis baseline
        chart.data.datasets.forEach((dataset: any, dsIndex: number) => {
          const meta = chart.getDatasetMeta(dsIndex);
          const bottoms: string[] = dataset.bottomLabels || [];
          meta.data.forEach((bar: any, i: number) => {
            const txt = bottoms[i];
            if (!txt) return;
            const { x } = bar.tooltipPosition();
            if (x >= chartArea.left && x <= chartArea.right) {
              ctx.fillText(txt, x, baselineY);
            }
          });
        });

        ctx.restore();
      }
    };

    // ---------------- Build Chart ----------------
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: { labels: this.config.labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        // Room for bottom time labels
        layout: { padding: { top: 6, right: 8, bottom: 48, left: 8 } },

        plugins: {
          legend: { position: 'top' },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: isPercent ? { label: (c: any) => `${Math.round(c.raw)}%` } : undefined
          },

          // MIDDLE label inside the bar: (n/total)
          datalabels: this.showValues
            ? {
                anchor: 'center',
                align: 'center',
                offset: 0,
                clip: false,
                formatter: (_: number, ctx: any) => {
                  const ds: any = ctx.dataset;
                  const count = ds?.rawCounts?.[ctx.dataIndex];
                  const total = ds?.rawTotal;
                  return (count != null && total != null) ? `(${count}/${total})` : '';
                },
                font: { weight: 'bold' },
                color: (ctx: any) => {
                  const v = ctx?.dataset?.data?.[ctx.dataIndex] ?? 0;
                  return isPercent ? (v >= 40 ? '#fff' : '#000') : '#000';
                }
              }
            : { display: false }
        },

        scales: {
          x: {
            position: 'top',                // keep your 3 bucket titles at the top
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
      } as any,

      // Register our two plugins per-instance
      plugins: [percentTopPlugin, bottomTimePlugin]
    });

    // enforce height
    this.canvasRef.nativeElement.style.height = `${this.height}px`;
  }

  private destroyChart(): void {
    if (this.chart) { this.chart.destroy(); this.chart = undefined; }
  }
}
