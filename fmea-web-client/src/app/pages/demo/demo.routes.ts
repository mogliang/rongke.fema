import { Routes } from '@angular/router';

export const DEMO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./demo.component').then(m => m.DemoComponent)
  }
];
