import { Routes } from '@angular/router';

export const DEMO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./demo.component').then(m => m.DemoComponent)
  },
  {
    path: 'function-graph',
    loadComponent: () => import('./function-graph-demo.component').then(m => m.FunctionGraphDemoComponent)
  }
];
