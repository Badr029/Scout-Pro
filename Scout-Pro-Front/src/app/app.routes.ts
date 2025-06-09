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
import { AuthGuard } from './guards/auth.guard';
import { ScoutGuard } from './guards/scout.guard';
import { ScoutProfileComponent } from './Scout/profile/profile.component';
import { ScoutEditComponent } from './Scout/profile/scout-edit/scout-edit.component';
import { ScoutViewComponent } from './scout-view/scout-view.component';
import { ScoutSubscriptionComponent } from './subscription/scout-subscription/scout-subscription.component';
import { SubscriptionComponent } from './subscription/subscription/subscription.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { SubscriptionDetailComponent } from './subscription-detail/subscription-detail.component';
import { AdminGuard } from './guards/admin.guard';
import { NonAdminGuard } from './guards/non-admin.guard';
import { GuestGuard } from './guards/guest.guard';
import { SubscriptionGuard } from './guards/subscription.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./dynamic-welcome/dynamic-welcome.component').then(m => m.DynamicWelcomeComponent),
        pathMatch: 'full',
        canActivate: [GuestGuard]
    },
    {
        path: 'welcome',
        redirectTo: '',
        pathMatch: 'full'
    },
    {
        path: 'register',
        component: RegisterPageComponent
    },
    {
        path: 'register-player',
        component: RegisterPlayerComponent,
        canActivate: [AuthGuard, NonAdminGuard]
    },
    {
        path: 'login',
        component: LoginPageComponent,
        canActivate: [GuestGuard]
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
        canActivate: [AuthGuard, NonAdminGuard, ScoutGuard, SubscriptionGuard]
    },
    {
        path: 'scout/profile',
        component: ScoutProfileComponent,
        canActivate: [AuthGuard, NonAdminGuard, ScoutGuard, SubscriptionGuard]
    },
    {
        path: 'scout/profile/edit',
        component: ScoutEditComponent,
        canActivate: [AuthGuard, NonAdminGuard, ScoutGuard, SubscriptionGuard]
    },
    {
        path: 'Edit',
        component: EditProfileComponent,
        canActivate: [AuthGuard, NonAdminGuard, ScoutGuard, SubscriptionGuard]
    },
    {
        path: 'scout-register',
        component: ScoutRegisterComponent,
        canActivate: [AuthGuard, NonAdminGuard]
    },
    {
        path: 'Register-Page',
        component: RegisterPageComponent
    },
    {
        path: 'edit-profile',
        component: EditProfileComponent,
        canActivate: [AuthGuard, NonAdminGuard, ScoutGuard, SubscriptionGuard]
    },
    {
        path: 'home-feed',
        component: HomeFeedComponent,
        canActivate: [AuthGuard, NonAdminGuard, SubscriptionGuard]
    },
    {
        path: 'player/:id',
        component: PlayerViewComponent,
        canActivate: [AuthGuard, NonAdminGuard, ScoutGuard, SubscriptionGuard]
    },
    {
        path: 'subscription',
        component: SubscriptionComponent,
        canActivate: [AuthGuard, NonAdminGuard]
    },
    {
        path: 'event/:id',
        component: HomeFeedComponent,
        canActivate: [AuthGuard, NonAdminGuard, ScoutGuard, SubscriptionGuard]
    },
    {
        path: 'scout-edit',
        component: ScoutEditComponent,
        canActivate: [AuthGuard, NonAdminGuard, ScoutGuard, SubscriptionGuard]
    },
    {
        path: 'scout/:id',
        component: ScoutViewComponent,
        canActivate: [AuthGuard, NonAdminGuard, ScoutGuard, SubscriptionGuard]
    },
    {
        path: 'scout-subscription',
        component: ScoutSubscriptionComponent,
        canActivate: [AuthGuard, NonAdminGuard]
    },
    {
        path: 'subscription-detail',
        component: SubscriptionDetailComponent,
        canActivate: [AuthGuard, NonAdminGuard, SubscriptionGuard]
    },
    {
        path: 'admin-dashboard',
        component: AdminDashboardComponent,
        canActivate: [AuthGuard, AdminGuard]
    },
    // Catch all unknown routes
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];
