import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

@Component({
  imports: [
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    RouterLink,
  ],
  selector: 'app-prerender-proof',
  styleUrl: './prerender-proof.scss',
  templateUrl: './prerender-proof.html',
})
export class PrerenderProof {
  protected readonly interactionCount = signal(0);

  protected incrementInteractionCount(): void {
    this.interactionCount.update((count) => count + 1);
  }
}
