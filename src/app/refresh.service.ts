import { Subject } from 'rxjs'

export class RefreshService {
  refresh$ = new Subject()

  notify() {
    this.refresh$.next()
  }
}
