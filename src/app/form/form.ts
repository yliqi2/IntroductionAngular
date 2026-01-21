import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

@Component({
  selector: 'app-form',
  imports: [ReactiveFormsModule],
  templateUrl: './form.html',
  styleUrl: './form.css',
})
export class Form {
  constructor(private fb: FormBuilder) {
    this.createForm();
    this.setupSearch();
  }
  
  // Datos para los select
  destinos = ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Bilbao', 'Mallorca'];
  clases = ['Turista', 'Business', 'Primera classe'];

  searchControl: FormControl = new FormControl('');
  filteredDestinos: string[] = [...this.destinos];


  reservaFormGroup!: FormGroup;
  //funcion para crear formcontrols
  createForm() {
    this.reservaFormGroup = this.fb.group({
    nombrecompleto: ['', [Validators.required, Validators.minLength(3), Validators.pattern(this.nameRegex)]],
    dni: ['', [Validators.required, this.dniValidator]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(this.phoneRegex)]],
    fnacimiento: ['', [Validators.required, this.edadValidator]],
    aceptarTerminos: [false, [Validators.requiredTrue]],
    newsletter: [false],
    
    // Campos de información del viaje
    destino: ['', Validators.required],
    fechaSalida: ['', [Validators.required, this.fechaSalidaPosteriorAHoy]],
    fechaRegreso: ['', Validators.required],
    tipoViaje: ['Solo ida', Validators.required],
    clase: ['', Validators.required],
    numeroPersonas: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
    });
  }

  // CONFIGURAR EL FILTRE
  setupSearch() {
    this.searchControl.valueChanges.subscribe(searchTerm => {
      this.filterCountries(searchTerm || '');
    });
  }

  // FILTRAR PAÏSOS
  filterCountries(searchTerm: string) {
    if (!searchTerm) {
      this.filteredDestinos = [...this.destinos];
    } else {
      this.filteredDestinos = this.destinos.filter(destino =>
        destino.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }


  // Expresiones regulares para validación
  nameRegex = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð\s]+$/;
  phoneRegex = /^[679]\d{8}$/;



  isFieldValid(fieldname: string): boolean {
    const control = this.reservaFormGroup.get(fieldname);
    return !!(control && control.invalid && control.touched);
  }

  isFieldTouched(fieldname: string): boolean {
    const control = this.reservaFormGroup.get(fieldname);
    return !!(control && control.touched);
  }

  isFieldValidAndTouched(fieldname: string): boolean {
    const control = this.reservaFormGroup.get(fieldname);
    return !!(control && control.valid && control.touched);
  }

  getErrorMessage(fieldname: string): string {
    const control = this.reservaFormGroup.get(fieldname);
    if (!control || !control.errors) return '';

    const errors = control.errors;

    if (errors['required']) return 'Este campo es obligatorio';
    if (errors['requiredTrue']) return 'Debes aceptar los términos y condiciones';
    if (errors['email']) return 'Formato de email inválido';
    if (errors['invalidDni']) return errors['invalidDni'];
    if (errors['invalidAge']) return errors['invalidAge'];
    if (errors['invalidFechaSalida']) return errors['invalidFechaSalida'];
    if (errors['min']) return `El valor mínimo es ${errors['min'].min}`;
    if (errors['max']) return `El valor máximo es ${errors['max'].max}`;
    if (errors['minlength']) return `La longitud mínima es ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `La longitud máxima es ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['pattern']) return 'Formato inválido';

    return 'Error de validación';
  }

  dniValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.toUpperCase(); 

    if (!value) return null;

    // Validar formato DNI o NIE
    const dniNieRegex = /^[0-9XYZ][0-9]{7}[A-Z]$/;
    if (!dniNieRegex.test(value)) {
      return { invalidDni: 'Format invàlid. Ha de ser 8 números + lletra (DNI) o X/Y/Z + 7 números + lletra (NIE)' };
    }

    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    let numeroStr = value.substring(0, 8);
    
    // Si comienza con X, Y o Z (NIE), reemplazar por su equivalente numérico
    if (/^[XYZ]/.test(numeroStr)) {
      numeroStr = numeroStr.replace('X', '0').replace('Y', '1').replace('Z', '2');
    }
    
    const numero = parseInt(numeroStr);
    const letraCalculada = letras[numero % 23];
    const letraIntroducida = value.substring(8);

    if (letraCalculada !== letraIntroducida) {
      return { invalidDni: 'La lletra del DNI/NIE no és correcta' };
    }
    return null;
  }

  edadValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const fechaNacimiento = new Date(value);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    if (edad < 18) {
      return { invalidAge: 'Debes ser mayor de 18 años' };
    }
    return null;
  }

  fechaSalidaPosteriorAHoy(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const fechaSalida = new Date(value);
    const hoy = new Date();
    if (fechaSalida < hoy) {
      return { invalidFechaSalida: 'La fecha de salida debe ser posterior a hoy' };
    }
    return null;
  }



  onSubmit() {
    if (this.reservaFormGroup.valid) {
      console.log('Datos de la reserva completa:', this.reservaFormGroup.value);
    }
  }

  onReset() {
    this.reservaFormGroup.reset({ numeroPersonas: 1 });
  }


}
