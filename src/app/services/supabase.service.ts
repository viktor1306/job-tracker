// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';

// ЗВЕРНИ УВАГУ: Ми більше НЕ імпортуємо SupabaseClient та createClient тут!

const supabaseUrl = 'https://oaqjxzquekglaltntdra.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcWp4enF1ZWtnbGFsdG50ZHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjQwMjAsImV4cCI6MjA3MTkwMDAyMH0.ryUeEJLA5nNBK_DEvj1TQPhPbgaZEM1crFQXXFourmk';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  
  // Ми не знаємо точного типу, тому використовуємо 'any'
  private supabase: any = null;

  constructor() {}

  async initialize() {
    if (this.supabase) {
      return; // Вже ініціалізовано
    }

    // ДИНАМІЧНИЙ ІМПОРТ: Завантажуємо бібліотеку тільки зараз
    const { createClient } = await import('@supabase/supabase-js');
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Клієнт Supabase створено динамічно!');
  }
  
    async getVacancies() {
    if (!this.supabase) {
      await this.initialize();
    }
    return this.supabase.from('vacancies').select('*');
  }

  async addVacancy(vacancyData: any) {
    if (!this.supabase) {
      await this.initialize();
    }
    
    // .from('vacancies') - назва нашої таблиці
    // .insert([vacancyData]) - вставляємо новий об'єкт
    return this.supabase.from('vacancies').insert([vacancyData]);
  }

  async deleteVacancy(vacancyId: number) {
    if (!this.supabase) {
      await this.initialize();
    }
    
    // .from('vacancies') - назва нашої таблиці
    // .delete() - вказуємо, що хочемо видалити
    // .eq('id', vacancyId) - ...але тільки той рядок, де колонка 'id' дорівнює vacancyId
    return this.supabase.from('vacancies').delete().eq('id', vacancyId);
  }

    async updateVacancyStatus(vacancyId: number, newStatus: string) {
    if (!this.supabase) {
      await this.initialize();
    }
    
    // .from('vacancies') - з якої таблиці
    // .update({ status: newStatus }) - що оновити (об'єкт, де ключ - назва колонки, значення - нове значення)
    // .eq('id', vacancyId) - в якому рядку
    return this.supabase.from('vacancies').update({ status: newStatus }).eq('id', vacancyId);
  }

}