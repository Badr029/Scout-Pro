import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { RegisterPageComponent } from './register-page/register-page.component';
// Import other components if any

@NgModule({
  declarations: [
    AppComponent,
    RegisterPageComponent,
    // ... other components ...
  ],
  imports: [
    BrowserModule,      // ✅ Essential for any Angular app
    HttpClientModule,
    FormsModule,        // ✅ Needed for ngForm
    // ... other modules if any ...
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
