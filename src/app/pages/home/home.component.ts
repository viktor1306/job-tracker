// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

// Компоненти
import { StatisticsDashboardComponent } from '../../components/statistics-dashboard/statistics-dashboard.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

// Інтерфейси та сервіси
import { Vacancy } from '../../interfaces/vacancy';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService, UserSession } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    StatisticsDashboardComponent, ConfirmDialogComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  currentView: 'table' | 'cards' = 'table'; // За замовчуванням - таблиця

  isLoading: boolean = true;
  searchTerm: string = '';
  sortColumn: string = 'date_applied';
  sortDirection: 'asc' | 'desc' = 'desc';
  filteredVacancies: Vacancy[] = [];
  vacancies: Vacancy[] = [];
  newVacancy: any = this.resetNewVacancy();
  session: UserSession | null = null;

  private broadcastChannel: BroadcastChannel;
  private visibilityChangeHandler: () => void;

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private zone: NgZone,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService
  ) {
    this.broadcastChannel = new BroadcastChannel('job_tracker_channel');
    this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
  }

    setView(view: 'table' | 'cards') {
    this.currentView = view;
  }

  ngOnInit() {
    this.authService.session$.subscribe(session => {
      this.session = session;
    });
    this.fetchVacancies();

    this.broadcastChannel.onmessage = (event) => {
      if (event.data === 'refresh_vacancies') {
        console.log('BroadcastChannel: Отримано команду на оновлення!');
        this.notificationService.showInfo('Оновлюю список вакансій...');
        this.fetchVacancies();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  handleVisibilityChange() {
    // Перевіряємо, чи вкладка стала видимою
    if (document.visibilityState === 'visible') {
      console.log('VisibilityChange: Вкладка стала активною, перевіряю оновлення...');
      this.notificationService.showInfo('Перевіряю наявність нових вакансій...');
      this.fetchVacancies();
    }
  }

  ngOnDestroy() {
    this.broadcastChannel.close();
    // ОБОВ'ЯЗКОВО видаляємо слухача, щоб уникнути витоків пам'яті
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
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
      this.zone.run(() => { this.isLoading = false; });
    }
  }

  applyFiltersAndSorting() {
    let result = this.vacancies.filter(v =>
      v.vacancy_title.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    result.sort((a, b) => {
      // @ts-ignore
      const valA = a[this.sortColumn];
      // @ts-ignore
      const valB = b[this.sortColumn];
      let comparison = 0;
      if (valA > valB) { comparison = 1; }
      else if (valA < valB) { comparison = -1; }
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    this.filteredVacancies = result;
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
    if (!confirmed) return;
    try {
      const { error } = await this.supabaseService.deleteVacancy(vacancyId);
      if (error) {
        this.notificationService.showError(error.message, 'Помилка бази даних');
        return;
      }
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
        this.notificationService.showError(error.message, 'Помилка бази даних');
        this.fetchVacancies();
        return;
      }
      // Оновлюємо локальний масив для миттєвого відображення (опціонально, але добре для UX)
      const index = this.vacancies.findIndex(v => v.id === vacancyId);
      if (index !== -1) {
        this.vacancies[index].status = newStatus;
        this.applyFiltersAndSorting();
      }
    } catch (error: any) {
      this.notificationService.showError(error.message, 'Невідома помилка');
    }
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSorting();
  }

  resetNewVacancy() {
    return {
      vacancy_title: '', vacancy_url: '', platform: 'Work.ua', salary: '',
      date_applied: new Date().toISOString().split('T')[0], status: 'Подано'
    };
  }

  signOut() {
    this.authService.signOut();
  }
}