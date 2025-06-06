import { Injectable, ComponentRef, ViewContainerRef, Type } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalContainer: ViewContainerRef | null = null;
  private activeModal: ComponentRef<any> | null = null;
  private modalState = new Subject<boolean>();

  modalState$ = this.modalState.asObservable();

  setContainer(container: ViewContainerRef) {
    this.modalContainer = container;
  }

  open(content: any) {
    if (!this.modalContainer) {
      console.error('Modal container not set');
      return;
    }

    this.activeModal = this.modalContainer.createComponent(content);
    this.modalState.next(true);
  }

  close() {
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = null;
      this.modalState.next(false);
    }
  }
}
