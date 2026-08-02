# Rede Conecta — Modelo Operacional Canônico

## 1. Princípio central

A plataforma não é um conjunto de painéis independentes. Ela opera uma única jornada comercial:

**Produto → apresentação rastreável → conexão → SDR → distribuição → atendimento → negócio → validação → receitas, recompensas e comissões → pagamento.**

Todas as telas são projeções dessa mesma operação. Nenhum módulo deve manter status, responsável ou valor econômico paralelo ao registro principal.

## 2. Entidades oficiais

### Produto
Oferta comercial promovida pela rede. Armazena categoria, conteúdo, parceiro, condições, receita interna da Rede Conecta e requisitos de treinamento.

### Campanha
Regra de distribuição de um produto: mensagem, validade, recompensa, materiais e jornada pública.

### Conexão
Registro imutável da origem comercial. Liga contato, conector, produto, campanha, canal, SDR, responsável humano, proteção e linha do tempo.

### Atendimento SDR
Qualificação preliminar da conexão. Produz score, resumo, necessidade, objeção e recomendação. Não bloqueia a autonomia administrativa para distribuir.

### Distribuição
Atribuição de uma conexão a um especialista. Pode ocorrer em qualquer etapa. Toda redistribuição encerra o vínculo anterior, cria o novo vínculo, notifica as partes e mantém auditoria.

### Negócio
Registro da oportunidade econômica vinculada à conexão. A venda informada pelo especialista não é venda validada. A validação pertence à gestão da Rede Conecta.

### Livro financeiro
Fonte única de expectativas e movimentos financeiros: receita da Rede Conecta, recompensa do conector, comissão do especialista, pagamentos, estornos e ajustes.

## 3. Papéis e centros

### Conector
- apresenta pessoas e oportunidades;
- acompanha contato, canal, produto, responsável e andamento permitido;
- recebe notificações de avanço;
- acompanha recompensa prevista, aprovada, programada e paga;
- não acessa anotações internas, análise financeira detalhada ou documentos confidenciais.

Centro oficial: `/painel/conector`.

### Especialista comercial
Inclui corretor de imóveis, vendedor de veículos, consultor de energia, seguros, consórcio e demais profissionais.

- recebe atendimentos atribuídos;
- consulta contato autorizado, origem e briefing SDR;
- aceita atendimento;
- atualiza etapas e próxima ação;
- informa venda para validação;
- acompanha produtos autorizados, treinamento, regra de comissão, expectativa, vencimento e pagamentos.

Centro oficial: `/painel/especialista`.

### Gestão da Rede Conecta
- cadastra produtos, parceiros e profissionais;
- conduz ou supervisiona SDR;
- distribui e redistribui em qualquer etapa;
- valida vendas;
- define receita da Rede Conecta e comissões;
- concilia recebimentos e pagamentos;
- audita origem, operação e finanças.

Centros oficiais:
- Visão executiva: `/painel`
- SDR e distribuição: `/painel/sdr`
- Produtos: `/painel/catalogo`
- Pessoas e acessos: `/painel/acessos`
- Controladoria: `/painel/financeiro`

### Parceiro
Acompanha apenas informações autorizadas de seus produtos, resultados e conciliação. Não recebe acesso irrestrito aos dados dos conectores ou à operação interna.

## 4. Regras de coerência

1. Uma distribuição atualiza imediatamente a carteira do especialista.
2. O especialista vê todas as conexões em que é `assigned_operator_id` ou `assigned_broker_id`.
3. O SDR e a distribuição são ações independentes e simultaneamente visíveis.
4. O conector de origem nunca é substituído pelo especialista ou parceiro.
5. Venda informada e venda validada são estados distintos.
6. Percentuais e valores econômicos são fotografados no negócio para impedir alteração retroativa.
7. Toda venda validada atualiza conexão, notificações, expectativas financeiras e auditoria.
8. Todo pagamento atualiza o livro financeiro e a carteira de quem recebe.
9. Profissão e permissão são conceitos separados. CRECI é exigido apenas quando aplicável.
10. Nenhum card estatístico deve existir sem navegação para a informação que o compõe.

## 5. Fluxo operacional

1. O conector compartilha ou registra uma apresentação.
2. O contato autoriza o atendimento.
3. A conexão é criada com origem e proteção.
4. A gestão pode iniciar o SDR ou distribuir imediatamente.
5. O SDR registra qualificação e recomendação.
6. A gestão atribui ou redistribui o atendimento.
7. O especialista recebe notificação e a conexão aparece em seu pipeline.
8. O especialista aceita, registra contatos, reuniões e propostas.
9. O especialista informa a venda.
10. A gestão valida ou rejeita a venda.
11. O sistema cria receitas, recompensa e comissão conforme as regras fotografadas.
12. A controladoria registra recebimentos e pagamentos.
13. Conector e especialista recebem as notificações econômicas correspondentes.

## 6. Segurança econômica

- origem protegida e auditável;
- histórico de responsáveis;
- regra econômica por produto e por especialista;
- separação entre previsão, obrigação e caixa realizado;
- conciliação de vendas e pagamentos;
- notificações de venda informada, validada, cancelada e paga;
- possibilidade de contestação e revisão administrativa;
- logs de usuário, data, valor anterior, valor novo e justificativa.

Este documento é a referência para futuras evoluções. Qualquer nova tela ou integração deve respeitar a mesma cadeia operacional e econômica.