import { Component } from '@angular/core';
import { CodeEditorComponent } from './code-editor/code-editor.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CodeEditorComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'InnovaCodeEditorFrontend';
}