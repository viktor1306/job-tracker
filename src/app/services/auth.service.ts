// src/app/services/auth.service.ts
import { Injectable, NgZone } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';

// Тип для сесії користувача
export interface UserSession {
  user: any;
  session: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase!: SupabaseClient;

  // BehaviorSubject - це спеціальний тип Observable, який зберігає поточне значення.
  // Ми будемо зберігати тут стан сесії (залогінений користувач чи ні).
  private _session = new BehaviorSubject<UserSession | null>(null);
  session$ = this._session.asObservable(); // Публічний Observable, на який зможуть підписатися компоненти

  constructor(private zone: NgZone) {
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    // Ми використовуємо динамічний імпорт, як і раніше
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = 'https://oaqjxzquekglaltntdra.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcWp4enF1ZWtnbGFsdG50ZHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjQwMjAsImV4cCI6MjA3MTkwMDAyMH0.ryUeEJLA5nNBK_DEvj1TQPhPbgaZEM1crFQXXFourmk';
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Це найважливіша частина: ми слухаємо зміни стану автентифікації
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth event: ${event}`);
      // Використовуємо NgZone, щоб гарантувати оновлення інтерфейсу
      this.zone.run(() => {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          this._session.next({ user: session?.user ?? null, session });
        } else {
          this._session.next(null);
        }
      });
    });
  }

  // Метод для входу через Google
  async signInWithGoogle() {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error('Error signing in with Google:', error.message);
    }
  }

  // Метод для виходу
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
  }

  // Допоміжна функція, щоб отримати поточного користувача
  getCurrentUser() {
    return this._session.getValue()?.user;
  }
}