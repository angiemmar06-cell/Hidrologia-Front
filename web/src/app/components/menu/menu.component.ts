import { Component } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { RouterLink } from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [MatButtonModule, RouterLink, MatIconModule, MatTooltip],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  constructor(public authService: AuthService) { } // Inject the service to use it in the template

}
