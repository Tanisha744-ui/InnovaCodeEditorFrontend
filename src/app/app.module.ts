import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';


import { AppComponent } from './app.component';
import { CodeEditorComponent } from './code-editor/code-editor.component';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppComponent,
    CodeEditorComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}