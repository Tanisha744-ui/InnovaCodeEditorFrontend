import { AfterViewInit, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CodeExecutionService } from '../Service/code-execution.service';
import { timeout } from 'rxjs/operators';

declare const monaco: any;

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css']
})
export class CodeEditorComponent implements AfterViewInit {
  code: string = `using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Hello World");
        Console.WriteLine(10 + 20);
    }
}`;
  output = '';
  userInput: string = '';
  selectedLanguage: string = 'csharp';
  editorOptions: any = {
    theme: 'vs-dark',
    language: 'csharp',
    automaticLayout: true,
    fontSize: 14,
    minimap: { enabled: false },
  };

  constructor(
    private codeExecutionService: CodeExecutionService,
    private http: HttpClient
  ) {}

  runCode() {
    this.http.post<any>('http://localhost:5143/api/CodeExecution/execute', {
      code: this.code,
      input: this.userInput
    })
    .pipe(timeout(10000))
    .subscribe({
      next: res => {
        this.output = res.output;
      },
      error: err => {
        this.output = err.error?.message || 'Execution failed or timed out';
      }
    });
  }

  ngAfterViewInit() {
    const onGotAmdLoader = () => {
      (window as any).require.config({ paths: { 'vs': 'assets/monaco-editor/min/vs' } });
      (window as any).require(['vs/editor/editor.main'], () => {
        const editor = monaco.editor.create(document.getElementById('monaco-container'), {
          value: this.code, // Use the component's code property
          language: 'csharp',
          theme: 'vs-dark'
        });

        // Update this.code whenever the editor content changes
        editor.onDidChangeModelContent(() => {
          this.code = editor.getValue();
        });
      });
    };

    if (!(window as any).require) {
      const loaderScript = document.createElement('script');
      loaderScript.type = 'text/javascript';
      loaderScript.src = 'assets/monaco-editor/min/vs/loader.js';
      loaderScript.addEventListener('load', onGotAmdLoader);
      document.body.appendChild(loaderScript);
    } else {
      onGotAmdLoader();
    }
  }
}
