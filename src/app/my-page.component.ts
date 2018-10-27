import { Component } from '@angular/core'
import { MatDialog, MatSnackBar } from '@angular/material'
import { Observable } from 'rxjs'
import { filter, map } from 'rxjs/operators'
import { PlayerComponent } from './player.component'
import { Match, Player, PlayersService } from './players.service'
import { UserService } from './user.service'

@Component({
  selector: 'my-page',
  templateUrl: './my-page.component.html',
  styleUrls: ['./my-page.component.scss'],
})
export class MyPageComponent {
  isLoading: boolean = false
  matches: Match[]
  playerId$: Observable<string>

  id: string
  isEditingPlayerId: boolean = false

  constructor(
    private playersService: PlayersService,
    private dialog: MatDialog,
    private userService: UserService,
    private snackbar: MatSnackBar
  ) {
    this.playerId$ = this.userService.user$.pipe(
      filter((user) => Boolean(user)),
      map((user) => user.playerId)
    )
  }

  ngOnInit() {
    this.fetchMatches()
  }

  fetchMatches() {
    this.isLoading = true
    this.playersService.getMatches().subscribe(
      (matches) => {
        this.matches = matches
        this.isLoading = false
      },
      () => {
        this.snackbar.open('Impossible to get matches')
        this.isLoading = false
      }
    )
  }

  synchronizeMatches() {
    this.isLoading = true
    this.playersService
      .synchronizeMatches(this.userService.user.playerId)
      .subscribe(
        (matches) => {
          console.log('matches', matches)
          this.matches = matches
          this.isLoading = false
        },
        () => {
          this.snackbar.open('Impossible to update')
          this.isLoading = false
        }
      )
  }

  openPlayer(player: Player) {
    const dialogRef = this.dialog.open(PlayerComponent, { autoFocus: false })
    dialogRef.componentInstance.currentPlayer = player
    dialogRef.afterClosed().subscribe(() => {
      this.fetchMatches()
    })
  }

  setId(playerId: string) {
    this.isLoading = true
    this.userService.setPlayerId(playerId).subscribe(
      () => {
        this.isLoading = false
        this.isEditingPlayerId = false
        this.id = ''
        this.synchronizeMatches()
      },
      () => {
        this.snackbar.open('Impossible to update')
        this.isLoading = false
      }
    )
  }

  trackByFn(match: Match) {
    return match._id
  }
}
