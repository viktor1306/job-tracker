// src/app/components/statistics-dashboard/statistics-dashboard.component.ts
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common'; // Потрібен для *ngIf

@Component({
  selector: 'app-statistics-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics-dashboard.component.html',
  styleUrls: ['./statistics-dashboard.component.scss']
})
export class StatisticsDashboardComponent implements OnChanges {

  // @Input() дозволяє цьому компоненту приймати дані з батьківського
  @Input() vacancies: any[] = [];

  // Властивості для зберігання нашої статистики
  totalApplications = 0;
  inProgressCount = 0;
  offersCount = 0;
  rejectionsCount = 0;

  // Цей метод викликається кожного разу, коли змінюються вхідні дані (наші вакансії)
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vacancies'] && this.vacancies) {
      this.calculateStatistics();
    }
  }

  private calculateStatistics(): void {
    this.totalApplications = this.vacancies.length;

    // Рахуємо кількість вакансій з певними статусами
    this.inProgressCount = this.vacancies.filter(
      v => v.status === 'Переглянуто' || v.status === 'Співбесіда' || v.status === 'Тестове'
    ).length;
    this.offersCount = this.vacancies.filter(v => v.status === 'Офер').length;
    this.rejectionsCount = this.vacancies.filter(v => v.status === 'Відмова').length;
  }
}