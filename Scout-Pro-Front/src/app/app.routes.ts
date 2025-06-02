import { Routes } from '@angular/router';
import { RegisterPlayerComponent } from './register-player/register-player.component';
import { LoginPageComponent } from './login-page/login-page.component'
import { ProfileComponent } from './Player/profile/profile.component'
import { ScoutRegisterComponent } from './scout-register/scout-register.component';
import { RegisterPageComponent } from './register-page/register-page.component'
import { EditProfileComponent } from './Player/profile/edit-profile/edit-profile.component';
import { HomeFeedComponent } from './home-feed/home-feed.component';
import { PlayerViewComponent } from './player-view/player-view.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { EmailVerificationComponent } from './email-verification/email-verification.component';
import { SubscriptionComponent } from './subscription/subscription.component';
import { AuthGuard } from './auth.guard';
import { ScoutProfileComponent } from './Scout/profile/profile.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { ScoutEditComponent } from './Scout/profile/scout-edit/scout-edit.component';
import { ScoutViewComponent } from './scout-view/scout-view.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'welcome',
        pathMatch: 'full'
    },
    {
        path: 'welcome',
        component: WelcomeComponent
    },
    {
        path: 'register',
        component: RegisterPageComponent
    },
    {
        path: 'register-player',
        component: RegisterPlayerComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'login',
        component: LoginPageComponent
    },
    {
        path: 'forgot-password',
        component: ForgotPasswordComponent
    },
    {
        path: 'reset-password',
        component: ResetPasswordComponent
    },
    {
        path: 'email/verify/:id/:hash',
        component: EmailVerificationComponent
    },
    {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'scout/profile',
        component: ScoutProfileComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'scout/profile/edit',
        component: ScoutEditComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'Edit',
        component: EditProfileComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'scout-register',
        component: ScoutRegisterComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'Register-Page',
        component: RegisterPageComponent
    },
    {
        path: 'edit-profile',
        component: EditProfileComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'home-feed',
        component: HomeFeedComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'player/:id',
        component: PlayerViewComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'subscription',
        component: SubscriptionComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'event/:id',
        component: HomeFeedComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'welcome',
        component: WelcomeComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'scout-edit',
        component: ScoutEditComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'scout/:id',
        component: ScoutViewComponent,
        canActivate: [AuthGuard]
    },




];
