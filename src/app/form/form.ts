import { Component } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

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
    this.setupPassengerSync();
    this.setupPriceCalculation();
  }
  
  // Datos para los select
  destinos = ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Bilbao', 'Mallorca'];
  clases = ['Turista', 'Business', 'Primera classe'];
  // datos para la simulacion de correo existente
  correos = ['test@test.com', 'reserva@viajes.com', 'admin@travel.com'];

  searchControl: FormControl = new FormControl('');
  filteredDestinos: string[] = [...this.destinos];
  noResults = false;
  precioTotal = 0;

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
    fechaRegreso: [''],
    tipoViaje: ['Solo ida', Validators.required],
    clase: ['', Validators.required],
    numeroPersonas: [0, [Validators.required, Validators.min(1), Validators.max(10)]],
    pasajeros: this.fb.array([]),
    }, { 
      validators: this.fechaRegreso  //validador cruzado se tiene que declarar aqui
    });
  }
  //funcion para configurar el numero de personas y suscribirse para ajustar pasajeros
  setupPassengerSync(){
    this.reservaFormGroup.get('numeroPersonas')?.valueChanges.subscribe(num => {
      this.adjustPassengers(num);
    });
  }

  //ajustar el numero de pasejeros dependiendo si añade o quita
  adjustPassengers(num: number) {
    const pasajerosArray = this.pasajeros;
    const currentLength = pasajerosArray.length;
    
    if (num > currentLength) {
      // Añadir más pasajeros
      for (let i = currentLength; i < num; i++) {
        this.addPasajero();
      }
    } else if (num < currentLength) {
      // Eliminar pasajeros
      for (let i = currentLength - 1; i >= num; i--) {
        pasajerosArray.removeAt(i);
      }
    }
  }

  get pasajeros(): FormArray {
    return this.reservaFormGroup.get('pasajeros') as FormArray;
  }
  
  // añadir pasajero
  addPasajero() {
    const pasajeroGroup = this.fb.group({
      nombrepasajero:['', [Validators.required, Validators.minLength(3), Validators.pattern(this.nameRegex)]],
      edadpasajero: ['', [Validators.required, Validators.min(1)]],
      relacionTitular: ['', Validators.required],
    });
    this.pasajeros.push(pasajeroGroup); //añade este nuevo pasajero al FormArray.
    //Esto hace que automáticamente aparezca un nuevo input en la UI para que el usuario pueda escribir el nombre del pasajero
  }

  // ELIMINAR UN PASAJERO
  removePasajero(index: number) {
    this.pasajeros.removeAt(index);
  }


  // CONFIGURAR EL FILTRE
  setupSearch() {
    this.searchControl.valueChanges.subscribe(searchTerm => {
      this.filterCountries(searchTerm || '');
    });
  }

  // FILTRAR paises 
  filterCountries(searchTerm: string) {
    if (!searchTerm) {
      this.filteredDestinos = [...this.destinos];
      this.noResults = false;
    } else {
      this.filteredDestinos = this.destinos.filter(destino =>
        destino.toLowerCase().includes(searchTerm.toLowerCase())
      );
      this.noResults = this.filteredDestinos.length === 0;
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
    if (errors['invalidFechaRegreso']) return errors['invalidFechaRegreso'];
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

  //calcula la edad en base a la fecha de nacimiento y la de hoy
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
  //mira si la fecha de salida es posterior a hoy
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

  
  fechaRegreso(control: AbstractControl): ValidationErrors | null {
    const fechaSalida = control.get('fechaSalida');
    const fechaRegreso = control.get('fechaRegreso');

    if (!fechaSalida || !fechaRegreso) return null; // en caso de que los controladores devuelve que no hay error

    const fechaSalidaValue = fechaSalida.value;
    const fechaRegresoValue = fechaRegreso.value;

    if (!fechaSalidaValue || !fechaRegresoValue) return null; // si no hay valor no hay erorres

    const fechaSalidaDate = new Date(fechaSalidaValue);
    const fechaRegresoDate = new Date(fechaRegresoValue);

    if (fechaRegresoDate <= fechaSalidaDate) {
      fechaRegreso.setErrors({ invalidFechaRegreso: 'La fecha de regreso debe ser posterior a la fecha de salida' });
      return { invalidFechaRegreso: true };
    } else {
      const errors = fechaRegreso.errors;
      if (errors) {
        delete errors['invalidFechaRegreso'];
        fechaRegreso.setErrors(Object.keys(errors).length ? errors : null);
      }
    }

    return null;
  }

  correoExistente(email: string): boolean {
    return this.correos.includes(email);
  }

  // Configurar cálculo de precio en tiempo real
  setupPriceCalculation() {
    this.reservaFormGroup.get('clase')?.valueChanges.subscribe(() => {
      this.calcularPrecioTotal();
    });
    
    this.reservaFormGroup.get('numeroPersonas')?.valueChanges.subscribe(() => {
      this.calcularPrecioTotal();
    });
  }

  calcularPrecioTotal() {
    const clase = this.reservaFormGroup.get('clase')?.value;
    const numeroPersonas = this.reservaFormGroup.get('numeroPersonas')?.value || 0;
    let precioPorPersona = 0;
    switch (clase) {
      case 'Turista':
        precioPorPersona = 100;
        break;
      case 'Business':
        precioPorPersona = 200;
        break;
      case 'Primera classe':
        precioPorPersona = 300;
        break;
      default:
        precioPorPersona = 0;
    }
    this.precioTotal = precioPorPersona * numeroPersonas;
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
