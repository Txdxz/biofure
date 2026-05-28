import { getQuotation } from "@/lib/actions";
import { notFound } from "next/navigation";

export default async function QuotationPrintPage({ params }: { params: { id: string } }) {
  const q = await getQuotation(params.id);
  if (!q) notFound();

  return (
    <div suppressHydrationWarning>
      <style>{`
        @page { size: A4; margin: 2cm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; color: #1a1a1a; line-height: 1.6; -webkit-print-color-adjust: exact; padding: 2cm; }
        .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 22px; margin: 0 0 4px 0; }
        .header .no { font-size: 14px; color: #666; }
        .info { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px; }
        .info .label { color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
        th { background: #f5f5f5; padding: 8px 6px; text-align: left; border-bottom: 2px solid #1a1a1a; font-weight: 600; }
        td { padding: 8px 6px; border-bottom: 1px solid #e5e5e5; }
        .text-right { text-align: right; }
        .total { font-size: 14px; font-weight: bold; text-align: right; margin-top: 8px; }
        .footer { margin-top: 48px; font-size: 12px; color: #666; border-top: 1px solid #e5e5e5; padding-top: 12px; }
        .footer div { margin-bottom: 4px; }
        .note { margin-top: 16px; font-size: 11px; color: #999; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      `}</style>
      <div className="header">
        <h1>北京百诺未来生物技术有限公司</h1>
        <div className="no">报 价 单</div>
      </div>
      <div className="info">
        <div>
          <div><span className="label">客户：</span>{q.customer.fullName}</div>
          <div><span className="label">日期：</span>{new Date(q.date).toLocaleDateString("zh-CN")}</div>
        </div>
        <div>
          <div><span className="label">有效期至：</span>{new Date(q.validTo).toLocaleDateString("zh-CN")}</div>
          <div><span className="label">报价单号：</span>{q.id}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{width:"6%"}}>序号</th>
            <th style={{width:"28%"}}>产品名称</th>
            <th style={{width:"16%"}}>规格/货号</th>
            <th style={{width:"12%"}}>品牌</th>
            <th style={{width:"8%"}}>数量</th>
            <th style={{width:"14%"}}>单价(¥)</th>
            <th style={{width:"16%"}}>小计(¥)</th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((item: any, idx: number) => (
            <tr key={item.id}>
              <td>{idx + 1}</td>
              <td>{item.product.name}</td>
              <td>{item.product.specification || "-"}</td>
              <td>{item.product.brand || "-"}</td>
              <td>{item.quantity}{item.product.unit}</td>
              <td className="text-right">{item.unitPrice.toFixed(2)}</td>
              <td className="text-right">{item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="total">合计：¥{q.totalAmount.toFixed(2)}（人民币）</div>
      {q.remark && <div className="note">备注：{q.remark}</div>}
      <div className="footer">
        <div>北京百诺未来生物技术有限公司</div>
        <div>电话：18600369485</div>
        <div>本报价单经确认后生效，最终价格以签订合同为准。</div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `window.onload=function(){window.print()}` }} />
    </div>
  );
}
