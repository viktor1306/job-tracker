// src/app/app.component.ts
import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from './services/supabase.service';
import { FormsModule } from '@angular/forms';
import { Vacancy } from './interfaces/vacancy';
import { StatisticsDashboardComponent } from './components/statistics-dashboard/statistics-dashboard.component';

import { Subscription } from 'rxjs';
import { LoginComponent } from './pages/login/login.component';
import { AuthService, UserSession } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogService } from './services/confirm-dialog.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, StatisticsDashboardComponent, LoginComponent, ConfirmDialogComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  isLoading: boolean = true;
  searchTerm: string = '';

  // Властивості для сортування
  sortColumn: string = 'date_applied'; // За замовчуванням сортуємо за датою
  sortDirection: 'asc' | 'desc' = 'desc'; // За замовчуванням - від нових до старих

  // Масив, який бачить користувач (результат фільтрації та сортування)
  filteredVacancies: Vacancy[] = [];

  vacancies: Vacancy[] = [];

  newVacancy: any = {
    vacancy_title: '',
    vacancy_url: '',
    platform: 'Work.ua',
    salary: '',
    date_applied: new Date().toISOString().split('T')[0], // Сьогоднішня дата за замовчуванням
    status: 'Подано'
  };

  session: UserSession | null = null; // Тут будемо зберігати сесію
  private authSubscription!: Subscription; // Для відписки

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private zone: NgZone,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService
  ) { }

  applyFiltersAndSorting() {
    // Крок 1: Фільтрація
    let result = this.vacancies.filter(v =>
      v.vacancy_title.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    // Крок 2: Сортування
    result.sort((a, b) => {
      // @ts-ignore
      const valA = a[this.sortColumn];
      // @ts-ignore
      const valB = b[this.sortColumn];

      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    // Крок 3: Оновлюємо масив, який бачить користувач
    this.filteredVacancies = result;
  }

  ngOnInit() {
    // Підписуємось на зміни стану автентифікації
    this.authSubscription = this.authService.session$.subscribe(session => {
      this.session = session;
      if (this.session) { // Якщо користувач залогінився
        this.fetchVacancies();
      } else { // Якщо користувач вийшов
        this.vacancies = [];
      }
    });
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  async fetchVacancies() {
    this.isLoading = true;
    try {
      const { data, error } = await this.supabaseService.getVacancies();
      if (error) {
        this.notificationService.showError(error.message, 'Помилка бази даних');
        return;
      }
      this.zone.run(() => {
        this.vacancies = data || [];
        this.applyFiltersAndSorting();
      });
    } catch (error: any) {
      this.notificationService.showError(error.message, 'Невідома помилка');
    } finally {
      this.zone.run(() => {
        this.isLoading = false;
      });
    }
  }

  async addVacancy() {
    try {
      const userId = this.session?.user?.id;
      if (!userId) {
        this.notificationService.showError('Сесія користувача не знайдена.', 'Помилка');
        return;
      }
      const vacancyData = { ...this.newVacancy, user_id: userId };

      const { data, error } = await this.supabaseService.addVacancy(vacancyData);

      if (error) {
        this.notificationService.showError(error.message, 'Помилка бази даних');
        return;
      }


      this.zone.run(() => {
        this.vacancies.push(data[0]);
        this.applyFiltersAndSorting();
        this.newVacancy = this.resetNewVacancy();
        this.notificationService.showSuccess('Вакансію успішно додано!');
      });

    } catch (error: any) {
      this.notificationService.showError(error.message, 'Невідома помилка');
    }
  }

  async deleteVacancy(vacancyId: number) {
    const confirmed = await this.confirmDialogService.open('Ви впевнені, що хочете видалити цю вакансію?');

    if (!confirmed) {
      return; // Якщо користувач натиснув "Скасувати", виходимо
    }
    try {
      const { error } = await this.supabaseService.deleteVacancy(vacancyId);
      if (error) {
        this.notificationService.showError(error.message, 'Помилка бази даних');
        return;
      }

      // Миттєво оновлюємо локальний список і показуємо сповіщення
      this.zone.run(() => {
        this.vacancies = this.vacancies.filter(v => v.id !== vacancyId);
        this.applyFiltersAndSorting();
        this.notificationService.showInfo('Вакансію успішно видалено!');
      });

    } catch (error: any) {
      this.notificationService.showError(error.message, 'Невідома помилка');
    }
  }

  async updateStatus(vacancyId: number, newStatus: string) {
    try {
      const { error } = await this.supabaseService.updateVacancyStatus(vacancyId, newStatus);

      if (error) {
        alert(error.message);
        // Якщо сталася помилка, варто перезавантажити дані, щоб скасувати зміни на фронтенді
        this.fetchVacancies();
        return;
      }

      console.log(`Статус для вакансії ${vacancyId} оновлено на "${newStatus}"`);
      // Оскільки ngModel вже оновив дані в локальному масиві,
      // нам не потрібно викликати fetchVacancies(). Це економить трафік.

    } catch (error) {
      console.error('Помилка при оновленні статусу:', error);
    }
  }


  signOut() {
    this.authService.signOut();
  }

  resetNewVacancy() {
    return {
      vacancy_title: '',
      vacancy_url: '',
      platform: 'Work.ua',
      salary: '',
      date_applied: new Date().toISOString().split('T')[0],
      status: 'Подано'
    };
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      // Якщо клікнули по тій самій колонці - змінюємо напрямок
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Якщо клікнули по новій - встановлюємо її і напрямок за замовчуванням
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSorting();
  }

}