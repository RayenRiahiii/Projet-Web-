import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {

  
  loginForm!: FormGroup;

  
  isLoading = false;

  
  errorMsg = '';

  
  passwordVisible = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngAfterViewInit(): void {
    this.initParticles();
  }

  
  
  
  onSubmit(): void {
    if (this.loginForm.invalid) { return; }

    this.isLoading = true;
    this.errorMsg  = '';

    const { email, password } = this.loginForm.value;

    this.auth.login(email, password).subscribe({
      next: () => {
        const role = this.auth.getRole();

        
        switch (role) {
          case 'ADMIN':
            this.router.navigate(['/admin']);
            break;
          case 'MANAGER':
            this.router.navigate(['/manager']);
            break;
          case 'DEVELOPPEUR':
          default:
            this.router.navigate(['/developpeur']);
            break;
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMsg  = 'Email ou mot de passe incorrect.';
        this.isLoading = false;
      }
    });
  }

  
  
  
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
    const passwordInput = this.el.nativeElement.querySelector('#password');
    
    if (passwordInput) {
      passwordInput.type = this.passwordVisible ? 'text' : 'password';
    }
  }

  
  
  
  get f() { return this.loginForm.controls; }

  private initParticles(): void {
    const particlesContainer = this.el.nativeElement.querySelector('#particles');
    if (!particlesContainer) return;
    
    const particleCount = 20;
    
    
    for (let i = 0; i < particleCount; i++) {
      this.createParticle(particlesContainer);
    }
  }
  
  private createParticle(container: HTMLElement): void {
    const particle = document.createElement('span');
    particle.classList.add('particle');
    
    
    const size = Math.random() * 15 + 5;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.left = `${Math.random() * 100}%`;
    
    
    particle.style.opacity = `${Math.random() * 0.5 + 0.1}`;
    
    
    const duration = Math.random() * 20 + 10;
    particle.style.animation = `float ${duration}s linear infinite`;
    
    
    particle.style.animationDelay = `${Math.random() * 10}s`;
    
    container.appendChild(particle);
  }
}
