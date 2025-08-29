// src/app/components/confirm-dialog/confirm-dialog.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  isVisible$: Observable<boolean>;
  message$: Observable<string>;

  constructor(private confirmDialogService: ConfirmDialogService) {
    this.isVisible$ = this.confirmDialogService.isVisible$;
    this.message$ = this.confirmDialogService.message$;
  }

  onConfirm() {
    this.confirmDialogService.confirm();
  }

  onCancel() {
    this.confirmDialogService.cancel();
  }
}