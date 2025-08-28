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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, StatisticsDashboardComponent, LoginComponent],
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
    private zone: NgZone
  ) {}

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
      // 1. Відправляємо дані з форми в сервіс
      const { error } = await this.supabaseService.addVacancy(this.newVacancy);

      if (error) {
        // Якщо Supabase повернув помилку, показуємо її
        alert(error.message);
        return;
      }

      console.log('Вакансія успішно додана!');
      
      // 2. Оновлюємо список вакансій на сторінці, щоб побачити нову
      this.fetchVacancies();
      
      // 3. Очищуємо форму для наступного додавання
      this.newVacancy = {
        vacancy_title: '',
        vacancy_url: '',
        platform: 'Work.ua',
        salary: '',
        date_applied: new Date().toISOString().split('T')[0],
        status: 'Подано'
      };

    } catch (error) {
      console.error('Помилка при додаванні вакансії:', error);
    }
  }

  async deleteVacancy(vacancyId: number) {
    // Хороша практика: питаємо користувача, чи він впевнений.
    if (!confirm('Ви впевнені, що хочете видалити цю вакансію?')) {
      return; // Якщо користувач натиснув "Скасувати", нічого не робимо
    }

    try {
      const { error } = await this.supabaseService.deleteVacancy(vacancyId);
      
      if (error) {
        alert(error.message);
        return;
      }

      console.log('Вакансія успішно видалена!');
      
      // Просто оновлюємо список, щоб видалений рядок зник
      this.fetchVacancies();
      
      // Або, як варіант для оптимізації (не обов'язково зараз):
      // Видаляємо елемент з локального масиву без повторного запиту до бази
      // this.zone.run(() => {
      //   this.vacancies = this.vacancies.filter(v => v.id !== vacancyId);
      // });

    } catch (error) {
      console.error('Помилка при видаленні вакансії:', error);
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