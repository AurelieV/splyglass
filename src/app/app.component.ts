import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, merge, switchMap } from 'rxjs/operators';
import { PlayersService } from './players.service';
import { User, UserService } from './user.service';

interface Player {
  firstname: string;
  lastname: string;
  deck: string;
  playerId?: string;
  _id?: any;
}

interface Message {
  value: string;
  type: string;
}

interface Stats {
  total: number;
  withDeck: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isLoading: boolean = false;
  players$: Observable<Player[]>;
  search$ = new BehaviorSubject<string>("");
  refresh$ = new BehaviorSubject<boolean>(true);
  displayModal: boolean = false;
  isCommentLoading = false;
  modalTitles = {
    add: 'Add a player',
    update: 'Update information',
    more: ''
  };
  modalType: 'add' | 'update' | 'more' = 'add';
  modalActions = {
    add: 'Add',
    update: 'Update',
    more: 'Close'
  }
  lastname: string;
  firstname: string;
  deck: string;
  comment: string;
  currentPlayer: Player;
  message: Message;
  stats$: Observable<Stats>;
  user: User;


  get searchInput() {
    return this.search$.getValue();
  }

  set searchInput(value) {
    this.search$.next(value)
  }

  constructor(private playersService: PlayersService, private userService: UserService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.players$ = this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      merge(this.refresh$.pipe(map(r => this.searchInput))),
      switchMap(search => this.playersService.search(search))
    );
    this.stats$ = timer(0, 60000).pipe(
      switchMap(t => this.playersService.getStats())
    )
    this.userService.user$.subscribe(user => {
      this.user = user;
      // force to do this, because facebook login is not detected
      this.cdr.detectChanges();
    })
  }

  login() {
    this.userService.login();
  }

  logout() {
    this.userService.logout();
  }

  addPlayer() {
    this.displayModal = true;
    this.modalType = 'add';
    this.firstname = "";
    this.lastname = "";
    this.deck = "";
    this.comment = "";
  }

  updatePlayer(player) {
    this.currentPlayer = player;
    this.firstname = player.firstname;
    this.lastname = player.lastname;
    this.deck = player.deck;
    this.comment = "";
    this.modalType = 'update';
    this.displayModal = true;
  }

  seePlayer(player) {
    this.currentPlayer = player;
    this.modalType = 'more';
    this.displayModal = true;
    this.modalTitles.more = `${this.currentPlayer.lastname}, ${this.currentPlayer.firstname}`;
    this.comment = "";
  }

  notify(value: string, type: string) {
    this.message = {value, type};
    setTimeout(() => this.message = null, 3000);
  }

  addComment() {
    this.isCommentLoading = true;
    this.playersService.comment(this.currentPlayer._id, this.comment)
      .subscribe((res: any) => {
        this.currentPlayer = res.data;
        this.comment = "";
        this.isCommentLoading = false;
        this.refresh$.next(true)
      }, err => this.notify('Impossible to add comment','error'))
  }

  confirm() {
    if (this.modalType === 'add') {
      this.playersService.add(this.lastname, this.firstname, this.deck, this.comment)
        .subscribe(res => {
          this.refresh$.next(true)
          this.notify('Player added', 'success')
        }, err => this.notify('Impossible to add player','error'));
    }
    if (this.modalType === 'update') {
      this.playersService.edit(this.currentPlayer._id, this.lastname, this.firstname, this.deck, this.comment)
        .subscribe(res => {
          this.refresh$.next(true)
          this.notify('Player edited', 'success')
        }, err => this.notify('Impossible to edit player','error'));
    }
    this.closeModal();
  }

  trackByFn(player) {
    return player._id;
  }

  closeModal() {
    this.displayModal = false;
  }

  reinitializeSearch() {
    this.searchInput = '';
  }
}
