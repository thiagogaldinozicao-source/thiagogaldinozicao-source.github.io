// Pergunta com opções: [[OPCOES: ...]] vira botões (campo opcoes) e texto simples na conversa
const H = require('./harness');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const resp = t => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ choices: [{ message: { content: t } }] }) });
let sys = '', devolve = '';
H.setFetch((u, o) => { if (typeof (o || {}).payload === 'string') { const b = JSON.parse(o.payload); if (b.messages) { sys = b.messages[0].content; return resp(devolve); } } return resp('ok'); });
const chat = t => H.post({ pin: '1234', acao: 'chat', capricho: false, mensagens: [{ role: 'user', content: t }] });

devolve = 'O disco tá cheio pra treinar no PC.\n[[OPCOES: Onde vamos treinar? || Google Colab (recomendado) :: grátis, usa a placa da Google || Liberar espaço no PC :: vc apaga uns 20 GB || Mac Mini :: mais lento]]';
let r = chat('bora treinar a ia');
ok(/PERGUNTA COM OPÇÕES/.test(sys) && /\[\[OPCOES:/.test(sys), 'sistema ensina quando e como perguntar com opções');
ok(r.opcoes && r.opcoes.pergunta === 'Onde vamos treinar?' && r.opcoes.opcoes.length === 3, 'resposta traz as opções pro app');
ok(r.opcoes.opcoes[0].rotulo === 'Google Colab (recomendado)' && r.opcoes.opcoes[0].descricao === 'grátis, usa a placa da Google', 'rótulo e descrição separados, recomendada primeiro');
ok(!/\[\[/.test(r.resposta) && /\*\*Onde vamos treinar\?\*\*\n1\. Google Colab \(recomendado\) — grátis/.test(r.resposta), 'texto da conversa vira lista simples (Telegram e conversa antiga)');
ok(r.passos.some(p => /pergunta com 3 opções/.test(p)), 'Como respondi mostra a pergunta');
const ultima = H.sheets.mensagens.rows[H.sheets.mensagens.rows.length - 1];
ok(/1\. Google Colab/.test(ultima[3]) && !/\[\[OPCOES/.test(ultima[3]), 'planilha guarda o texto simples, sem a marcação');

devolve = 'Vou fazer assim.\n[[OPCOES: Qual? || Só uma opção :: nada]]';
r = chat('faz');
ok(!r.opcoes && !/\[\[/.test(r.resposta), 'com só 1 opção não vira botão e a marcação some');

devolve = 'Resposta normal sem pergunta.';
r = chat('oi');
ok(r.opcoes === undefined, 'resposta comum não traz opcoes');
