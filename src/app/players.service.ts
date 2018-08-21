import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, share } from 'rxjs/operators';

@Injectable()
export class PlayersService {
  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get('/api/players').pipe(
      map((res: any) => res.data),
      share()
    )
  }
}