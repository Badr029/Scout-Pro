import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { SocialLoginModule, SocialAuthServiceConfig, GoogleLoginProvider, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(SocialLoginModule, GoogleSigninButtonModule),
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider('562616313672-bmpb09jqgpdgciqsa532m2ifv147i2qc.apps.googleusercontent.com', {
              oneTapEnabled: false,
              prompt_parent_id: 'google-btn',
              scopes: 'email profile'
            })
          }
        ]
      } as SocialAuthServiceConfig
    }
  ]
};
