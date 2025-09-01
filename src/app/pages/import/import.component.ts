// src/app/pages/import/import.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss']
})
export class ImportComponent implements OnInit {

  bookmarkletUrl: SafeUrl | null = null;
  errorMessage: string | null = null;

  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const session = this.authService._session.getValue();
    const accessToken = session?.session?.access_token;
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcWp4enF1ZWtnbGFsdG50ZHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjQwMjAsImV4cCI6MjA3MTkwMDAyMH0.ryUeEJLA5nNBK_DEvj1TQPhPbgaZEM1crFQXXFourmk'; // Твій ключ, щоб не забути

    if (!accessToken) {
      this.errorMessage = "Помилка: не вдалося отримати токен доступу. Будь ласка, спробуйте вийти і зайти знову.";
      return;
    }

    const parserScript = (token: string) => {
      const showToast = (() => {
        let currentToast: HTMLElement | null = null; // Зберігаємо посилання на поточний тост

        return (message: string, type: 'success' | 'info' | 'error' = 'info') => {
          // Якщо старий тост ще існує, видаляємо його
          if (currentToast) {
            currentToast.remove();
          }

          let backgroundColor = 'rgba(0, 123, 255, 0.5)'; // Синій (info)
          if (type === 'success') backgroundColor = 'rgba(40, 167, 69, 0.5)'; // Зелений
          if (type === 'error') backgroundColor = 'rgba(220, 53, 69, 0.5)'; // Червоний

          const toast = document.createElement('div');
          currentToast = toast; // Зберігаємо новий тост як поточний

          // Стилі гласморфізму
          toast.style.position = 'fixed';
          toast.style.bottom = '20px';
          toast.style.right = '20px'; 
          toast.style.padding = '15px 25px';
          toast.style.borderRadius = '16px'; 
          toast.style.color = '#ffffffff';
          toast.style.zIndex = '9999';
          toast.style.fontFamily = '"Segoe UI", Roboto, Helvetica, Arial, sans-serif';
          toast.style.fontSize = '16px';
          toast.style.maxWidth = '350px';

          // Магія гласморфізму
          toast.style.background = 'rgba(22, 33, 62, 0.3)';
          toast.style.backdropFilter = 'blur(10px)';
          toast.style.border = '1px solid rgba(255, 255, 255, 0.2)';
          toast.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.3)';

          // Кольорова лінія зліва для індикації
          toast.style.borderLeft = `5px solid ${backgroundColor}`;

          toast.innerText = message;
          document.body.appendChild(toast);

          setTimeout(() => {
            if (toast) {
              toast.remove();
            }
            // Якщо цей тост був останнім, очищуємо посилання
            if (currentToast === toast) {
              currentToast = null;
            }
          }, 5000);
        };
      })();

      showToast('Починаю імпорт! Будь ласка, зачекайте...');

      // Встановлюємо дату, з якої починаємо імпорт
      const importStartDate = new Date('2025-09-01T00:00:00Z');

      const reactRoot = document.getElementById('react-apply-history');
      if (!reactRoot) { alert('Помилка: не вдалося знайти #react-apply-history.'); return; }

      const pageContainer = reactRoot.querySelectorAll(':scope > div')[1] as HTMLElement;
      if (!pageContainer) { alert('Помилка: не вдалося знайти контейнер сторінки.'); return; }

      const listContainer = pageContainer.querySelector(':scope > div') as HTMLElement;
      if (!listContainer) { alert('Помилка: не вдалося знайти контейнер списку відгуків.'); return; }

      const applicationCards = listContainer.querySelectorAll(':scope > div');
      const vacancies: any[] = [];
      let skippedCount = 0;

      applicationCards.forEach(card => {
        try {
          const titleLinkElement = card.querySelector('h2 a') as HTMLAnchorElement;
          const allDivsInCard = card.querySelectorAll('div');
          const dateElement = allDivsInCard[allDivsInCard.length - 1] as HTMLElement;
          const salaryElement = allDivsInCard[1]?.querySelector('span') as HTMLElement;

          let date_applied: string | null = null;
          if (dateElement) {
            const date_applied_raw = dateElement.innerText.split(',')[0].trim();
            const year = new Date().getFullYear().toString();
            const months: { [key: string]: string } = { 'січня': '01', 'лютого': '02', 'березня': '03', 'квітня': '04', 'травня': '05', 'червня': '06', 'липня': '07', 'серпня': '08', 'вересня': '09', 'жовтня': '10', 'листопада': '11', 'грудня': '12' };
            const parts = date_applied_raw.split(' ');
            if (parts.length >= 2) {
              const day = parts[0].padStart(2, '0');
              const month = months[parts[1]];
              const yearInDate = parts.find(p => /^\d{4}$/.test(p)) || year;
              date_applied = `${yearInDate}-${month}-${day}`;
            }
          }

          if (titleLinkElement && date_applied) {
            const vacancyDate = new Date(date_applied + 'T00:00:00Z');
            if (vacancyDate >= importStartDate) {
              vacancies.push({
                vacancy_title: titleLinkElement.innerText,
                vacancy_url: titleLinkElement.href,
                platform: 'Work.ua',
                date_applied: date_applied,
                status: 'Подано',
                salary: salaryElement ? salaryElement.innerText : '',
                notes: ''
              });
            } else {
              skippedCount++;
            }
          } else {
            console.warn('Пропущено картку без назви або дати:', card);
          }
        } catch (e) {
          console.warn('Не вдалося розпарсити картку.', e);
        }
      });

      let finalMessage = '';
      if (vacancies.length > 0) {
        finalMessage += `Знайдено ${vacancies.length} нових вакансій для імпорту.\n`;
      } else {
        finalMessage += 'Нових вакансій для імпорту не знайдено.\n';
      }
      if (skippedCount > 0) {
        finalMessage += `Пропущено ${skippedCount} старих вакансій.`;
      }
      showToast(finalMessage);

      if (vacancies.length === 0) { return; }

      const functionUrl = 'https://oaqjxzquekglaltntdra.supabase.co/functions/v1/bulk-add-vacancies';
      fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcWp4enF1ZWtnbGFsdG50ZHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjQwMjAsImV4cCI6MjA3MTkwMDAyMH0.ryUeEJLA5nNBK_DEvj1TQPhPbgaZEM1crFQXXFourmk'
        },
        body: JSON.stringify({ vacancies })
      })
        .then(response => {
          if (!response.ok) { return response.text().then(text => { throw new Error(text) }); }
          return response.json();
        })
        .then(data => {
          showToast(`Успішно імпортовано! ${data.message || JSON.stringify(data)}`, 'success');

          // --- НАДСИЛАЄМО ПОВІДОМЛЕННЯ В НАШ ДОДАТОК ---
          const channel = new BroadcastChannel('job_tracker_channel');
          channel.postMessage('refresh_vacancies');
          channel.close();
        })
        .catch(error => {
          console.error('Помилка імпорту:', error);
          showToast(`Сталася помилка під час імпорту: ${error.message}`, 'error');
        });
    };

    const scriptAsString = `((${parserScript.toString()})('${accessToken}'))`;
    this.bookmarkletUrl = this.sanitizer.bypassSecurityTrustUrl(`javascript:${encodeURIComponent(scriptAsString)}`);
  }
}