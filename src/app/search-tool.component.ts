import { Component, Input } from '@angular/core'
import { MatDialog } from '@angular/material'
import { BehaviorSubject, Observable, timer } from 'rxjs'
import {
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  switchMap,
} from 'rxjs/operators'
import { PlayerComponent } from './player.component'
import { Player, PlayersService, Stats } from './players.service'
import { RefreshService } from './refresh.service'

@Component({
  selector: 'search-tool',
  templateUrl: './search-tool.component.html',
  styleUrls: ['./search-tool.component.scss'],
})
export class SearchToolComponent {
  isLoading: boolean = false
  players$: Observable<Player[]>
  search$ = new BehaviorSubject<string>('')
  refresh$ = new BehaviorSubject<boolean>(true)
  stats$: Observable<Stats>

  @Input()
  viewAll: boolean = false

  get searchInput(): string {
    return this.search$.getValue()
  }

  set searchInput(value: string) {
    this.search$.next(value)
  }

  constructor(
    private playersService: PlayersService,
    private refreshService: RefreshService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    const refresh$ = this.refresh$.pipe(
      merge(this.refreshService.refresh$),
      map((r) => this.searchInput)
    )
    this.players$ = this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      merge(refresh$),
      switchMap((search) => this.playersService.search(search, this.viewAll))
    )
    this.stats$ = timer(0, 60000).pipe(
      switchMap((t) => this.playersService.getStats())
    )
  }

  openPlayer(player: Player) {
    const dialogRef = this.dialog.open(PlayerComponent, { autoFocus: false })
    dialogRef.componentInstance.currentPlayer = player
  }

  trackByFn(player) {
    return player._id
  }

  reinitializeSearch() {
    this.searchInput = ''
  }
}
