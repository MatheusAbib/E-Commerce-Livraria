export type TipoMascara =
  | 'cpf'
  | 'cep'
  | 'telefone'
  | 'telefone-fixo'
  | 'celular'
  | 'cartao'
  | 'cvv'
  | 'validade';

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function aplicarMascara(valor: string, tipo: TipoMascara): string {
  const digitos = somenteDigitos(valor);

  switch (tipo) {
    case 'cpf':
      return digitos
        .slice(0, 11)
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1-$2');

    case 'cep':
      return digitos
        .slice(0, 8)
        .replace(/^(\d{5})(\d)/, '$1-$2');

    case 'telefone':
      return formatarTelefone(digitos, digitos.length > 10);

    case 'telefone-fixo':
      return formatarTelefone(digitos, false);

    case 'celular':
      return formatarTelefone(digitos, true);

    case 'cartao':
      return digitos
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, '$1 ');

    case 'cvv':
      return digitos.slice(0, 4);

    case 'validade':
      return digitos
        .slice(0, 4)
        .replace(/^(\d{2})(\d)/, '$1/$2');

    default:
      return valor;
  }
}

function formatarTelefone(valor: string, celular: boolean): string {
  const digitos = valor.slice(0, celular ? 11 : 10);

  if (!digitos.length) {
    return '';
  }

  if (digitos.length <= 2) {
    return '(' + digitos;
  }

  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  const tamanhoPrefixo = celular ? 5 : 4;

  if (numero.length <= tamanhoPrefixo) {
    return '(' + ddd + ') ' + numero;
  }

  return '(' + ddd + ') '
    + numero.slice(0, tamanhoPrefixo)
    + '-'
    + numero.slice(tamanhoPrefixo);
}
