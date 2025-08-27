// src/app/interfaces/vacancy.ts
export interface Vacancy {
  id: number;
  created_at: string;
  vacancy_title: string;
  vacancy_url: string;
  platform: string;
  date_applied: string;
  salary: string;
  status: string;
  notes: string;
}