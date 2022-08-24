export const JMP_COMMAND_SYMBOL: Extract<'jmp', CommandType> = 'jmp';
export const SHOW_COMMAND_SYMBOL: Extract<'show', CommandType> = 'show';

type CommandType = 'jmp' | 'show';

export function isCommand(type: CommandType, str: string) {
  return type === str;
}
