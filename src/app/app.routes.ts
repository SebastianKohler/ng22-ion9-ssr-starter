import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((module) => module.Home),
    pathMatch: 'full',
  },
  {
    path: 'prerender',
    loadComponent: () =>
      import('./prerender-proof/prerender-proof').then((module) => module.PrerenderProof),
  },
];
