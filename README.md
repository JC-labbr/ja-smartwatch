# J&A Smartwatch — preview da loja

Loja virtual em HTML/CSS/JavaScript, pronta para ser importada como site estático na Vercel. O catálogo, categorias e configurações usam Supabase; o carrinho é mantido no navegador e a finalização abre o WhatsApp com o resumo do pedido.

## O que já foi preparado

- Página inicial responsiva e catálogo com busca, categorias e ordenação por preço.
- Carrinho com quantidade, subtotal/total e mensagem de pedido para WhatsApp.
- Área administrativa em `/#admin`, com autenticação Supabase.
- Cadastro, edição e desativação de produtos, preço, estoque, categoria, imagem, especificações e destaque.
- Configurações da loja, incluindo número do WhatsApp.
- O banco Supabase já contém cinco categorias, oito produtos demonstrativos, imagens de catálogo e configuração inicial.

## Importante: produtos demonstrativos

Os oito itens são dados iniciais de demonstração. Os preços e estoques são sugestões para testar a loja; as fotos são imagens genéricas de referência e não garantem que sejam os modelos exatos vendidos. Antes de vender, substitua fotos, nomes, preços, estoque e especificações pelos dados confirmados com seu fornecedor. Não anuncie recursos técnicos que ainda não foram verificados.

## Publicar na Vercel

1. Abra a Vercel e selecione **Add New → Project**.
2. Importe o repositório GitHub `JC-labbr/ja-smartwatch`.
3. Como é um site estático, escolha **Other** como framework se a Vercel não detectar automaticamente.
4. Deixe o comando de build vazio e use a raiz do projeto como diretório de saída. O arquivo publicado é `index.html`.
5. Clique em **Deploy**. A Vercel dará uma URL de preview.
6. Depois, conecte um domínio se desejar. Commits na branch `main` poderão disparar novas implantações automáticas.

O cliente Supabase usa uma chave **publicável** no código do navegador. Isso é esperado para uma chave `sb_publishable_...`; a proteção real dos dados é feita pelas políticas RLS do banco. Nunca adicione uma chave `service_role`, chave secreta ou senha ao código.

## Criar o primeiro administrador

1. Abra o [Supabase do projeto J&A](https://supabase.com/dashboard/project/fzlclobstowfuuaguhes/auth/users).
2. Em **Authentication → Users → Add user**, crie o usuário com seu próprio e-mail e uma senha forte. Não compartilhe a senha no chat.
3. Abra o **SQL Editor** e execute o conteúdo de [ADMIN_SETUP.sql](./ADMIN_SETUP.sql), substituindo `COLOQUE-SEU-EMAIL-AQUI` pelo e-mail exato do usuário criado. O script apenas promove um perfil existente; não cria usuários nem define senhas.
4. Confirme que o resultado mostra seu e-mail com `role = admin`.
5. Acesse [o painel administrativo](https://ja-smartwatch.vercel.app/#admin) e entre com o e-mail e a senha criados.

Não habilite cadastro público de administradores. O painel exige autenticação e as operações de escrita dependem das políticas RLS do Supabase. No momento da revisão, o projeto ainda não tinha usuários em Authentication; por isso, o login administrativo precisa ser inicializado conforme estas etapas.

## Configurar o WhatsApp

No painel, abra **Configurações** e informe o número comercial completo com código do país e DDD, somente dígitos. Exemplo de formato: `5522999999999`. Salve. Enquanto o número estiver vazio, a loja avisa que falta configurar o atendimento.

## Limites da versão inicial

- A finalização direciona o cliente ao WhatsApp; não há pagamento online.
- Não é criado um pedido no banco nem é feita reserva automática de estoque.
- As imagens são URLs externas; para gestão de arquivos profissional, configure depois um bucket do Supabase Storage com políticas de acesso apropriadas.
- O carrinho é salvo localmente no navegador do cliente.
- A chave publicável está no cliente de propósito; não é uma chave secreta. Não copie credenciais administrativas para o frontend.
