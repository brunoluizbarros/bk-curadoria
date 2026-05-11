import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  categories,
  services,
  serviceSteps,
  curadoriaContent,
  curadoriaCrivos,
  curadoriaRelacao,
  siteConfig,
  homeDifferentials,
} from "../src/db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  console.log("🌱 Iniciando seed...");

  // Categorias
  await db
    .insert(categories)
    .values([
      { slug: "nova", label: "Novidades", sortOrder: 0 },
      { slug: "look", label: "Looks", sortOrder: 1 },
      { slug: "basic", label: "Básicos", sortOrder: 2 },
      { slug: "promo", label: "Últimas peças", sortOrder: 3 },
    ])
    .onConflictDoNothing();
  console.log("✓ Categorias");

  // Serviços
  await db
    .insert(services)
    .values([
      {
        slug: "personal",
        number: "01",
        name: "Personal Shopper",
        subtitle: "Compras estratégicas, escolhas conscientes.",
        heroGradient: "linear-gradient(135deg,#6a7256 0%,#4f5841 60%,#3a4230 100%)",
        lead: "Comprar com intenção é uma habilidade. Eu vou contigo — física ou virtualmente — para transformar o processo de compra numa experiência de autoconhecimento e estratégia de imagem.",
        deliverable: "Relatório de compras com justificativas de escolha, guia de combinações e orientações de cuidado com as peças adquiridas.",
        duration: "4 a 6 horas · investimento sob consulta",
        sortOrder: 0,
      },
      {
        slug: "reposicionamento",
        number: "02",
        name: "Reposicionamento de Imagem",
        subtitle: "Quando a vida muda, o guarda-roupa acompanha.",
        heroGradient: "linear-gradient(135deg,#b8634a 0%,#8e4a35 60%,#6a3826 100%)",
        lead: "Transições de carreira, novos ciclos de vida, mudanças de cidade. Cada fase exige uma nova linguagem visual. Eu ajudo você a construir essa linguagem com consciência e autenticidade.",
        deliverable: "Diagnóstico completo do guarda-roupa atual, plano de transição em fases, lista de peças estratégicas e sessão de compras direcionada.",
        duration: "6 a 8 semanas · investimento sob consulta",
        sortOrder: 1,
      },
      {
        slug: "estilo",
        number: "03",
        name: "Adequação de Estilo",
        subtitle: "Seu estilo, refinado.",
        heroGradient: "linear-gradient(135deg,#c9a063 0%,#a07840 60%,#7a5a28 100%)",
        lead: "Você já tem um estilo próprio, mas sente que algo não está funcionando. Esta consultoria afina o que já existe — sem impor tendências, sem apagar sua identidade.",
        deliverable: "Análise de identidade visual pessoal, edição do guarda-roupa atual, guia de compras estratégicas e manual de estilo personalizado.",
        duration: "4 a 6 semanas · investimento sob consulta",
        sortOrder: 2,
      },
      {
        slug: "cromatica",
        number: "04",
        name: "Análise Cromática",
        subtitle: "As cores que amplificam quem você é.",
        heroGradient: "linear-gradient(135deg,#4f5841 0%,#6a7256 50%,#8a9476 100%)",
        lead: "A cor certa não é uma questão de gosto — é uma questão de harmonia. Através de uma análise personalizada, identificamos a paleta que potencializa sua aparência natural.",
        deliverable: "Cartela de cores personalizada, orientações de uso por contexto e guia de combinações cromáticas.",
        duration: "2 a 3 horas · investimento sob consulta",
        sortOrder: 3,
      },
    ])
    .onConflictDoNothing();
  console.log("✓ Serviços");

  // Etapas dos serviços
  await db
    .insert(serviceSteps)
    .values([
      // Personal Shopper
      { serviceSlug: "personal", title: "Briefing de estilo", description: "Conversamos sobre sua vida, rotina, objetivos e o que você quer comunicar com sua imagem.", sortOrder: 0 },
      { serviceSlug: "personal", title: "Mapeamento de necessidades", description: "Identificamos as lacunas reais do seu guarda-roupa e definimos prioridades de compra.", sortOrder: 1 },
      { serviceSlug: "personal", title: "Sessão de compras", description: "Vamos juntas às lojas — ou online — com lista estratégica e critérios claros de seleção.", sortOrder: 2 },
      { serviceSlug: "personal", title: "Relatório e combinações", description: "Recebe um guia com as compras realizadas, combinações possíveis e cuidados com cada peça.", sortOrder: 3 },
      // Reposicionamento
      { serviceSlug: "reposicionamento", title: "Diagnóstico da fase atual", description: "Entendemos juntas a transição que você está vivendo e o que precisa comunicar neste novo momento.", sortOrder: 0 },
      { serviceSlug: "reposicionamento", title: "Edição do guarda-roupa", description: "Revisão completa do que existe — o que fica, o que vai, o que transforma.", sortOrder: 1 },
      { serviceSlug: "reposicionamento", title: "Plano de transição", description: "Criamos um roteiro em fases para a construção do novo guarda-roupa, respeitando seu ritmo e orçamento.", sortOrder: 2 },
      { serviceSlug: "reposicionamento", title: "Acompanhamento", description: "Sessões de suporte durante a implementação do plano, com ajustes conforme necessário.", sortOrder: 3 },
      // Estilo
      { serviceSlug: "estilo", title: "Análise de identidade", description: "Mapeamos sua essência, referências visuais e o que sua imagem atual comunica.", sortOrder: 0 },
      { serviceSlug: "estilo", title: "Edição cirúrgica", description: "Revisamos o guarda-roupa identificando o que funciona, o que bloqueia e o que falta.", sortOrder: 1 },
      { serviceSlug: "estilo", title: "Refinamento de compras", description: "Lista estratégica de peças para preencher lacunas e elevar o que já existe.", sortOrder: 2 },
      { serviceSlug: "estilo", title: "Manual de estilo", description: "Documento personalizado com suas diretrizes visuais, combinações e referências.", sortOrder: 3 },
      // Cromática
      { serviceSlug: "cromatica", title: "Análise da coloração natural", description: "Avaliamos tom de pele, subtom, olhos e cabelos para identificar sua estação cromática.", sortOrder: 0 },
      { serviceSlug: "cromatica", title: "Testes com cartelas", description: "Experiência prática com diferentes paletas para visualizar o impacto de cada cor.", sortOrder: 1 },
      { serviceSlug: "cromatica", title: "Cartela personalizada", description: "Recebe sua paleta de cores em formato digital e físico (opcional), organizada por contexto.", sortOrder: 2 },
      { serviceSlug: "cromatica", title: "Guia de uso", description: "Orientações práticas de como aplicar as cores no dia a dia, no trabalho e em ocasiões especiais.", sortOrder: 3 },
    ])
    .onConflictDoNothing();
  console.log("✓ Etapas dos serviços");

  // Conteúdo da curadoria
  await db
    .insert(curadoriaContent)
    .values({
      id: 1,
      eyebrow: "O método",
      title: "A curadoria não é uma loja.",
      titleEm: "É uma relação.",
      leadParagraph1: "Cada peça que entra na BK passou por um processo rigoroso de seleção — não apenas estético, mas ético e intencional. Trabalho com volumes pequenos, marcas que respeito e materiais que duram.",
      leadParagraph2: "Não vendo tendência. Vendo permanência.",
      quoteText: "Curar é rejeitar. É dizer não para noventa por cento para que o que chega até você seja exatamente o que precisa ser.",
      quoteSignature: "Rebeka Fragoso",
      ctaLabel: "Quero conhecer a curadoria",
      ctaSubtext: "Atendimento via WhatsApp · Recife",
    })
    .onConflictDoNothing();
  console.log("✓ Conteúdo da curadoria");

  // Crivos da curadoria
  await db
    .insert(curadoriaCrivos)
    .values([
      { number: "01", title: "Origem rastreável", description: "Só trabalho com peças cuja procedência consigo verificar. Fabricantes conhecidos, processos transparentes, materiais certificados quando possível.", sortOrder: 0 },
      { number: "02", title: "Longevidade comprovada", description: "Cada peça precisa passar no teste do tempo — não apenas em termos de durabilidade física, mas de permanência estética. Nada que envelhece em uma estação.", sortOrder: 1 },
      { number: "03", title: "Pertinência ao acervo", description: "A peça precisa conversar com o que já existe. A curadoria é um organismo vivo — cada nova entrada precisa fazer sentido no conjunto.", sortOrder: 2 },
    ])
    .onConflictDoNothing();
  console.log("✓ Crivos da curadoria");

  // Itens de relação da curadoria
  await db
    .insert(curadoriaRelacao)
    .values([
      { title: "Drops trimestrais", description: "30 a 50 peças por estação. Quantidade intencional, nunca por acaso.", sortOrder: 0 },
      { title: "Pré-venda com aviso", description: "Clientes da lista recebem acesso antecipado a cada drop.", sortOrder: 1 },
      { title: "Sem estoque parado", description: "Quando a peça vai, foi. Não reponho o que esgotou.", sortOrder: 2 },
      { title: "Comunicação direta", description: "Cada venda é uma conversa. Sem carrinho, sem checkout frio.", sortOrder: 3 },
      { title: "Curadoria como serviço", description: "Comprar na BK é ter acesso à minha curadoria. Não é só uma peça — é um critério.", sortOrder: 4 },
    ])
    .onConflictDoNothing();
  console.log("✓ Relação da curadoria");

  // Configurações do site
  await db
    .insert(siteConfig)
    .values([
      { key: "whatsapp_number", value: "5581999999999" },
      { key: "hero_tag", value: "Curadoria · Recife" },
      { key: "hero_title", value: "Vestir-se com" },
      { key: "hero_title_em", value: "intenção." },
      { key: "hero_body", value: "Peças autorais selecionadas para quem sabe o que quer — e prefere qualidade ao volume." },
      { key: "banner_cur_tag", value: "Saiba mais" },
      { key: "banner_cur_title", value: "A BK não é uma loja." },
      { key: "banner_cur_title_em", value: "É uma curadoria." },
      { key: "banner_cur_cta", value: "Conhecer o método" },
      { key: "about_tag", value: "A BK" },
      { key: "about_quote", value: "Vestir-se com intenção é um ato de respeito consigo mesma." },
      { key: "about_body", value: "A BK Curadoria nasceu da necessidade de existir um lugar onde cada peça tem uma razão de estar. Não vendo volume. Vendo intenção — em cada tecido, em cada corte, em cada escolha." },
      { key: "svc_tag", value: "Consultoria" },
      { key: "svc_title", value: "Além do" },
      { key: "svc_title_em", value: "produto." },
      { key: "svc_subtitle", value: "Quatro formas de trabalharmos juntas" },
      { key: "cta_title", value: "Pronta para" },
      { key: "cta_title_em", value: "vestir-se com intenção?" },
      { key: "cta_subtitle", value: "Fale comigo no WhatsApp. Sem formulários, sem filas." },
      { key: "cta_label", value: "Iniciar conversa" },
      { key: "footer_sig", value: "rebeka fragoso · recife · 2026" },
    ])
    .onConflictDoNothing();
  console.log("✓ Configurações do site");

  // Diferenciais da home
  await db
    .insert(homeDifferentials)
    .values([
      { iconName: "eye", title: "Curadoria rigorosa", description: "Cada peça passa por critérios de origem, durabilidade e pertinência antes de entrar no acervo.", sortOrder: 0 },
      { iconName: "star", title: "Qualidade acima do volume", description: "Drops de 30 a 50 peças por estação. Quantidade intencional, nunca por acaso.", sortOrder: 1 },
      { iconName: "user", title: "Atendimento direto", description: "Cada venda é uma conversa. Comprar na BK é ter acesso à minha curadoria.", sortOrder: 2 },
      { iconName: "refresh", title: "Renovação constante", description: "O acervo evolui. Quando esgota, foi. Não reponho o que passou.", sortOrder: 3 },
    ])
    .onConflictDoNothing();
  console.log("✓ Diferenciais");

  await client.end();
  console.log("\n✅ Seed concluído!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
