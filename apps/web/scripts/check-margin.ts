/**
 * Teste do cálculo de margem de venda por produto (taxa efetiva do pedido,
 * receita líquida de item, margem). Sem framework, sem banco.
 * Uso: tsx scripts/check-margin.ts
 */
import { calcOrderFeeRate, calcItemNetRevenue, calcMargin } from "../src/lib/margin";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error(`✗ ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

function main() {
  // calcOrderFeeRate
  {
    assert(calcOrderFeeRate([]) === 0, "pedido sem pagamento: taxa 0");
    assert(
      calcOrderFeeRate([{ grossCents: 10000, feeCents: 350 }]) === 0.035,
      "1 pagamento cartão com taxa: taxa exata (3.5%)"
    );
    // pix (sem taxa) + cartão com taxa: taxa ponderada pelo bruto
    const rate = calcOrderFeeRate([
      { grossCents: 10000, feeCents: 0 }, // pix
      { grossCents: 10000, feeCents: 700 }, // cartão 7%
    ]);
    assert(rate === 0.035, "pix + cartão: taxa ponderada pelo bruto total (700/20000 = 3.5%)");
  }

  // calcItemNetRevenue
  {
    // (2000 - 200) * 3 = 5400 bruto; líquido de 10% de taxa = 4860
    const net = calcItemNetRevenue(2000, 200, 3, 0.1);
    assert(net === 4860, "item com desconto, qtd>1, líquido de taxa: 4860");
    assert(calcItemNetRevenue(1000, 0, 1, 0) === 1000, "sem desconto/taxa: líquido = bruto");
  }

  // calcMargin
  {
    const noCost = calcMargin(10000, null);
    assert(noCost.marginCents === null, "custo nulo: marginCents null");
    assert(noCost.marginPercent === null, "custo nulo: marginPercent null");

    const withCost = calcMargin(10000, 6000);
    assert(withCost.marginCents === 4000, "receita 10000, custo 6000: margem 4000");
    assert(withCost.marginPercent === 40, "margem % = 4000/10000*100 = 40%");

    const zeroRevenue = calcMargin(0, 100);
    assert(zeroRevenue.marginCents === -100, "receita 0, custo 100: margem -100");
    assert(zeroRevenue.marginPercent === null, "receita 0: marginPercent null (evita divisão por zero)");

    const negativeMargin = calcMargin(5000, 8000);
    assert(negativeMargin.marginCents === -3000, "custo maior que receita: margem negativa");
  }

  if (process.exitCode) {
    console.error("\nFalhou.");
  } else {
    console.log("\nOK.");
  }
}

main();
