import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/fmea' },
  { path: 'fmea', loadChildren: () => import('./fmea/fmea.routes').then(m => m.FMEA_ROUTES) },
];
