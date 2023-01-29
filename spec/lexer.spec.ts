import { lex } from "../src/lib/lexer";
import { Token, TokenType } from "../src/lib/types";



test('Define variable', () => {
    const lexOut = lex('a = 0d1;');
    
    let next = lexOut.next();
    expect(next.done).toBeFalsy();

    const aToken = next.value;
    expect(aToken).toBeInstanceOf(Token);
    expect(aToken.literal).toBe('a');
    expect(aToken.type).toBe(TokenType.SYMBOL);

    next = lexOut.next();
    expect(next.done).toBeFalsy();

    const equalToken = next.value;
    expect(equalToken).toBeInstanceOf(Token);
    expect(equalToken.literal).toBe('=');
    expect(equalToken.type).toBe(TokenType.ASSIGN);

    next = lexOut.next();
    expect(next.done).toBeFalsy();

    const numberToken = next.value;
    expect(numberToken).toBeInstanceOf(Token);
    expect(numberToken.literal).toBe('0d1');
    expect(numberToken.type).toBe(TokenType.NUMBER);

    next = lexOut.next();
    expect(next.done).toBeFalsy();

    const semicolonToken = next.value;
    expect(semicolonToken).toBeInstanceOf(Token);
    expect(semicolonToken.literal).toBe(';');
    expect(semicolonToken.type).toBe(TokenType.LINE_TERMINATOR);
});

test('Define variable without ";"', () => {
    const lexOut = lex('a = 0d1');
    
    let next = lexOut.next();
    expect(next.done).toBeFalsy();

    const aToken = next.value;
    expect(aToken).toBeInstanceOf(Token);
    expect(aToken.literal).toBe('a');
    expect(aToken.type).toBe(TokenType.SYMBOL);

    next = lexOut.next();
    expect(next.done).toBeFalsy();

    const equalToken = next.value;
    expect(equalToken).toBeInstanceOf(Token);
    expect(equalToken.literal).toBe('=');
    expect(equalToken.type).toBe(TokenType.ASSIGN);

    next = lexOut.next();
    expect(next.done).toBeFalsy();

    const numberToken = next.value;
    expect(numberToken).toBeInstanceOf(Token);
    expect(numberToken.literal).toBe('0d1');
    expect(numberToken.type).toBe(TokenType.NUMBER);

    next = lexOut.next();
    expect(next.done).toBeTruthy();
});

test('Define variable with invalid number', () => {
    const lexOut = lex('a = 0d1a');
    
    let next = lexOut.next();
    expect(next.done).toBeFalsy();

    const aToken = next.value;
    expect(aToken).toBeInstanceOf(Token);
    expect(aToken.literal).toBe('a');
    expect(aToken.type).toBe(TokenType.SYMBOL);

    next = lexOut.next();
    expect(next.done).toBeFalsy();

    const equalToken = next.value;
    expect(equalToken).toBeInstanceOf(Token);
    expect(equalToken.literal).toBe('=');
    expect(equalToken.type).toBe(TokenType.ASSIGN);

    expect(lexOut.next).toThrow();
})