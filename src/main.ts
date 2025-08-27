// src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Ця команда запускає додаток напряму в браузері,
// ігноруючи серверний рендеринг (SSR).
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));