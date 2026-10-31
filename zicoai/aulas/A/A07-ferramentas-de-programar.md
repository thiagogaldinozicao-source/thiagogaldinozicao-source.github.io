# A07: ferramentas de programar (VS Code, Claude Code e companhia)

**Regra:** Pra construir e consertar: Claude Code (nuvem ou PC). Pra editar e testar no PC: VS Code + Live Server. Extensões com IA dentro do VS Code (Continue, Cline) são opcionais e usam modelos mais fracos. A ZicoAI é a "funcionária"; o Claude Code é quem "conserta e melhora" ela.
**Palavras-chave:** vs code, vscode, extensão, continue, cline, claude code, live server, terminal, editor, programar no pc, github, onde programar

## O que cada uma faz (como foi explicado ao Thiago)
- **Claude Code** (dentro do app do Claude, aba Code):
  - **na nuvem**: escolhe o repositório do GitHub (ex.: `thiagogaldinozicao-source.github.io`); funciona com o PC desligado, dá pra pedir pelo celular;
  - **no PC**: escolhe a pasta do projeto; lê e edita os arquivos de lá.
  - Pede do jeito que fala com o Claude: "na pasta zicoai, põe um botão de microfone no app".
- **VS Code + Live Server**: abrir o projeto e testar app com Supabase/PWA num servidor local.
- **Continue** (extensão do VS Code): liga no Ollama do PC; lê o arquivo aberto, sugere mudança e completa código. Grátis, mas usa o modelo do PC.
- **Cline** (extensão do VS Code): mostra o que vai mudar e você aprova clicando; dá pra usar com Groq ou Ollama, grátis.
- Ferramentas de terminal parecidas com o Claude Code (Codex, OpenCode, Qwen Code etc.): fazem a mesma coisa; não precisa de todas.
- Agentes que mexem sozinhos em apps de mensagem: **não ligar no WhatsApp da loja** (risco de ban).

## Por que não a ZicoAI construindo a si mesma (ainda)
Projeto com várias partes que precisam encaixar (planilha, script, app, segurança das chaves): modelo de 8B, e até o de 35B, se perde em tarefa grande. Ela faz ajustes pequenos; o Claude Code faz o grosso. O caminho pra ela fazer mais está no curso (D16).

## Lições
1. Ferramenta certa pro tamanho da tarefa.
2. Modelo fraco dentro do editor ajuda no pequeno, atrapalha no grande.
3. Nunca automação não oficial no WhatsApp da loja.
