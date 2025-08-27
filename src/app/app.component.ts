// src/app/app.component.ts
import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from './services/supabase.service';
import { FormsModule } from '@angular/forms';
import { Vacancy } from './interfaces/vacancy';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(
    private supabaseService: SupabaseService,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.fetchVacancies();
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

}