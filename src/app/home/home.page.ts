import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  messages: { sender: 'user' | 'bot', text: string }[] = [];
  messageInput: string = '';
  loading = false;
  width: number = window.innerWidth

  models: string[] = []
  modeloSelecionado: string = 'mistral:7b'

  constructor(private alertController: AlertController, private cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.scrollToBottom();
    this.lastModelUsed()
    this.getModels()
    this.getMessagesFromStorage()
  }

  ionViewWillEnter() {
  }

  lastModelUsed() {
    const model = localStorage.getItem('model')
    if(model) this.modeloSelecionado = model
  }

  async sendMessage() {
    const message = this.messageInput.trim();
    if (!message) return;

    this.messages.push({ sender: 'user', text: message });
    this.messageInput = '';
    this.loading = true;

    const botMsg: any = { sender: 'bot', text: '' };
    this.messages.push(botMsg);

    const apiUrl = "https://eaa6-143-0-229-172.ngrok-free.app/stream";

    try {
      let req: Request;

      if (this.modeloSelecionado === 'llava:7b' && (document.getElementById('imagemUpload') as HTMLInputElement)?.files?.[0]) {
        const fileInput = document.getElementById('imagemUpload') as HTMLInputElement;
        const formData = new FormData();
        formData.append('prompt', message);
        formData.append('model', this.modeloSelecionado);
        formData.append('image', fileInput.files![0]);

        req = new Request(apiUrl, {
          method: "POST",
          body: formData
        });
      } else {
        req = new Request(apiUrl, {
          method: "POST",
          headers: new Headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({ prompt: message, model: this.modeloSelecionado })
        });
      }

      const response = await fetch(req);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullResponse += chunk;

        if (chunk.includes('</think>')) {
          botMsg.text = `<div class="thinking"><b>Pensando...</b><br>${fullResponse}</div>`;
        } else {
          botMsg.text = this.formatResponse(fullResponse);
        }

        this.scrollToBottom();
      }
    } catch (error) {
      console.log(error);
      
      botMsg.text = "❌ Erro ao conectar ao servidor. Por favor, tente novamente.";
      console.error("Erro:", error);
    } finally {
      localStorage.setItem('chat', JSON.stringify(this.messages))
      this.loading = false;
      this.scrollToBottom();
    }
  }

  formatResponse(text: string): string {
    return text.replace(/<think>(.*?)<\/think>/g, '<div class="thinking">$1</div>')
               .replace(/\n/g, '<br>');
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('listaChat')
      if (container) container.scrollTop = window.innerHeight;
    }, 300); // tempo maior pode ajudar
  }

  getMessagesFromStorage() {
    const chat: any = localStorage.getItem('chat')
    if(chat) this.messages = JSON.parse(chat)
  }

  async clearChat() {
    const alert = await this.alertController.create({
      header: 'Limpar conversa',
      message: 'Tem certeza que deseja apagar toda a conversa? Esta ação não poderá ser desfeita.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Apagar',
          role: 'destructive',
          handler: () => {
            this.messages = [];
            localStorage.removeItem('chat');
          }
        }
      ]
    });

    await alert.present();
  }

  async getModels() {
    const apiUrl = "https://eaa6-143-0-229-172.ngrok-free.app/models";

    try {
      const req = new Request(apiUrl, {
        method: "POST",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({})
      });
      const response = await fetch(req);
      this.models = await response.json()
    } catch (error) {
      console.log(error);
      
    }
  }

  selectModel(ev: any) {    
    this.modeloSelecionado = ev.detail.value
    localStorage.setItem('model', this.modeloSelecionado)
  } 

  cancelar() {}

  triggerImageUpload() {
    const fileInput = document.getElementById('imagemUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // onImageSelected(event: any) {
  //   const file = event.target.files[0];
  //   if (file) {
  //     console.log("Imagem selecionada:", file.name);
  //   }
  // }
}