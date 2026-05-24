import { Component, OnInit, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Vitals, Patient } from '../../../core/models';
import { format } from 'date-fns';
import * as echarts from 'echarts';

@Component({
  selector: 'app-vitals-history',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Vitals History</h2>
        @if (patient()) {
          <p class="text-gray-500 text-sm mt-0.5">{{ patient()!.name }} &middot; Bed {{ patient()!.bed_number }}</p>
        }
      </div>
      <div class="flex gap-1.5">
        @for (r of ranges; track r) {
          <button mat-stroked-button class="!text-xs !h-8 !px-3 !min-w-0"
            [class.!bg-pink-50]="selectedRange() === r"
            [class.!text-pink-700]="selectedRange() === r"
            [class.!border-pink-200]="selectedRange() === r"
            (click)="loadHistory(r)">{{ r }}</button>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="36"></mat-spinner></div>
    } @else {
      <div class="prana-card p-5 mb-4">
        <div #chartEl class="w-full h-80"></div>
      </div>

      <div class="prana-card p-5">
        <p class="section-label mb-4">Data Table</p>
        <div class="overflow-x-auto">
          <table class="text-sm" style="width: 100%; min-width: 440px;">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="p-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Time</th>
                <th class="p-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">HR</th>
                <th class="p-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">BP</th>
                <th class="p-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Temp</th>
                <th class="p-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">SpO2</th>
                <th class="p-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">RR</th>
              </tr>
            </thead>
            <tbody>
              @for (v of history(); track v.id) {
                <tr class="border-t border-gray-100 hover:bg-gray-50">
                  <td class="p-2.5 text-gray-600">{{ formatTime(v.recorded_at) }}</td>
                  <td class="p-2.5 text-center text-gray-700">{{ v.heart_rate }}</td>
                  <td class="p-2.5 text-center text-gray-700">{{ v.systolic_bp }}/{{ v.diastolic_bp }}</td>
                  <td class="p-2.5 text-center text-gray-700">{{ v.temperature }}°</td>
                  <td class="p-2.5 text-center text-gray-700">{{ v.spo2 }}%</td>
                  <td class="p-2.5 text-center text-gray-700">{{ v.respiratory_rate }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
  styles: [`
    .section-label {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: #6b7280; margin: 0;
    }
  `]
})
export class VitalsHistoryComponent implements OnInit, AfterViewInit {
  @ViewChild('chartEl') chartEl!: ElementRef;
  private chart: echarts.ECharts | null = null;

  patient = signal<Patient | null>(null);
  history = signal<Vitals[]>([]);
  loading = signal(true);
  selectedRange = signal('24h');
  ranges = ['6h', '12h', '24h', '7d'];
  private patientId = '';

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.patientId = this.route.snapshot.params['patientId'];
    this.api.getPatient(this.patientId).subscribe(res => {
      if (res.success && res.data) this.patient.set(res.data.patient);
    });
    this.loadHistory('24h');
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.chartEl) {
        this.chart = echarts.init(this.chartEl.nativeElement);
        this.updateChart();
      }
    }, 100);
  }

  loadHistory(range: string) {
    this.selectedRange.set(range);
    this.api.getVitalsHistory(this.patientId, range).subscribe(res => {
      if (res.success && res.data) {
        this.history.set(res.data);
        this.updateChart();
      }
      this.loading.set(false);
    });
  }

  private updateChart() {
    if (!this.chart) return;
    const data = this.history();
    const times = data.map(v => format(new Date(v.recorded_at * 1000), 'HH:mm'));

    this.chart.setOption({
      backgroundColor: '#ffffff',
      tooltip: { trigger: 'axis' },
      legend: { data: ['Heart Rate', 'SpO2', 'Systolic BP', 'Temperature'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '4%', containLabel: true },
      xAxis: { type: 'category', data: times, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#9ca3af', fontSize: 11 } },
      yAxis: [
        { type: 'value', name: 'HR/BP', position: 'left', splitLine: { lineStyle: { color: '#f3f4f6' } }, axisLabel: { color: '#9ca3af', fontSize: 11 } },
        { type: 'value', name: 'SpO2/%', position: 'right', min: 80, max: 100, splitLine: { show: false }, axisLabel: { color: '#9ca3af', fontSize: 11 } },
      ],
      series: [
        { name: 'Heart Rate', type: 'line', data: data.map(v => v.heart_rate), smooth: true, itemStyle: { color: '#db2777' }, lineStyle: { width: 2 } },
        { name: 'SpO2', type: 'line', yAxisIndex: 1, data: data.map(v => v.spo2), smooth: true, itemStyle: { color: '#ec4899' }, lineStyle: { width: 2 } },
        { name: 'Systolic BP', type: 'line', data: data.map(v => v.systolic_bp), smooth: true, itemStyle: { color: '#6366f1' }, lineStyle: { width: 2 } },
        { name: 'Temperature', type: 'line', data: data.map(v => v.temperature), smooth: true, itemStyle: { color: '#10b981' }, lineStyle: { width: 2 } },
      ],
    });
  }

  formatTime(ts: number): string {
    return format(new Date(ts * 1000), 'MMM dd HH:mm');
  }
}
