import { Instructions } from "../models/enums/instructions.enum";

export class ALU {
    executeToOperation?: Instructions;
    firstOperand?: number;
    secondOperand?: number;

    executeOperation(typeOperation: Instructions, firstOperand: number, secondOperand: number) {
        this.executeToOperation = typeOperation;
        this.firstOperand = firstOperand;
        this.secondOperand = secondOperand;
        switch (typeOperation) {
            case Instructions.ADD:
                return this.add(firstOperand, secondOperand);
            case Instructions.SUB:
                return this.sub(firstOperand, secondOperand);
            case Instructions.MUL:
                return this.mul(firstOperand, secondOperand);
            case Instructions.DIV:
                return this.div(firstOperand, secondOperand);
            case Instructions.INC:
                return this.inc(firstOperand);
            case Instructions.DEC:
                return this.dec(firstOperand);
            default:
                return 0;
        }
    }

    add(firstOperand: number, secondOperand: number) {
        return firstOperand + secondOperand;
    }

    sub(firstOperand: number, secondOperand: number) {
        return firstOperand - secondOperand;
    }

    mul(firstOperand: number, secondOperand: number) {
        return firstOperand * secondOperand;
    }

    div(firstOperand: number, secondOperand: number) {
        return firstOperand / secondOperand;
    }

    inc(firstOperand: number) {
        return firstOperand + 1;
    }

    dec(firstOperand: number) {
        return firstOperand - 1;
    }
}