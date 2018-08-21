import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { PlayersService } from './players.service';

interface Player {
  firstname: string;
  lastname: string;
  deck: string;
  playerId?: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isLoading: boolean = false;
  searchInput: string = '';
  players$: Observable<Player[]>;

  constructor(private playersService: PlayersService) {}

  ngOnInit() {
    this.players$ = this.playersService.getAll();
  }

  reinitializeSearch() {
    this.searchInput = '';
  }
}
