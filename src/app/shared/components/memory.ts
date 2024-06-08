import { OperationInstruction } from "./operationInstruction";

export class Memory {
    cells: Array<OperationInstruction> = Array<OperationInstruction>();

    addInstruction(instruction: string) {
        this.cells.push(new OperationInstruction(instruction));
    };

    getInstruction(index: number): OperationInstruction | undefined{
        return this.cells[index];
    };
};