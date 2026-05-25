import { getPaymentFeeConfigs, getMetaConfig, getWaApiConfig, getBusinessConfig } from "@/server/queries/settings";
import { savePaymentFeeConfigs, saveMetaConfig, saveWaApiConfig, saveAnalyticsConfig, saveBusinessConfig } from "@/server/actions/settings";
import { getSiteConfig } from "@/server/queries/site-config";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormWithToast } from "@/components/admin/FormWithToast";
import { IconSettings, IconBrandWhatsapp, IconMapPin } from "@/components/ui/icons";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { absolute: "Configurações · BK Admin" } };

const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cash: "Dinheiro",
  transfer: "Transferência",
};

const METHODS = ["pix", "credit_card", "debit_card", "cash", "transfer"];

export default async function ConfiguracoesPage() {
  const [feeConfigs, metaConfig, waConfig, siteConfig, bizConfig] = await Promise.all([
    getPaymentFeeConfigs(),
    getMetaConfig(),
    getWaApiConfig(),
    getSiteConfig(),
    getBusinessConfig(),
  ]);

  return (
    <div className="max-w-lg space-y-10">
      <div className="flex items-center gap-3">
        <IconSettings size={22} className="text-terracotta" />
        <h1 className="font-display font-400 text-3xl text-ink">Configurações</h1>
      </div>

      {/* Taxas de pagamento */}
      <section>
        <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-1">
          Taxas padrão por método de pagamento
        </h2>
        <p className="font-body text-xs text-ink-soft mb-4">
          Pré-preenche o campo de taxa ao registrar um pagamento.
        </p>

        <FormWithToast action={savePaymentFeeConfigs} successMessage="Taxas salvas com sucesso" className="space-y-3">
          <div className="bg-cream rounded-card border border-ink/10 divide-y divide-ink/5">
            {METHODS.map((method) => (
              <div key={method} className="flex items-center justify-between px-4 py-3">
                <label htmlFor={`fee-${method}`} className="font-body text-sm text-ink">
                  {METHOD_LABELS[method]}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`fee-${method}`}
                    name={method}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue={feeConfigs[method] ?? 0}
                    className="w-20 border border-ink/20 rounded bg-cream-soft px-2 py-1 font-body text-sm text-ink text-right focus:outline-none focus:border-ink"
                  />
                  <span className="font-body text-sm text-ink-soft">%</span>
                </div>
              </div>
            ))}
          </div>
          <Button type="submit">Salvar taxas</Button>
        </FormWithToast>
      </section>

      {/* WhatsApp API */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <IconBrandWhatsapp size={14} className="text-sage-deep" />
          <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft">
            WhatsApp API (Evolution API)
          </h2>
        </div>
        <p className="font-body text-xs text-ink-soft mb-2">
          Envio automático de notificações ao cliente via Evolution API v2.
          Ao mudar o status do pedido para <em>Enviado</em> ou <em>Pago</em>, a mensagem é
          disparada automaticamente.
        </p>
        <div className="bg-gold/10 border border-gold/30 rounded px-3 py-2 mb-4">
          <p className="font-body text-xs text-ink">
            ⚠️ <strong>Use um número dedicado para automação</strong> — nunca conecte seu número
            principal ao Evolution API. Mensagens em massa aumentam o risco de banimento pelo Meta.
            O número de automação é diferente do número exibido nos links do site.
          </p>
        </div>

        <FormWithToast action={saveWaApiConfig} successMessage="Configurações WhatsApp salvas" className="space-y-4">
          <Input
            id="wa_sender_number"
            name="wa_sender_number"
            label="Número de automação (conectado ao Evolution)"
            placeholder="5581988887777"
            defaultValue={waConfig.senderNumber}
          />
          <p className="font-body text-[10px] text-ink-soft -mt-3">
            Apenas para referência — o envio usa a instância configurada abaixo.
          </p>
          <Input
            id="wa_api_url"
            name="wa_api_url"
            label="URL da API"
            placeholder="https://evo.seuservidor.com"
            defaultValue={waConfig.url}
          />
          <Input
            id="wa_instance"
            name="wa_instance"
            label="Nome da instância"
            placeholder="bkcuradoria"
            defaultValue={waConfig.instance}
          />
          <div>
            <label
              htmlFor="wa_api_key"
              className="block font-body text-xs uppercase tracking-widest text-ink-soft mb-1"
            >
              API Key
            </label>
            <input
              id="wa_api_key"
              name="wa_api_key"
              type="password"
              autoComplete="off"
              defaultValue={waConfig.key}
              placeholder="••••••••"
              className="w-full rounded border border-ink/20 bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink font-mono"
            />
          </div>
          <Button type="submit">Salvar configurações WhatsApp</Button>
        </FormWithToast>
      </section>

      {/* Google Analytics */}
      <section>
        <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-1">
          Google Analytics
        </h2>
        <p className="font-body text-xs text-ink-soft mb-4">
          Measurement ID do GA4 (formato <code className="bg-ink/5 px-1 rounded font-mono text-[10px]">G-XXXXXXXXXX</code>).
          Deixe em branco para desativar o rastreamento.
        </p>
        <FormWithToast action={saveAnalyticsConfig} successMessage="Analytics salvo com sucesso" className="space-y-4">
          <Input
            id="ga_measurement_id"
            name="ga_measurement_id"
            label="Measurement ID"
            placeholder="G-XXXXXXXXXX"
            defaultValue={siteConfig.ga_measurement_id ?? ""}
          />
          <Button type="submit">Salvar Analytics</Button>
        </FormWithToast>
      </section>

      {/* Meta Ads / CAPI */}
      <section>
        <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft mb-1">
          Meta Ads / CAPI
        </h2>
        <p className="font-body text-xs text-ink-soft mb-4">
          Rastreamento de conversões via Conversions API do Meta. O link de redirect{" "}
          <code className="bg-ink/5 px-1 rounded font-mono text-[10px]">/api/whatsapp-redirect</code>{" "}
          captura leads de anúncios e redireciona para o WhatsApp.
        </p>

        <FormWithToast action={saveMetaConfig} successMessage="Configurações Meta salvas" className="space-y-4">
          <Input
            id="meta_whatsapp_number"
            name="meta_whatsapp_number"
            label="Número do WhatsApp do anúncio (E.164 sem +)"
            placeholder="5581999999999"
            defaultValue={metaConfig.meta_whatsapp_number}
          />
          <Input
            id="meta_whatsapp_message"
            name="meta_whatsapp_message"
            label="Mensagem padrão (anúncio)"
            placeholder="Olá! Vim pelo anúncio e quero saber mais."
            defaultValue={metaConfig.meta_whatsapp_message}
          />
          <Input
            id="meta_pixel_id"
            name="meta_pixel_id"
            label="Pixel ID"
            placeholder="123456789012345"
            defaultValue={metaConfig.meta_pixel_id}
          />
          <div>
            <label
              htmlFor="meta_capi_token"
              className="block font-body text-xs uppercase tracking-widest text-ink-soft mb-1"
            >
              Token de Acesso CAPI
            </label>
            <input
              id="meta_capi_token"
              name="meta_capi_token"
              type="password"
              autoComplete="off"
              defaultValue={metaConfig.meta_capi_token}
              placeholder="EAAxxxxxx..."
              className="w-full rounded border border-ink/20 bg-cream px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink font-mono"
            />
            <p className="font-body text-[10px] text-ink-soft mt-1">
              Gerenciador de Eventos → seu Pixel → Configurações → Token de Acesso.
            </p>
          </div>
          <Button type="submit">Salvar configurações Meta</Button>
        </FormWithToast>
      </section>

      {/* SEO & Negócio Local */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <IconMapPin size={14} className="text-terracotta" />
          <h2 className="font-body text-xs uppercase tracking-widest text-ink-soft">
            SEO & Negócio Local
          </h2>
        </div>
        <p className="font-body text-xs text-ink-soft mb-4">
          Dados usados para o schema <code className="bg-ink/5 px-1 rounded font-mono text-[10px]">LocalBusiness</code> do Google.
          Quanto mais completo, melhor o ranqueamento em pesquisas locais (&ldquo;curadoria de moda Recife&rdquo;).
        </p>

        <FormWithToast action={saveBusinessConfig} successMessage="Configurações de negócio salvas" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="business_phone"
              name="business_phone"
              label="Telefone / WhatsApp"
              placeholder="+5581999999999"
              defaultValue={bizConfig.business_phone}
            />
            <Input
              id="business_email"
              name="business_email"
              label="E-mail de contato"
              placeholder="contato@bkcuradoria.com.br"
              defaultValue={bizConfig.business_email}
            />
          </div>
          <Input
            id="business_address_street"
            name="business_address_street"
            label="Endereço (rua + número)"
            placeholder="Rua Exemplo, 123 — Boa Viagem"
            defaultValue={bizConfig.business_address_street}
          />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                id="business_city"
                name="business_city"
                label="Cidade"
                placeholder="Recife"
                defaultValue={bizConfig.business_city}
              />
            </div>
            <Input
              id="business_state"
              name="business_state"
              label="Estado (sigla)"
              placeholder="PE"
              defaultValue={bizConfig.business_state}
            />
          </div>
          <Input
            id="business_postal_code"
            name="business_postal_code"
            label="CEP"
            placeholder="51000-000"
            defaultValue={bizConfig.business_postal_code}
          />
          <Input
            id="business_opening_hours"
            name="business_opening_hours"
            label="Horário de funcionamento (Schema.org)"
            placeholder="Mo-Fr 09:00-18:00"
            defaultValue={bizConfig.business_opening_hours}
          />
          <p className="font-body text-[10px] text-ink-soft -mt-3">
            Formato: <code className="font-mono">Mo-Fr 09:00-18:00, Sa 10:00-14:00</code>
          </p>
          <Input
            id="business_instagram_url"
            name="business_instagram_url"
            label="Instagram (URL completa)"
            placeholder="https://instagram.com/bkcuradoria"
            defaultValue={bizConfig.business_instagram_url}
          />
          <Input
            id="business_facebook_url"
            name="business_facebook_url"
            label="Facebook (URL completa, opcional)"
            placeholder="https://facebook.com/bkcuradoria"
            defaultValue={bizConfig.business_facebook_url}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="business_latitude"
              name="business_latitude"
              label="Latitude (opcional)"
              placeholder="-8.119447"
              defaultValue={bizConfig.business_latitude}
            />
            <Input
              id="business_longitude"
              name="business_longitude"
              label="Longitude (opcional)"
              placeholder="-34.900043"
              defaultValue={bizConfig.business_longitude}
            />
          </div>
          <Input
            id="og_image_default"
            name="og_image_default"
            label="Imagem Open Graph padrão (URL)"
            placeholder="https://bkcuradoria.com.br/og-default.png"
            defaultValue={bizConfig.og_image_default}
          />
          <p className="font-body text-[10px] text-ink-soft -mt-3">
            Aparece quando o link do site é compartilhado sem imagem específica. Recomendado: 1200×630px.
          </p>
          <Button type="submit">Salvar SEO & Negócio</Button>
        </FormWithToast>
      </section>
    </div>
  );
}
