import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface Player {
  firstname: string
  lastname: string
  deck: string
  playerId?: string
  _id?: any
}

export interface Stats {
  total: number
  withDeck: number
}

export interface Score {
  name: string
  score: number
}

@Injectable()
export class PlayersService {
  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get('/api/players').pipe(map((res: any) => res.data))
  }

  search(search: string, viewAll: boolean = false): Observable<Player[]> {
    return this.http
      .get('/api/players', { params: { search, viewAll: String(viewAll) } })
      .pipe(map((res: any) => res.data))
  }

  add(lastname: string, firstname: string, deck?: string, comment?: string) {
    return this.http.post('/api/players', {
      lastname,
      firstname,
      deck,
      comment,
    })
  }

  edit(
    _id: any,
    lastname: string,
    firstname: string,
    deck?: string
  ): Observable<Player> {
    return this.http
      .post(`/api/players/${_id}`, {
        lastname,
        firstname,
        deck,
      })
      .pipe(map((res: any) => res.data))
  }

  comment(_id: any, comment: string) {
    return this.http
      .post(`/api/players/${_id}/comment`, { comment })
      .pipe(map((res: any) => res.data))
  }

  getStats(): Observable<Stats> {
    return this.http.get('/api/stats') as Observable<{
      total: number
      withDeck: number
    }>
  }

  getScores(): Observable<Score[]> {
    return this.http.get('/api/scores').pipe(
      map((res: any) => {
        return res.map((s) => ({ name: s._id, score: s.count }))
      })
    )
  }
}
