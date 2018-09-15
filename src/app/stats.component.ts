import { Component, OnInit } from '@angular/core'
import { PlayersService, Score } from './players.service'

@Component({
  selector: 'stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
})
export class StatsComponent implements OnInit {
  scores: Score[]

  constructor(private playerService: PlayersService) {}

  ngOnInit() {
    this.refresh()
  }

  refresh() {
    this.playerService.getScores().subscribe((scores) => (this.scores = scores))
  }
}
