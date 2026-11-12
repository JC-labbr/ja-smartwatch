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

1. No Supabase, abra **Authentication → Users → Add user** e crie manualmente o usuário administrativo com seu e-mail e uma senha forte.
2. No **SQL Editor**, execute a consulta abaixo, substituindo o e-mail pelo mesmo que você acabou de cadastrar. Ela só altera o perfil correspondente ao usuário existente:

```sql
update public.profiles p
set role = 'admin', updated_at = now()
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('admin@seudominio.com');
```

3. Confirme que exatamente uma linha foi atualizada. Se nenhuma linha for atualizada, verifique se o usuário existe e se o perfil já foi criado.
4. Acesse `https://SUA-URL-VERCEL/#admin`, entre com esse e-mail e senha. Se já estiver logado e precisar testar novamente, use **Sair**.

Não habilite cadastro público de administradores. O painel exige autenticação e as operações de escrita também dependem das políticas RLS do Supabase.

## Configurar o WhatsApp

No painel, abra **Configurações** e informe o número comercial completo com código do país e DDD, somente dígitos. Exemplo de formato: `5522999999999`. Salve. Enquanto o número estiver vazio, a loja avisa que falta configurar o atendimento.

## Limites da versão inicial

- A finalização direciona o cliente ao WhatsApp; não há pagamento online.
- Não é criado um pedido no banco nem é feita reserva automática de estoque.
- As imagens são URLs externas; para gestão de arquivos profissional, configure depois um bucket do Supabase Storage com políticas de acesso apropriadas.
- O carrinho é salvo localmente no navegador do cliente.
- A chave publicável está no cliente de propósito; não é uma chave secreta. Não copie credenciais administrativas para o frontend.
