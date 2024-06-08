import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TaskExecuteService {

  timeForExecution(task: any) {
    return new Promise<void>((resolve, reject) => { 
      setTimeout(() => {
        task();
        resolve(); 
      }, 800);
    });
  }
}
