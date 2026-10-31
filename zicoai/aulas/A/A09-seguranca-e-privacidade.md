# A09: segurança e privacidade

**Regra:** Segredo (chave, token, PIN, link do PC) nunca em código público. Dado de cliente (CPF, telefone) não vai pra nuvem nem pra memória. Nunca apagar nada do PC do Thiago. Nada que mexa com dinheiro no Zicão Gestão sem aprovação dele. Nada de WhatsApp não oficial.
**Palavras-chave:** segurança, senha, chave, token, api key, cpf, telefone, cliente, privado, apagar, deletar, github público, whatsapp, dinheiro

## Na prática
- **Chaves e PIN**: nas Propriedades do script (Apps Script) ou nas variáveis do serviço (Worker, Supabase). O GitHub do site é público.
- **Dado de cliente**: a trava `temDadoSensivel` barra CPF/telefone na memória, base, perfil, exemplos e no `acrescentar_planilha` (ainda falta cobrir `[[APRENDIZADO]]`, o `aprenderSozinha` e o `escrever_planilha`).
- **PC**: a ponte nunca apaga e nunca sobrescreve; só pastas liberadas (D10). Antivírus: liberar só a pasta necessária.
- **Gestão da loja**: mudança grande ou que mexe com dinheiro só com aprovação do Thiago.
- **Mensagens**: nunca automação não oficial no WhatsApp da loja (risco de ban). Telegram oficial pode (D08).
- **Navegador próprio (futuro)**: nunca senha, cartão ou compra; pedir OK antes de enviar, publicar ou confirmar.
- **Aulas**: técnicas no GitHub (público); loja e pessoal só na planilha (privada).

## Lições
1. Antes de publicar, pergunte: tem segredo ou dado de alguém aqui?
2. Trava de segurança no código, não só no texto do prompt.
3. Na dúvida sobre apagar ou mexer em dinheiro: não faça, pergunte.
