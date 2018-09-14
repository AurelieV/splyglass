import { Component } from '@angular/core'
import { MatDialogRef, MatSnackBar } from '@angular/material'
import { Player, PlayersService } from './players.service'
import { RefreshService } from './refresh.service'

@Component({
  selector: 'player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent {
  private _currentPlayer: Player

  lastname: string
  firstname: string
  deck: string
  comment: string

  isCommentLoading = false
  isLoading = false
  isEditing: boolean = false
  hasEdit: boolean = false

  isCommenting = false

  set currentPlayer(value: Player) {
    this._currentPlayer = value
    this.lastname = value.lastname
    this.firstname = value.firstname
    this.deck = value.deck
  }

  get currentPlayer(): Player {
    return this._currentPlayer
  }

  constructor(
    private playersService: PlayersService,
    private dialogRef: MatDialogRef<PlayerComponent>,
    private snackBar: MatSnackBar,
    private refreshService: RefreshService
  ) {}

  add() {
    this.playersService
      .add(this.lastname, this.firstname, this.deck, this.comment)
      .subscribe(
        (res) => {
          this.snackBar.open('Player added', null, { duration: 300 })
          this.refreshService.notify()
          this.dialogRef.close()
        },
        (err) =>
          this.snackBar.open('Impossible to add player', null, {
            duration: 300,
          })
      )
  }

  edit() {
    this.isLoading = true
    this.playersService
      .edit(this.currentPlayer._id, this.lastname, this.firstname, this.deck)
      .subscribe(
        (res) => {
          this.isLoading = false
          this.snackBar.open('Player edited', null, { duration: 300 })
          this.refreshService.notify()
          this.isEditing = false
          this.currentPlayer = res
        },
        (err) => {
          this.isLoading = false
          this.snackBar.open('Impossible to edit player', null, {
            duration: 300,
          })
        }
      )
  }

  addComment() {
    this.isCommentLoading = true
    this.playersService.comment(this.currentPlayer._id, this.comment).subscribe(
      (player: Player) => {
        this.currentPlayer = player
        this.comment = ''
        this.isCommentLoading = false
        this.isCommenting = false
      },
      (err) => {
        this.isCommentLoading = false
        this.snackBar.open('Impossible to add comment', null, { duration: 300 })
      }
    )
  }

  close() {
    if (this.hasEdit) {
      this.refreshService.notify()
    }
    this.dialogRef.close()
  }
}
