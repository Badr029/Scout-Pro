import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificationPanelComponent } from './components/notification-panel/notification-panel.component';
import { TimeAgoPipe } from './pipes/time-ago.pipe';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NotificationPanelComponent,
    TimeAgoPipe
  ],
  exports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NotificationPanelComponent,
    TimeAgoPipe
  ]
})
export class SharedModule { }
