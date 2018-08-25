import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PlayersService {
  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get('/api/players').pipe(
      map((res: any) => res.data)
    )
  }

  search(search: string) {
    return this.http.get('/api/players', {params: {search}}).pipe(
      map((res: any) => res.data)
    )
  }

  add(lastname: string, firstname: string, deck?: string, comment?: string) {
    return this.http.post('/api/players', {lastname, firstname, deck, comment});
  }

  edit(_id: any, lastname: string, firstname: string, deck?: string, comment?: string) {
    return this.http.post(`/api/players/${_id}`, {lastname, firstname, deck, comment});
  }

  comment(_id: any, comment: string) {
    return this.http.post(`/api/players/${_id}/comment`, {comment});
  }

  getStats(): Observable<{total: number; withDeck: number}> {
    return this.http.get('/api/stats') as Observable<{total: number; withDeck: number}>;
  }
}