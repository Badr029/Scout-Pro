import { Injectable, ComponentRef, ViewContainerRef, Type } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalContainer: ViewContainerRef | null = null;
  private activeModalId: string | null = null;
  private modalState = new Subject<{id: string | null; isOpen: boolean}>();

  modalState$ = this.modalState.asObservable();

  setContainer(container: ViewContainerRef) {
    this.modalContainer = container;
  }

  open(modalId: string) {
    if (this.activeModalId) {
      this.close();
    }
    this.activeModalId = modalId;
    this.modalState.next({ id: modalId, isOpen: true });
  }

  close() {
    const previousId = this.activeModalId;
    this.activeModalId = null;
    this.modalState.next({ id: previousId, isOpen: false });
  }

  isOpen(modalId: string): boolean {
    return this.activeModalId === modalId;
  }
}
