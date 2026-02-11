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
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">Vitals History</h2>
        @if (patient()) {
          <p class="text-pink-400 text-sm">{{ patient()!.name }} &middot; Bed {{ patient()!.bed_number }}</p>
        }
      </div>
      <div class="flex gap-2">
        @for (r of ranges; track r) {
          <button mat-stroked-button
            [class.!bg-pink-100]="selectedRange() === r"
            [class.!text-pink-700]="selectedRange() === r"
            (click)="loadHistory(r)">{{ r }}</button>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner></mat-spinner></div>
    } @else {
      <div class="glass-card p-5 mb-6">
        <div #chartEl class="w-full h-96"></div>
      </div>

      <div class="glass-card p-5">
        <h3 class="text-sm font-semibold text-pink-600 uppercase tracking-wider mb-4">Data Table</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-pink-100">
                <th class="p-2 text-left text-pink-600 font-semibold">Time</th>
                <th class="p-2 text-pink-600 font-semibold">HR</th>
                <th class="p-2 text-pink-600 font-semibold">BP</th>
                <th class="p-2 text-pink-600 font-semibold">Temp</th>
                <th class="p-2 text-pink-600 font-semibold">SpO2</th>
                <th class="p-2 text-pink-600 font-semibold">RR</th>
              </tr>
            </thead>
            <tbody>
              @for (v of history(); track v.id) {
                <tr class="border-t border-pink-50 hover:bg-pink-50/30 transition-colors">
                  <td class="p-2 text-gray-600">{{ formatTime(v.recorded_at) }}</td>
                  <td class="p-2 text-center">{{ v.heart_rate }}</td>
                  <td class="p-2 text-center">{{ v.systolic_bp }}/{{ v.diastolic_bp }}</td>
                  <td class="p-2 text-center">{{ v.temperature }}°</td>
                  <td class="p-2 text-center">{{ v.spo2 }}%</td>
                  <td class="p-2 text-center">{{ v.respiratory_rate }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
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
      tooltip: { trigger: 'axis' },
      legend: { data: ['Heart Rate', 'SpO2', 'Systolic BP', 'Temperature'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: times },
      yAxis: [
        { type: 'value', name: 'HR/BP', position: 'left' },
        { type: 'value', name: 'SpO2/%', position: 'right', min: 80, max: 100 },
      ],
      series: [
        { name: 'Heart Rate', type: 'line', data: data.map(v => v.heart_rate), smooth: true, itemStyle: { color: '#ec4899' } },
        { name: 'SpO2', type: 'line', yAxisIndex: 1, data: data.map(v => v.spo2), smooth: true, itemStyle: { color: '#f472b6' } },
        { name: 'Systolic BP', type: 'line', data: data.map(v => v.systolic_bp), smooth: true, itemStyle: { color: '#f9a8d4' } },
        { name: 'Temperature', type: 'line', data: data.map(v => v.temperature), smooth: true, itemStyle: { color: '#10b981' } },
      ],
    });
  }

  formatTime(ts: number): string {
    return format(new Date(ts * 1000), 'MMM dd HH:mm');
  }
}
