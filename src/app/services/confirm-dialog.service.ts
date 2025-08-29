// src/app/services/confirm-dialog.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private isVisible = new BehaviorSubject<boolean>(false);
  private choice = new BehaviorSubject<boolean | null>(null);
  private message = new BehaviorSubject<string>('');

  isVisible$ = this.isVisible.asObservable();
  choice$ = this.choice.asObservable();
  message$ = this.message.asObservable();

  open(message: string): Promise<boolean> {
    this.message.next(message);
    this.isVisible.next(true);
    this.choice.next(null); // Скидаємо попередній вибір

    return new Promise<boolean>(resolve => {
      this.choice$.subscribe(choice => {
        if (choice !== null) {
          this.isVisible.next(false);
          resolve(choice);
        }
      });
    });
  }

  confirm() {
    this.choice.next(true);
  }

  cancel() {
    this.choice.next(false);
  }
}