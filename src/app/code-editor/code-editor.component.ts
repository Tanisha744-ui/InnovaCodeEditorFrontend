import { AfterViewInit, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CodeExecutionService } from '../Service/code-execution.service';
import { timeout } from 'rxjs/operators';
import { ChangeDetectorRef, NgZone } from '@angular/core';


declare const monaco: any;

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css']
})
export class CodeEditorComponent implements AfterViewInit {
      public isDarkMode = true;
      toggleMode(): void {
        this.isDarkMode = !this.isDarkMode;
        const theme = this.isDarkMode ? 'vs-dark' : 'vs-light';
        if (this.editor) {
          monaco.editor.setTheme(theme);
        }
        // Change body class for global styles
        document.body.classList.toggle('light-mode', !this.isDarkMode);
        document.body.classList.toggle('dark-mode', this.isDarkMode);
      }
    addFile(): void {
      const newFileName = `File${this.files.length + 1}.cs`;
      this.files.push({ fileName: newFileName, code: '' });
      this.selectedFileIndex = this.files.length - 1;
      setTimeout(() => {
        if (this.editor) this.editor.setValue('');
      });
    }

    removeFile(index: number): void {
      if (this.files.length <= 1) return;
      this.files.splice(index, 1);
      if (this.selectedFileIndex >= this.files.length) {
        this.selectedFileIndex = this.files.length - 1;
      }
      setTimeout(() => {
        if (this.editor) this.editor.setValue(this.files[this.selectedFileIndex].code);
      });
    }

    selectFile(index: number): void {
      this.selectedFileIndex = index;
      if (this.editor) this.editor.setValue(this.files[index].code);
    }
  public files: Array<{ fileName: string; code: string }> = [
    { fileName: 'Program.cs', code: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello World");
        Console.WriteLine(10 + 20);
    }
}` }
  ];
  public selectedFileIndex = 0;
  public output = '';
  public userInput: string = '';
  private editor: any;
  editorFlex = 1;
  outputFlex = 0.4;
  private resizing = false;
  private resizingEnabled = false;
  private startY = 0;
  private startEditorHeight = 0;
  private startOutputHeight = 0;
  editorHeight = 350; // initial height in px
  outputHeight = 180; // initial height in px
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
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private zone:NgZone
  ) {}
  runCode() {
    if (this.editor) {
      this.files[this.selectedFileIndex].code = this.editor.getValue();
    }
    this.codeExecutionService.executeCode(this.files, this.userInput)
      .pipe(timeout(10000))
      .subscribe({
        next: res => {
          this.zone.run(() => {
            this.output = res.output;
            this.cd.detectChanges();
          });
        },
        error: err => {
          this.zone.run(() => {
            this.output = err.error?.message || 'Execution failed or timed out';
            this.cd.detectChanges();
          });
        }
      });
  }

  ngAfterViewInit() {
    const initMonaco = () => {
      (window as any).require.config({
        paths: { vs: 'assets/monaco-editor/min/vs' }
      });

      (window as any).require(['vs/editor/editor.main'], () => {
        this.editor = monaco.editor.create(
          document.getElementById('monaco-container'),
          {
            value: this.files[this.selectedFileIndex].code,
            language: 'csharp',
            theme: this.isDarkMode ? 'vs-dark' : 'vs-light',
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: false }
          }
        );

        this.editor.onDidChangeModelContent(() => {
          this.files[this.selectedFileIndex].code = this.editor.getValue();
        });

        this.initResizableConsole();
      });
    };

    if (!(window as any).require) {
      const loaderScript = document.createElement('script');
      loaderScript.src = 'assets/monaco-editor/min/vs/loader.js';
      loaderScript.onload = initMonaco;
      document.body.appendChild(loaderScript);
    } else {
      initMonaco();
    }
  }

  /** 🔥 Output console resize logic */
  initResizableConsole() {
    const resizer = document.querySelector('.resizer') as HTMLElement;
    const output = document.querySelector('.output-container') as HTMLElement;

    let isDragging = false;

    resizer.addEventListener('mousedown', () => {
      isDragging = true;
      document.body.style.cursor = 'row-resize';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const newHeight = window.innerHeight - e.clientY;
      output.style.height = `${Math.max(newHeight, 120)}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      document.body.style.cursor = 'default';
    });
  }

  startResizing(event: MouseEvent): void {
    this.resizing = true;
    this.startY = event.clientY;
    this.startEditorHeight = this.editorHeight;
    this.startOutputHeight = this.outputHeight;
    document.addEventListener('mousemove', this.onResizing);
    document.addEventListener('mouseup', this.stopResizing);
  }

  onResizing = (event: MouseEvent): void => {
    if (!this.resizing) return;
    const deltaY = event.clientY - this.startY;
    const newEditorHeight = this.startEditorHeight + deltaY;
    const newOutputHeight = this.startOutputHeight - deltaY;
    if (newEditorHeight > 100 && newOutputHeight >= 0) {
      this.editorHeight = newEditorHeight;
      this.outputHeight = newOutputHeight;
    }
  };

  stopResizing = (): void => {
    this.resizing = false;
    this.resizingEnabled = false; // Disable further resizing until next double-click
    document.removeEventListener('mousemove', this.onResizing);
    document.removeEventListener('mouseup', this.stopResizing);
  };

  enableResizing(): void {
    this.resizingEnabled = true;
  }

  maybeStartResizing(event: MouseEvent): void {
    if (!this.resizingEnabled) return;
    this.startResizing(event);
  }
}
