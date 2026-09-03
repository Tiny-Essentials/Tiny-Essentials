import TinyPasswordValidator from '../../dist/v1/libs/tools/TinyPasswordValidator.mjs';

const testTinyPasswordValidator = async () => {
  // Exemplo 1: Uso padrão (regras rigorosas)
  const validator = new TinyPasswordValidator();
  const result1 = validator.validate('abc123');
  console.log(result1);
  // { isValid: false, strength: 'Weak', errors: ["A senha deve ter pelo menos 8 caracteres.", ...] }

  // Exemplo 2: Configuração customizada (mais flexível)
  const customValidator = new TinyPasswordValidator({
    requireSpecial: false, // Não exige caracteres especiais
    minLength: 6, // Mínimo de 6 caracteres
    requireUppercase: false, // Não exige maiúsculas
  });

  const result2 = customValidator.validate('senha123');
  console.log(result2);
  // { isValid: true, strength: 'Strong', errors: [] }

  // Exemplo 3: Tratamento de erro de programação
  try {
    customValidator.rules = { minLength: 'muito longo' }; // Isso vai disparar um erro
  } catch (e) {
    console.error(e.name + ': ' + e.message); // TypeError: As propriedades de exigência devem ser booleanas. (ou similar)
  }
};

export default testTinyPasswordValidator;
