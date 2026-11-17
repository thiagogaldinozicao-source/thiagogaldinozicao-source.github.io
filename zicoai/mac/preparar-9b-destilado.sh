#!/bin/bash
# ZicoAI: prepara o Qwen 9B destilado no Mac sem alterar o cérebro publicado.
# Execução manual: bash zicoai/mac/preparar-9b-destilado.sh
set -u
MODELO='hf.co/Jackrong/Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF:Q4_K_M'
RESERVA='qwen3:8b'
echo '=== ZicoAI: preparação segura do Mac ==='
if [ "$(uname -s)" != Darwin ]; then echo 'Este instalador exige macOS.'; exit 1; fi
if ! command -v ollama >/dev/null 2>&1; then echo 'Ollama não encontrado. Instale/inicie o Ollama antes de continuar.'; exit 1; fi
if ! ollama list >/dev/null 2>&1; then echo 'Ollama não está respondendo. Abra o aplicativo Ollama e repita.'; exit 1; fi
echo 'Modelos atuais:'; ollama list
echo 'RAM instalada:'; sysctl -n hw.memsize | awk '{printf "%.1f GB\n", $1/1073741824}'
echo 'Espaço disponível no diretório pessoal:'; df -h "$HOME" | tail -1
if ! ollama list | grep -Fq "$RESERVA"; then
  echo 'AVISO: 8B reserva não aparece instalado. Não será removido nenhum modelo.'
fi
if ! ollama list | grep -Fq "$MODELO"; then
  echo
  echo "Modelo a baixar: $MODELO"
  echo 'Ele usa vários GB de armazenamento. A instalação é opcional e preserva os outros modelos.'
  printf 'Confirmar download do 9B? Digite SIM: '
  read -r resposta
  if [ "$resposta" != SIM ]; then echo 'Cancelado; nenhuma configuração foi alterada.'; exit 0; fi
  ollama pull "$MODELO" || { echo 'Falhou o download. Modelo atual preservado.'; exit 1; }
fi
echo
echo 'Teste rápido do 9B:'
ollama run "$MODELO" 'Responda somente: ZicoAI 9B pronto' || { echo 'Modelo instalado mas teste falhou; mantenha o 8B como principal.'; exit 1; }
echo
echo 'Concluído. Nenhum modelo foi apagado e MAC_MODELO não foi modificado.'
echo 'Próximo passo: atualizar a ponte mac-2.1, executar o duelo 9B x 8B e só então promover o vencedor.'
