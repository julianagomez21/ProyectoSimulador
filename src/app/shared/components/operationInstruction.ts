import {
  Instructions,
  VarInstructions,
} from '../models/enums/instructions.enum';
import { Status } from '../models/enums/status.enum';

export class OperationInstruction {
  operation: Instructions | undefined;
  firstOperand: number | VarInstructions | undefined;
  secondOperand: number | VarInstructions | undefined;
  thirdOperand: number | VarInstructions | undefined;
  instructionText: string;
  status: Status;

  constructor(instructionText: string) {
    this.instructionText = instructionText;
    this.status = Status.WAITING;
    this.segmentInstruction();
  }

  segmentInstruction() : void {
    let instructionArray = this.instructionText.split(' ');
    this.operation = this.getOperation(instructionArray[0]);

    if (instructionArray[1] != undefined) {
      let instructionOperands = instructionArray[1].split(',');
      this.firstOperand = this.getOperand(instructionOperands[0]);
      this.secondOperand = this.getOperand(instructionOperands[1]);
      this.thirdOperand = this.getOperand(instructionOperands[2]);
    }
  }

  getOperation(operation: string) {
    switch (operation.toUpperCase()) {
      case 'LOAD':
        return Instructions.LOAD;
      case 'STOP':
        return Instructions.STOP;
      case 'ADD':
        return Instructions.ADD;
      case 'SUB':
        return Instructions.SUB;
      case 'MUL':
        return Instructions.MUL;
      case 'DIV':
        return Instructions.DIV;
      case 'INC':
        return Instructions.INC;
      case 'DEC':
        return Instructions.DEC;
      default:
        return undefined;
    }
  }

  getOperand(operand: string) {
    if (operand === undefined) {
      return undefined;
    }
    switch (operand?.toUpperCase()) {
      case 'A':
        return VarInstructions.A;
      case 'B':
        return VarInstructions.B;
      case 'C':
        return VarInstructions.C;
      case 'D':
        return VarInstructions.D;
      case 'E':
        return VarInstructions.E;
      case 'F':
        return VarInstructions.F;
      case 'G':
        return VarInstructions.G;
      case 'H':
        return VarInstructions.H;
      default:
        return Number(operand);
    }
  }

  setStatus(status: Status) {
    this.status = status;
  }

  toString() {
    return this.instructionText;
  }
}
