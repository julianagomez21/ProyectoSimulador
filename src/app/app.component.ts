import { Component } from '@angular/core';
import { PcElements } from './shared/models/enums/pcElements.enum';
import { Status } from './shared/models/enums/status.enum';
import { Instructions, VarInstructions } from './shared/models/enums/instructions.enum';
import { ALU } from './shared/components/ALU';
import { Memory } from './shared/components/memory';
import { GeneralMemory } from './shared/models/generalMemory.model';
import { TaskExecuteService } from './shared/services/task-execute.service';
import { OperationInstruction } from './shared/components/operationInstruction';
import { PswFlags } from './shared/models/pswFlags';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  enteredInstruction: string = '';
  activeElement: PcElements;
  status: Status;
  lastModifiedValue: number = 0;
  nextInstruction: number = 0;
  actual_status:Status = Status.WAITING;
  isInterrupt: number = 0;
  saveInstruction: number = 0;

  PC: number = 0;
  MAR: number = 0;
  MBR: OperationInstruction | undefined;
  IR: OperationInstruction | undefined;
  ALU: ALU = new ALU();
  memory: Memory = new Memory();
  generalMemory: GeneralMemory = new GeneralMemory();
  PSW: PswFlags = new PswFlags();

  constructor(private taskExecuteService:TaskExecuteService) {
    this.status = Status.STOPPED;
    this.activeElement = PcElements.UC;
  }

  loadAndExecuteInstructions() {
    this.status = Status.RUNNING;
    this.actual_status = Status.RUNNING;
    this.saveInstructionMemory();
    this.executeSaveIntructions();
  }

  private saveInstructionMemory() {
    let instruccionesArray = this.enteredInstruction.split('\n');
    instruccionesArray.forEach((instruccion) => {
      this.memory.addInstruction(instruccion);
    });
  }

  private lineForExecute() {
    if (this.actual_status == Status.PAUSED) {
      this.actual_status = Status.RUNNING;
      return true;
    }
    return this.PC < this.memory.cells.length;
  }

  private async executeSaveIntructions() {
    await this.taskExecuteService.timeForExecution(() => {
      this.activeElement = PcElements.PC;
    })
    await this.taskExecuteService.timeForExecution(() => {
      this.activeElement = PcElements.MAR;
    })
    await this.taskExecuteService.timeForExecution(() => {
      this.MAR = this.PC;
    })
    await this.taskExecuteService.timeForExecution(() => {
      this.activeElement = PcElements.ADDRESS_BUS;
    })
    await this.taskExecuteService.timeForExecution(() => {
      this.activeElement = PcElements.CONTROL_BUS;
    })
    await this.taskExecuteService.timeForExecution(() => {
      this.activeElement = PcElements.MEMORY;
    })
    await this.taskExecuteService.timeForExecution(() => {
      this.activeElement = PcElements.DATA_BUS;
    })
    await this.taskExecuteService.timeForExecution(() => {
      this.activeElement = PcElements.MBR;
    })
    await this.taskExecuteService.timeForExecution(() => {
      this.MBR = this.memory.getInstruction(this.PC);
    })
    await this.taskExecuteService.timeForExecution(() => {
      this.activeElement = PcElements.IR;
    })
    await this.taskExecuteService.timeForExecution(() => {
      this.IR = this.MBR;
    })
    await this.taskExecuteService.timeForExecution(() => {
      this.activeElement = PcElements.UC;
    })
    await this.taskExecuteService.timeForExecution(async () => {
      await this.instructionExecute();
    })
    await this.taskExecuteService.timeForExecution(() => {
      this.activeElement = PcElements.UC;
    })
    if (this.lineForExecute()) {
      this.PC++;
      if (this.status === Status.STOPPED) {
        return; 
      }
      this.executeSaveIntructions();
    } else {      
      if (this.actual_status == Status.PAUSED) {
        this.PC = this.generalMemory.I;
        this.actual_status = Status.RUNNING;
        this.executeSaveIntructions();
      } else {
        this.status = Status.STOPPED;
      }  
    }
  }

  private async instructionExecute(): Promise<void> {
    if (this.IR == undefined) {
      return;
    }

    const operation = this.IR?.operation;
    const firstOperand: number | VarInstructions| undefined = this.IR?.firstOperand;
    const secondOperant: number | VarInstructions| undefined = this.IR?.secondOperand;
    const thirdOperand: number | VarInstructions| undefined = this.IR?.thirdOperand;

    if (Number.isNaN(firstOperand) || Number.isNaN(secondOperant) ||Number.isNaN(thirdOperand)) {
      this.PSW.invalidRegister = true;
      this.stopExecution();
      this.IR.setStatus(Status.FINISHED);
      return;
    }
    
    switch (operation) {
      case Instructions.LOAD:
        await this.executeInstructionLoad(firstOperand, secondOperant);
        break;
      case Instructions.ADD:
        await this.executeMatematicInstruction(Instructions.ADD, secondOperant, thirdOperand, firstOperand);
        break;
      case Instructions.SUB:
        await this.executeMatematicInstruction(Instructions.SUB, secondOperant, thirdOperand, firstOperand);
        break;
      case Instructions.MUL:
        await this.executeMatematicInstruction(Instructions.MUL, secondOperant, thirdOperand, firstOperand);
        break;
      case Instructions.DIV:
        await this.executeMatematicInstruction(Instructions.DIV, secondOperant, thirdOperand, firstOperand);
        break;
      case Instructions.INC:
        await this.executeMatematicInstruction(Instructions.INC, firstOperand,0, firstOperand);
        break;
      case Instructions.DEC:
        await this.executeMatematicInstruction(Instructions.DEC, firstOperand,0, firstOperand);
        break;
      case Instructions.STOP:
        this.isInterrupt++;
        if (this.isInterrupt == 2) {
          this.PC = this.generalMemory.I;
          this.recoverRegisters();
        } else if (this.isInterrupt == 3){
          this.stopExecution();
        }
        break;
      default:
        this.stopExecution();
        this.PSW.invalidOperation = true;
        break;
    }
    this.IR.setStatus(Status.FINISHED);
  }
  
  private async executeInstructionLoad(varToSave: number | VarInstructions| undefined, number: number | VarInstructions| undefined): Promise<void> {
    if (varToSave == undefined || number == undefined) {
      return;
    }
    await this.taskExecuteService.timeForExecution(() => {
      this.activeElement = PcElements.GENERAL_MEMORY;
    })

    await this.taskExecuteService.timeForExecution(() => {
      
      switch(varToSave) {
        case VarInstructions.A:
          this.generalMemory.A = number;      
          break;
        case VarInstructions.B:
          this.generalMemory.B = number;
          break;
        case VarInstructions.C:
          this.generalMemory.C = number;
          break;
        case VarInstructions.D:
          this.generalMemory.D = number;
          break;
        case VarInstructions.E:
          this.generalMemory.E = number;
          break;
        case VarInstructions.F:
          this.generalMemory.F = number;
          break;
        case VarInstructions.G:
          this.generalMemory.G = number;
          break;
        case VarInstructions.H:
          this.generalMemory.H = number;
          break;
        default:
          break;
      }
      this.IR?.setStatus(Status.FINISHED);
    })  
  }

  private async executeMatematicInstruction(operationType: Instructions, primeraVariable: number | VarInstructions| undefined, segundaVariable: number | VarInstructions| undefined, variableDestino: number | VarInstructions| undefined): Promise<void> {
    if (primeraVariable == undefined || segundaVariable == undefined) {
      return;
    }
    switch(variableDestino) {
      case VarInstructions.A:
        this.generalMemory.A = await this.executeAluOperation(operationType, primeraVariable, segundaVariable);
        break;
      case VarInstructions.B:
        this.generalMemory.B = await this.executeAluOperation(operationType, primeraVariable, segundaVariable);
        break;
      case VarInstructions.C:
        this.generalMemory.C = await this.executeAluOperation(operationType, primeraVariable, segundaVariable);
        break;
      case VarInstructions.D:
        this.generalMemory.D = await this.executeAluOperation(operationType, primeraVariable, segundaVariable);
        break;
      case VarInstructions.E:
        this.generalMemory.E = await this.executeAluOperation(operationType, primeraVariable, segundaVariable);
        break;
      case VarInstructions.F:
        this.generalMemory.F = await this.executeAluOperation(operationType, primeraVariable, segundaVariable);
        break;
      case VarInstructions.G:
        this.generalMemory.G = await this.executeAluOperation(operationType, primeraVariable, segundaVariable);
        break;
      case VarInstructions.H:
        this.generalMemory.H = await this.executeAluOperation(operationType, primeraVariable, segundaVariable);
        break;
      default:
        break;
    }
    let valueToSave = variableDestino == undefined ? 0 : this.getValueGeneralMemory(variableDestino);
    this.lastModifiedValue = valueToSave;
    this.IR?.setStatus(Status.FINISHED);

    if (this.lastModifiedValue < 0) {
      this.PSW.sign = true;
    } else {
      this.PSW.sign = false;
    }
  }

  private async executeAluOperation(operation: Instructions, firstOperand: number | VarInstructions| undefined, secondOperant: number | VarInstructions| undefined): Promise<number> {
    if (firstOperand == undefined || secondOperant == undefined) {
      return 0;
    }
    await this.taskExecuteService.timeForExecution(() => {
      this.activeElement = PcElements.ALU;
    })
    await this.taskExecuteService.timeForExecution(() => {
      this.activeElement = PcElements.GENERAL_MEMORY;
    })
    const firstnumber = this.getValueGeneralMemory(firstOperand);
    const secondNumber = this.getValueGeneralMemory(secondOperant);
    const resultOperation = this.ALU.executeOperation(operation, firstnumber, secondNumber);
    return resultOperation;
  }

   getValueGeneralMemory(getToVar: number | VarInstructions| undefined) {
    if (getToVar == undefined) {
      return 0;
    }
    switch(getToVar) {
      case VarInstructions.A:
        return this.generalMemory.A;
      case VarInstructions.B:
        return this.generalMemory.B;
      case VarInstructions.C:
        return this.generalMemory.C;
      case VarInstructions.D:
        return this.generalMemory.D;
      case VarInstructions.E:
        return this.generalMemory.E;
      case VarInstructions.F:
        return this.generalMemory.F;
      case VarInstructions.G:
        return this.generalMemory.G;
      case VarInstructions.H:
        return this.generalMemory.H;
      default:
        return 0;
    }
  }

  get enableExecuteButton(): boolean {
    return this.status == Status.STOPPED;
  }

  get enablePauseButton(): boolean {
    return this.status == Status.RUNNING;
  }

  get enableContinueButton(): boolean {
    return this.status == Status.PAUSED;
  }

  get ucIsActive(): boolean {
    return this.activeElement == PcElements.UC;
  }

  get memoryIsActive(): boolean {
    return this.activeElement == PcElements.MEMORY;
  }

  get aluIsActive(): boolean {
    return this.activeElement == PcElements.ALU;
  }

  get generalMemoryIsActive(): boolean {
    return this.activeElement == PcElements.GENERAL_MEMORY;
  }

  get pcIsActive(): boolean {
    return this.activeElement == PcElements.PC;
  }

  get marIsActive(): boolean {
    return this.activeElement == PcElements.MAR;
  }

  get mbrIsActive(): boolean {
    return this.activeElement == PcElements.MBR;
  }

  get irIsActive(): boolean {
    return this.activeElement == PcElements.IR;
  }

  get dataBusIsActive(): boolean {
    return this.activeElement == PcElements.DATA_BUS;
  }

  get addressBusIsActive(): boolean {
    return this.activeElement == PcElements.ADDRESS_BUS;
  }

  get controlBusIsActive(): boolean {
    return this.activeElement == PcElements.CONTROL_BUS;
  }

  get pswIsActive(): boolean {
    return this.activeElement == PcElements.PSW;
  }

  stopExecution() {
    this.status = Status.STOPPED;
  }

  pauseExecution() {
    this.stopExecution();
    this.PSW.interrupt = true;
    
    if (this.IR?.status == Status.FINISHED) {
      this.generalMemory.I = (this.PC + 1) - 2;
    } else {
      this.IR?.setStatus(Status.PAUSED);
      this.generalMemory.I = this.PC - 2;
    }

    this.saveInstruction = this.generalMemory.I + 2;
    this.nextInstruction = this.memory.cells.length - 1;
    this.PC = this.nextInstruction;
    this.actual_status = Status.PAUSED;
    this.duplicateRegisters();
  }

  duplicateRegisters() {
    if (this.generalMemory.A != 0) {
      this.generalMemory.AX = this.generalMemory.A;
    }

    if (this.generalMemory.B != 0) {
      this.generalMemory.BX = this.generalMemory.B;
    }

    if (this.generalMemory.C != 0) {
      this.generalMemory.CX = this.generalMemory.C;
    }

    if (this.generalMemory.D != 0) {
      this.generalMemory.DX = this.generalMemory.D;
    }

    if (this.generalMemory.E != 0) {
      this.generalMemory.EX = this.generalMemory.E;
    }

    if (this.generalMemory.F != 0) {
      this.generalMemory.FX = this.generalMemory.F;
    }

    if (this.generalMemory.G != 0) {
      this.generalMemory.GX = this.generalMemory.G;
    }

    if (this.generalMemory.H != 0) {
      this.generalMemory.HX = this.generalMemory.H;
    }
  }

  recoverRegisters() {
    this.generalMemory.A = this.generalMemory.AX;
    this.generalMemory.B = this.generalMemory.BX;
    this.generalMemory.C = this.generalMemory.CX;
    this.generalMemory.D = this.generalMemory.DX;
    this.generalMemory.E = this.generalMemory.EX;
    this.generalMemory.F = this.generalMemory.FX;
    this.generalMemory.G = this.generalMemory.GX;
  }

  get enableStopButton(): boolean {
    return this.status === Status.RUNNING;
  } 
  
}
