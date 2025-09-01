// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // Імпортуємо Router
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: '<router-outlet></router-outlet>', // Тільки router-outlet
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Підписуємось на зміни сесії
    this.authService.session$.subscribe(session => {
      if (session) {
        // Якщо користувач залогінився і знаходиться на сторінці входу,
        // перекидаємо його на головну.
        if (this.router.url === '/login') {
          this.router.navigate(['/']);
        }
      } else {
        // Якщо користувач НЕ залогінений, примусово відправляємо на сторінку входу.
        this.router.navigate(['/login']);
      }
    });
  }
}