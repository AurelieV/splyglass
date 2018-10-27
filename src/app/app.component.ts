import { MediaMatcher } from '@angular/cdk/layout'
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { MatDialog } from '@angular/material'
import { MOBILE_MEDIA_QUERY } from './configuration'
import { PlayerComponent } from './player.component'
import { User, UserService } from './user.service'

interface Message {
  value: string
  type: string
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  mobileQuery: MediaQueryList
  private _mobileQueryListener: () => void
  user: User

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    media: MediaMatcher,
    @Inject(MOBILE_MEDIA_QUERY) mobileQuery: string,
    private matDialog: MatDialog
  ) {
    // Define a listener for responsive design
    this.mobileQuery = media.matchMedia(mobileQuery)
    this._mobileQueryListener = () => cdr.detectChanges()
    this.mobileQuery.addListener(this._mobileQueryListener)
  }

  ngOnInit() {
    this.userService.init()
    this.userService.user$.subscribe((user) => {
      this.user = user
      // force to do this, because facebook login is not detected
      this.cdr.detectChanges()
    })
  }

  login() {
    this.userService.login()
  }

  logout() {
    this.userService.logout()
  }

  addPlayer() {
    this.matDialog.open(PlayerComponent, {
      autoFocus: false,
    })
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener)
  }
}
