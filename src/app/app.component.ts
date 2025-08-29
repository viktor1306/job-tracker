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

  // Дуже важливо відписуватись, щоб уникнути витоків пам'яті
  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  async fetchVacancies() {
    try {
      const { data, error } = await this.supabaseService.getVacancies();
      if (error) {
        console.error('Помилка:', error.message);
        return;
      }

      this.zone.run(() => {
        this.vacancies = data || [];
      });

    } catch (error) {
      console.error('Невідома помилка:', error);
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

      // Миттєво оновлюємо локальний список і показуємо сповіщення
      this.zone.run(() => {
        this.vacancies.push(data[0]); // Додаємо новий елемент в масив
        this.newVacancy = this.resetNewVacancy(); // Очищуємо форму
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
        this.vacancies = this.vacancies.filter(v => v.id !== vacancyId); // Видаляємо елемент
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

  // Новий метод для виклику з HTML
  signOut() {
    this.authService.signOut();
  }

  // Допоміжна функція для очищення форми
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

}