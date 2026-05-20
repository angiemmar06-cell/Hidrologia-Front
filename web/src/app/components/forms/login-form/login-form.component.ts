import { Component } from '@angular/core';

//To use forms 
//  Import in the imports on the component the following
import { ReactiveFormsModule } from '@angular/forms';
import {MatInputModule} from "@angular/material/input";//angular material must be installed before
import { MatTooltip } from '@angular/material/tooltip';
import {MatCardModule} from '@angular/material/card';
import { CommonModule } from '@angular/common';

//To use the controls in the component
//  Import in the imports on the component the following
import {FormControl} from '@angular/forms';
import {FormGroup, Validators} from '@angular/forms';
import { ServerAnswerModel } from '../../../models/server-answer.model';
import { ApiService } from '../../../services/api.service';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../services/auth.service';


@Component({
  selector: 'app-login.form',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, MatTooltip, MatButtonModule, CommonModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss'
})
export class LoginFormComponent {
  serverMessage = '';
  //Form component creation
  username = new FormControl('', [Validators.required,Validators.minLength(4)]);
  password =  new FormControl('', [Validators.required,Validators.minLength(4)]);

  //Create a form group to eval the data at once
  controlsGroup = new FormGroup({
    username: this.username,
    password: this.password,
  })

  //Pay attention to::
  //  - Services must be injected in the constructor
  //  - Services are not imported in the component, in the imports array
  constructor(private apiService:ApiService, private authService: AuthService){}

  login(){
    this.serverMessage='';

    this.apiService.post('core/login/', this.controlsGroup.value).subscribe({
          next: (response: ServerAnswerModel) => {
            if (response.ok){
              this.authService.username = this.username.value!; //! is a non-null assertion operator
              this.authService.isAuthenticated = true;
            }
            this.serverMessage=response.message;
          },
          error: (error:any)=>{
            console.log(error.description)
          }
        })//subscribe
  }
}
