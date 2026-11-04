/* work/helpdesk.js: interactive "Seller Service Center" demo for /work#ali-product (Alibaba case).
   Fictional data; the real interface is confidential. Styles: helpdesk.css.
   Outer layer: surface switch, region, language, and the stage rail (self-service → assistant → agent).
   Product: one help system on three surfaces: the Help Center website, the help plugin inside Seller
   Center (default), and the mobile app. Inside the product, hand-offs happen in the chat itself, and the
   floating Help button carries the chat state (in line, with agent, countdown, unread) when it is hidden.
   Behind the scenes: the SOP with each factor's value and which steps stay agent-only; the same SOP as a
   rule table; categories by merchant situation vs. by team; per-language layout rules.
   Product text: 中文 / English / Español / العربية (RTL). Explanations: English, or 中文 when the
   product is in Chinese. Markup avoids p, ul, li, headings and small, so the page's article styles do not leak in. */
(function () {
  'use strict';
  var hosts = document.querySelectorAll('[data-helpdesk]');
  if (!hosts.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Sites: language and region ---------------- */
  var LANGS = ['zh', 'en', 'es', 'ar'];
  var LANG = {
    en: { fs: 16, fl: 14, fx: 12, len: 'medium', dir: 'ltr', name: 'English', short: 'EN', tag: 'en' },
    zh: { fs: 14, fl: 12, fx: 11, len: 'short', dir: 'ltr', name: '中文', short: '中文', tag: 'zh-Hans' },
    es: { fs: 16, fl: 14, fx: 12, len: 'long', dir: 'ltr', name: 'Español', short: 'ES', tag: 'es' },
    ar: { fs: 16, fl: 14, fx: 12, len: 'short', dir: 'rtl', name: 'العربية', short: 'عربي', tag: 'ar' }
  };
  var REGIONS = ['CN', 'US', 'ES', 'SA'];
  var REG = {
    CN: { cur: 'CNY', rate: 7.1, local: 'deposit' },
    US: { cur: 'USD', rate: 1, local: 'salestax' },
    ES: { cur: 'EUR', rate: 0.95, local: 'vat' },
    SA: { cur: 'SAR', rate: 3.75, local: 'cod' }
  };
  var TODAY = [2022, 5, 6];

  /* ---------------- Cases (fictional) ---------------- */
  var CASES = {
    refund: [
      { id: 'r1', code: '#5821', item: 'i_shirt', usd: 24.9, status: 'st_notShipped', req: 'req_refund', f: { dispute: false, shipped: false, delivered: false, returnReq: false } },
      { id: 'r2', code: '#5817', item: 'i_mug', usd: 38, status: 'st_transit', req: 'req_refund', shipDay: -3, f: { dispute: false, shipped: true, delivered: false, returnReq: false } },
      { id: 'r3', code: '#5790', item: 'i_lamp', usd: 56, status: 'st_delivered', req: 'req_return', shipDay: -8, delDay: -5, f: { dispute: false, shipped: true, delivered: true, returnReq: true } },
      { id: 'r4', code: '#5762', item: 'i_buds', usd: 89, status: 'st_delivered', req: 'req_platform', shipDay: -12, delDay: -9, dueDay: 2, f: { dispute: true, shipped: true, delivered: true, returnReq: true } }
    ],
    order: [
      { id: 'o1', code: '#5830', item: 'i_case', usd: 12.5, status: 'st_notShipped', hoursLeft: 8, f: { paid: true, shipped: false, tracking: false, confirmed: false } },
      { id: 'o2', code: '#5812', item: 'i_shoes', usd: 72, status: 'st_transit', shipDay: -4, lastUpd: 3, f: { paid: true, shipped: true, tracking: false, confirmed: false } },
      { id: 'o3', code: '#5801', item: 'i_tote', usd: 19, status: 'st_delivered', shipDay: -5, delDay: -2, f: { paid: true, shipped: true, tracking: true, confirmed: false } }
    ],
    penalty: [
      { id: 'p1', type: 'p_misleading', subject: 'i_cream', points: 2, rule: 'rule_misleading', ev: 'ev_misleading', imp: 'imp_hidden', daysLeft: 2, f: { fixable: true, window: true } },
      { id: 'p2', type: 'p_late', subject: '#5733', points: 0, rule: 'rule_late', ev: 'ev_late', imp: 'imp_comp', daysLeft: 3, f: { fixable: false, window: true } }
    ]
  };

  /* ---------------- SOPs: factors (check points) → next step ---------------- */
  var SOP = {
    refund: {
      dec: [
        { f: 'dispute', exit: true, out: 'evidence' },
        { f: 'shipped', exit: false, out: 'approve' },
        { f: 'delivered', exit: false, out: 'intercept' },
        { f: 'returnReq', exit: true, out: 'return', alt: 'partial' }
      ],
      outs: {
        approve: { team: 'refunds' }, intercept: { team: 'logistics' }, return: { team: 'aftersales' }, partial: { team: 'aftersales' },
        evidence: { team: 'disputes', next: 'ruling' }, ruling: { team: 'disputes', vis: 'agent' }
      },
      src: { dispute: 'dispute.status', shipped: 'order.ship_status', delivered: 'logistics.status', returnReq: 'refund.type' },
      cond: { dispute: '= OPEN', shipped: '= NOT_SHIPPED', delivered: '≠ DELIVERED', returnReq: '= RETURN_AND_REFUND' }
    },
    order: {
      dec: [
        { f: 'paid', exit: false, out: 'unpaid' },
        { f: 'shipped', exit: false, out: 'ship' },
        { f: 'tracking', exit: false, out: 'stuck' },
        { f: 'confirmed', exit: false, out: 'confirm', alt: 'done' }
      ],
      outs: { unpaid: { team: 'orders' }, ship: { team: 'orders' }, stuck: { team: 'logistics' }, confirm: { team: 'funds' }, done: { team: 'funds' } },
      src: { paid: 'payment.status', shipped: 'order.ship_status', tracking: 'logistics.last_update', confirmed: 'order.confirmed' },
      cond: { paid: '≠ PAID', shipped: '= NOT_SHIPPED', tracking: '> 48 h ago', confirmed: '= FALSE' }
    },
    penalty: {
      look: ['record', 'rule', 'impact'],
      dec: [
        { f: 'fixable', exit: true, out: 'fix' },
        { f: 'window', exit: true, out: 'appeal', alt: 'closed' }
      ],
      outs: { fix: { team: 'rules' }, appeal: { team: 'disputes', next: 'review' }, review: { team: 'disputes', vis: 'agent', next: 'result' }, result: { team: 'disputes' }, closed: { team: 'rules' } },
      src: { record: 'penalty.record', rule: 'rule.clause', impact: 'penalty.impact', fixable: 'penalty.fixable', window: 'appeal.deadline' },
      cond: { fixable: '= TRUE', window: '> NOW' }
    }
  };
  var ACTS = {
    approve: ['a_approve', 'a_contact'], intercept: ['a_intercept', 'a_contact'], return: ['a_return', 'a_decline'], partial: ['a_contact'],
    evidence: ['a_evidence', 'agent'], unpaid: [], ship: ['a_delay', 'a_label'], stuck: ['a_courier', 'a_contact'], confirm: ['a_remind'], done: [],
    fix: ['a_edit', 'a_appealInstead'], appeal: ['a_appeal'], closed: [], review: ['a_progress', 'agent']
  };

  /* ---------------- Categories: by merchant situation vs. by team ---------------- */
  var Q = {
    q1: { tool: 'refund', id: 'r2', teams: ['refunds', 'logistics', 'disputes'] },
    q2: { tool: 'refund', id: 'r3', teams: ['refunds', 'aftersales', 'logistics'] },
    q3: { tool: 'refund', id: 'r4', teams: ['refunds', 'disputes'] },
    q4: { tool: 'order', id: 'o1', teams: ['orders', 'logistics'] },
    q5: { tool: 'order', id: 'o2', teams: ['orders', 'logistics'] },
    q6: { tool: 'penalty', id: 'p1', teams: ['rules'] },
    q7: { tool: 'penalty', id: 'p2', teams: ['rules', 'disputes'] }
  };
  var SIT = { refund: ['q1', 'q2', 'q3'], order: ['q4', 'q5'], penalty: ['q6', 'q7'] };
  var TEAMS = ['refunds', 'orders', 'logistics', 'aftersales', 'disputes', 'rules'];
  var SITMAP = {
    refund: { teams: ['refunds', 'logistics', 'aftersales', 'disputes'], f: ['dispute', 'shipped', 'delivered', 'returnReq'] },
    order: { teams: ['orders', 'logistics', 'funds'], f: ['paid', 'shipped', 'tracking', 'confirmed'] },
    penalty: { teams: ['rules', 'disputes'], f: ['fixable', 'window'] }
  };
  /* Free-text routing for search and chat: checked in this order. */
  var KW = {
    refund: ['refund', 'money back', 'return', '退款', '退货', '退钱', 'reembols', 'devol', 'استرداد', 'إرجاع', 'ارجاع', 'استرجاع'],
    penalty: ['penalt', 'violation', 'appeal', 'hidden', 'points', '违规', '处罚', '申诉', '扣分', '屏蔽', 'sanci', 'apela', 'infrac', 'oculto', 'مخالف', 'عقوب', 'تظلم', 'اعتراض', 'مخفي'],
    order: ['order', 'ship', 'track', 'deliver', 'late', 'courier', 'parcel', '订单', '发货', '物流', '快递', '包裹', 'pedido', 'envío', 'envio', 'seguimiento', 'paquete', 'transportista', 'طلب', 'شحن', 'تتبع', 'طرد']
  };

  /* ---------------- Product text (4 languages) ---------------- */
  var P = {
    en: {
      app: 'Seller Service Center', hello: 'Hi, how can we help?', searchPh: 'Describe the problem, e.g. refund',
      notice: 'Order #5830 must ship within 8 hours.', noticeGo: 'Check', tools: 'Self-service',
      t_refund: 'Buyer wants money back', t_order: 'Order status', t_penalty: 'Penalty check & appeal', t_progress: 'Appeal progress', t_assistant: 'Ask the assistant',
      faq: 'Common questions', sit_refund: 'Money back', sit_order: 'Order stuck', sit_penalty: 'Penalty',
      sl_refund: 'A buyer wants money back', sl_order: 'An order is stuck', sl_penalty: 'I got a penalty',
      team_refunds: 'Refunds', team_orders: 'Orders', team_logistics: 'Logistics', team_aftersales: 'After-sales', team_disputes: 'Disputes', team_rules: 'Rules', team_funds: 'Funds',
      q1: 'The buyer asked for a refund after I shipped', q2: 'The buyer wants to return an item', q3: 'The buyer asked the platform to step in',
      q4: 'An order is close to its shipping deadline', q5: 'Tracking hasn’t updated for days', q6: 'Why was my listing hidden?', q7: 'How do I appeal a penalty?',
      back: 'Back', pickOrder: 'Which order?', pickPenalty: 'Which penalty?', checking: 'Checking the order…', checkingP: 'Looking up the record…',
      weChecked: 'What we checked', notNeeded: 'Not needed', yes: 'Yes', no: 'No', whatToDo: 'What to do',
      notSolved: 'Not solved? Ask the assistant', agent: 'Talk to an agent', toastDone: '{a}: done (demo)',
      i_shirt: 'Linen shirt', i_mug: 'Ceramic mug set', i_lamp: 'Desk lamp', i_buds: 'Wireless earbuds', i_case: 'Phone case', i_shoes: 'Running shoes', i_tote: 'Tote bag', i_cream: 'Hydrating face cream',
      req_refund: 'Refund only', req_return: 'Return and refund', req_platform: 'Platform stepped in',
      st_notShipped: 'Not shipped', st_transit: 'In transit', st_delivered: 'Delivered',
      f_dispute: 'Platform stepped in', f_shipped: 'Shipped', f_delivered: 'Delivered', f_returnReq: 'Return requested', f_paid: 'Paid',
      f_tracking: 'Tracking updated in 48 h', f_confirmed: 'Buyer confirmed receipt', f_fixable: 'Can be fixed by editing', f_window: 'Appeal window open',
      v_shippedOn: 'Shipped {d}', v_deliveredOn: 'Delivered {d}', v_lastUpdate: 'Last update {n} days ago', v_daysLeft: '{n} days left', v_hoursLeft: '{n} h left to ship', v_evidenceDue: 'Evidence due {d}',
      o_approve_t: 'Not shipped yet: approve the refund', o_approve_b: 'Nothing to send back. The money goes back to the buyer right away.',
      o_intercept_t: 'On its way: intercept, then refund', o_intercept_b: 'We ask the courier to bring the parcel back. The refund completes when it arrives.',
      o_return_t: 'Delivered: agree to the return', o_return_b: 'Send your return address. Refund once the item is back and checked.',
      o_evidence_t: 'The platform is reviewing: add your evidence', o_evidence_b: 'Upload photos, chat records or tracking by {d}. An agent makes the final decision.',
      o_ship_t: 'Ship within 8 hours', o_ship_b: 'After the deadline it counts as a late shipment. Can’t make it? Report a delay now.',
      o_stuck_t: 'Tracking stopped: ask the courier', o_stuck_b: 'No update for 3 days. We ask the courier to check and let the buyer know.',
      o_confirm_t: 'Delivered: payment releases on confirmation', o_confirm_b: 'If the buyer doesn’t confirm, the order confirms itself in 7 days.',
      o_fix_t: 'Edit the listing to lift the penalty', o_fix_b: 'Remove the phrase. We re-check automatically and lift the penalty.',
      o_appeal_t: 'Appeal with proof', o_appeal_b: 'Attach your proof, such as a courier pickup record or a certificate. An agent reviews every appeal.',
      a_approve: 'Approve refund', a_contact: 'Message the buyer', a_intercept: 'Request interception', a_return: 'Agree and send address', a_decline: 'Decline with a reason',
      a_evidence: 'Upload evidence', a_delay: 'Report a delay', a_label: 'Print shipping label', a_courier: 'Ask the courier to check', a_remind: 'Remind the buyer',
      a_edit: 'Edit listing', a_appealInstead: 'Appeal instead', a_appeal: 'Appeal with evidence', a_progress: 'Check progress',
      p_misleading: 'Misleading claim', p_late: 'Late shipment', r_rule: 'Rule', r_evidence: 'Evidence', r_points: 'Points', r_impact: 'Impact',
      rule_misleading: 'Listings may not use superlatives such as “No.1” or “best in the world”.', ev_misleading: 'Title: “No.1 in the world hydrating cream”', imp_hidden: 'Hidden from search for 7 days',
      rule_late: 'Orders must ship within 48 hours of payment.', ev_late: 'Order #5733 shipped 30 hours late', imp_comp: 'Buyer compensated 5% of the order',
      pts: '{n} points', pts0: 'No points',
      ap_title: 'Your evidence', ap_submit: 'Submit appeal', ap_file_p1: 'Award certificate.pdf', ap_note_p1: 'The phrase quotes an industry award; the certificate is attached.',
      ap_file_p2: 'Courier pickup record.jpg', ap_note_p2: 'The courier collected the parcel 30 hours after the booked pickup.',
      sub_t: 'Appeal submitted: under review', sub_b: 'An agent reviews every appeal, usually within 1–3 days.',
      pr_submitted: 'Submitted', pr_review: 'Agent review', pr_now: 'In progress', pr_result: 'Result', pr_none: 'No appeals yet. Check a penalty first.', pr_open: 'Open penalty check',
      bot: 'Assistant', greet: 'Hi! What’s going on? Pick one, or type it in your own words.',
      greetCtx: 'You checked {case}. Result: {outcome}. What’s still not solved?', else: 'Something else',
      matched: 'Sounds like “{sit}”. Let me check it for you.', open: 'Open: {tool}',
      fallback: 'I’m not sure I got that. Pick one of these, or talk to an agent.',
      helpful: 'Did this solve it?', ok: 'Yes, thanks', notOk: 'Not yet', glad: 'Great, glad it’s sorted.', toAgent: 'Let me bring in an agent.',
      inputPh: 'Type a message', send: 'Send',
      fr_noIntercept: 'The courier can’t intercept it', fr_noIntercept_a: 'Then let it arrive. If the buyer refuses the parcel, it comes back to you and the refund completes on its own.',
      fr_disagree: 'The buyer disagrees', fr_disagree_a: 'Either of you can ask the platform to step in. You add evidence, and an agent decides.',
      fr_courier: 'The courier isn’t answering', fr_courier_a: 'I’ve flagged it to the courier. You’ll get an update here within 24 hours.',
      fr_when: 'When will I hear back?', fr_when_a: 'Appeals are reviewed within 1–3 days. You’ll get a message, and you can check progress any time.',
      queue: 'You’re number {n} in line', joined: '{name} joined the chat', agentName: 'Mia',
      hiCtx: 'Hi, I’m {name}. I can see {case} and the checks you already ran. No need to repeat anything; I’ll take it from here.',
      hi: 'Hi, I’m {name}. How can I help?', noted: 'Thanks, I’ve added that to your case.',
      closing: 'No reply for a while. This chat closes in {s} s.', ended: 'Chat ended.', home: 'Back to Service Center',
      j_self: 'Self-service', j_bot: 'Assistant', j_agent: 'Agent', hs_queue: 'In line', hs_live: 'Connected', hs_closing: 'Closing', hs_ended: 'Ended',
      caseOrder: 'order {code}', casePenalty: 'the “{p}” penalty', localTag: 'Local', illus: 'Illustrative content',
      local_deposit: 'Store deposit', local_salestax: 'Sales tax', local_vat: 'VAT invoices', local_cod: 'Cash on delivery',
      region_CN: 'China', region_US: 'United States', region_ES: 'Spain', region_SA: 'Saudi Arabia'
    },
    zh: {
      app: '商家服务大厅', hello: '你好，请问有什么可以帮你？', searchPh: '描述你的问题，比如“退款”',
      notice: '订单 #5830 需在 8 小时内发货。', noticeGo: '去查看', tools: '自助服务',
      t_refund: '买家要退款', t_order: '订单状态查询', t_penalty: '违规查询及申诉', t_progress: '申诉进度', t_assistant: '问问智能助手',
      faq: '常见问题', sit_refund: '买家要退款', sit_order: '订单卡住了', sit_penalty: '收到处罚',
      sl_refund: '买家要退款', sl_order: '订单卡住了', sl_penalty: '我收到了处罚',
      team_refunds: '退款', team_orders: '订单', team_logistics: '物流', team_aftersales: '售后', team_disputes: '纠纷', team_rules: '规则', team_funds: '资金',
      q1: '已经发货了，买家申请退款怎么办？', q2: '买家要退货退款怎么处理？', q3: '买家申请平台介入后会怎样？',
      q4: '订单快到发货时限了', q5: '物流好几天没更新', q6: '商品为什么被搜索屏蔽？', q7: '收到处罚怎么申诉？',
      back: '返回', pickOrder: '选择订单', pickPenalty: '选择处罚记录', checking: '正在检查订单…', checkingP: '正在查询处罚记录…',
      weChecked: '已检查', notNeeded: '无需检查', yes: '是', no: '否', whatToDo: '建议操作',
      notSolved: '没解决？问问智能助手', agent: '转人工客服', toastDone: '{a}：已完成（演示）',
      i_shirt: '亚麻衬衫', i_mug: '陶瓷杯套装', i_lamp: '台灯', i_buds: '无线耳机', i_case: '手机壳', i_shoes: '跑步鞋', i_tote: '帆布包', i_cream: '保湿面霜',
      req_refund: '仅退款', req_return: '退货退款', req_platform: '平台已介入',
      st_notShipped: '未发货', st_transit: '运输中', st_delivered: '已签收',
      f_dispute: '平台介入', f_shipped: '已发货', f_delivered: '已签收', f_returnReq: '要求退货', f_paid: '已付款',
      f_tracking: '48 小时内有物流更新', f_confirmed: '买家已确认收货', f_fixable: '可通过修改商品解除', f_window: '仍在申诉期内',
      v_shippedOn: '{d} 已发货', v_deliveredOn: '{d} 已签收', v_lastUpdate: '{n} 天前最后更新', v_daysLeft: '剩 {n} 天', v_hoursLeft: '距发货时限剩 {n} 小时', v_evidenceDue: '{d} 前提交凭证',
      o_approve_t: '还没发货：直接同意退款', o_approve_b: '无需退回商品，钱款会立即退给买家。',
      o_intercept_t: '正在运输：先拦截，再退款', o_intercept_b: '我们会通知快递把包裹退回，包裹退回后自动完成退款。',
      o_return_t: '已签收：同意退货', o_return_b: '发送退货地址，商品退回并验收后再退款。',
      o_evidence_t: '平台审核中：请提交凭证', o_evidence_b: '请在 {d} 前上传照片、聊天记录或物流凭证，最终由小二判定。',
      o_ship_t: '请在 8 小时内发货', o_ship_b: '超过时限将记为延迟发货。来不及？现在就报备延迟。',
      o_stuck_t: '物流停滞：请快递核查', o_stuck_b: '物流已 3 天没有更新。我们会请快递核查，并通知买家。',
      o_confirm_t: '已签收：确认收货后放款', o_confirm_b: '买家不确认的话，7 天后系统自动确认收货。',
      o_fix_t: '修改商品即可解除处罚', o_fix_b: '删除违规用语后系统自动复检，通过即解除处罚。',
      o_appeal_t: '提交证明申诉', o_appeal_b: '附上证明材料，比如快递揽收记录或证书。每条申诉都由小二审核。',
      a_approve: '同意退款', a_contact: '联系买家', a_intercept: '申请拦截', a_return: '同意并发送地址', a_decline: '拒绝并说明理由',
      a_evidence: '上传凭证', a_delay: '延迟发货报备', a_label: '打印面单', a_courier: '请快递核查', a_remind: '提醒买家确认',
      a_edit: '去修改商品', a_appealInstead: '我要申诉', a_appeal: '提交凭证申诉', a_progress: '查看进度',
      p_misleading: '虚假宣传', p_late: '延迟发货', r_rule: '规则', r_evidence: '违规证据', r_points: '扣分', r_impact: '影响',
      rule_misleading: '商品信息不得使用“第一”“全球最佳”等绝对化用语。', ev_misleading: '标题：“全球第一保湿面霜”', imp_hidden: '搜索屏蔽 7 天',
      rule_late: '订单须在付款后 48 小时内发货。', ev_late: '订单 #5733 超时 30 小时发货', imp_comp: '按订单金额 5% 赔付买家',
      pts: '{n} 分', pts0: '不扣分',
      ap_title: '申诉凭证', ap_submit: '提交申诉', ap_file_p1: '获奖证书.pdf', ap_note_p1: '该表述引用的是行业奖项，已附证书。',
      ap_file_p2: '快递揽收记录.jpg', ap_note_p2: '快递在预约时间 30 小时后才上门揽收。',
      sub_t: '申诉已提交：审核中', sub_b: '每条申诉都由小二人工审核，通常 1–3 天出结果。',
      pr_submitted: '已提交', pr_review: '小二审核', pr_now: '处理中', pr_result: '结果', pr_none: '暂无申诉。先去查询处罚记录吧。', pr_open: '去违规查询',
      bot: '智能助手', greet: '你好！遇到什么问题了？选一个，或者直接说说情况。',
      greetCtx: '你刚查询了{case}，结果：{outcome}。还有什么没解决？', else: '其他问题',
      matched: '听起来是“{sit}”。我帮你查一下。', open: '打开：{tool}',
      fallback: '我没太明白。选一个下面的选项，或者转人工客服。',
      helpful: '这个回答解决你的问题了吗？', ok: '解决了，谢谢', notOk: '还没有', glad: '太好了，问题解决就好。', toAgent: '我帮你转接人工客服。',
      inputPh: '输入消息', send: '发送',
      fr_noIntercept: '快递拦截不了', fr_noIntercept_a: '那就让包裹正常派送。买家拒收后包裹会退回给你，退款自动完成。',
      fr_disagree: '买家不同意', fr_disagree_a: '双方都可以申请平台介入。你提交凭证，由小二判定。',
      fr_courier: '快递一直没回复', fr_courier_a: '我已经向快递发起核查，24 小时内会在这里给你答复。',
      fr_when: '什么时候有结果？', fr_when_a: '申诉通常 1–3 天审核完。有结果会通知你，也可以随时查看进度。',
      queue: '排队中，你是第 {n} 位', joined: '{name}已接入', agentName: '客服小林',
      hiCtx: '你好，我是{name}。你刚才查询的{case}，以及做过的检查，我都看到了。不用再重复描述，接下来交给我。',
      hi: '你好，我是{name}，有什么可以帮你？', noted: '收到，已经记录到你的工单里。',
      closing: '长时间未回复，对话将在 {s} 秒后结束。', ended: '对话已结束。', home: '返回服务大厅',
      j_self: '自助', j_bot: '智能助手', j_agent: '人工', hs_queue: '排队中', hs_live: '服务中', hs_closing: '即将结束', hs_ended: '已结束',
      caseOrder: '订单 {code}', casePenalty: '“{p}”处罚', localTag: '本地', illus: '示意内容',
      local_deposit: '店铺保证金', local_salestax: '销售税', local_vat: '增值税发票', local_cod: '货到付款',
      region_CN: '中国', region_US: '美国', region_ES: '西班牙', region_SA: '沙特阿拉伯'
    },
    es: {
      app: 'Centro de servicio al vendedor', hello: 'Hola, ¿en qué podemos ayudarte?', searchPh: 'Describe el problema, p. ej. reembolso',
      notice: 'El pedido #5830 debe enviarse en menos de 8 horas.', noticeGo: 'Revisar', tools: 'Autoservicio',
      t_refund: 'El comprador quiere un reembolso', t_order: 'Consultar el estado de un pedido', t_penalty: 'Consultar y apelar una sanción', t_progress: 'Estado de la apelación', t_assistant: 'Preguntar al asistente',
      faq: 'Preguntas frecuentes', sit_refund: 'Reembolso', sit_order: 'Pedido atascado', sit_penalty: 'Sanción',
      sl_refund: 'Un comprador quiere su dinero', sl_order: 'Un pedido está atascado', sl_penalty: 'Recibí una sanción',
      team_refunds: 'Reembolsos', team_orders: 'Pedidos', team_logistics: 'Logística', team_aftersales: 'Posventa', team_disputes: 'Disputas', team_rules: 'Normas', team_funds: 'Fondos',
      q1: 'El comprador pidió un reembolso después de que lo envié', q2: 'El comprador quiere devolver un artículo', q3: 'El comprador pidió que intervenga la plataforma',
      q4: 'Un pedido está a punto de superar el plazo de envío', q5: 'El seguimiento no se actualiza desde hace días', q6: '¿Por qué se ocultó mi anuncio?', q7: '¿Cómo apelo una sanción?',
      back: 'Volver', pickOrder: '¿Qué pedido?', pickPenalty: '¿Qué sanción?', checking: 'Revisando el pedido…', checkingP: 'Buscando el registro…',
      weChecked: 'Lo que revisamos', notNeeded: 'No hace falta', yes: 'Sí', no: 'No', whatToDo: 'Qué hacer',
      notSolved: '¿No se resolvió? Pregunta al asistente', agent: 'Hablar con un agente', toastDone: '{a}: hecho (demo)',
      i_shirt: 'Camisa de lino', i_mug: 'Juego de tazas de cerámica', i_lamp: 'Lámpara de escritorio', i_buds: 'Auriculares inalámbricos', i_case: 'Funda de móvil', i_shoes: 'Zapatillas de running', i_tote: 'Bolso de tela', i_cream: 'Crema hidratante facial',
      req_refund: 'Solo reembolso', req_return: 'Devolución y reembolso', req_platform: 'La plataforma intervino',
      st_notShipped: 'Sin enviar', st_transit: 'En tránsito', st_delivered: 'Entregado',
      f_dispute: 'La plataforma intervino', f_shipped: 'Enviado', f_delivered: 'Entregado', f_returnReq: 'Se pidió devolución', f_paid: 'Pagado',
      f_tracking: 'Seguimiento actualizado en 48 h', f_confirmed: 'El comprador confirmó la recepción', f_fixable: 'Se puede corregir editando', f_window: 'Plazo de apelación abierto',
      v_shippedOn: 'Enviado el {d}', v_deliveredOn: 'Entregado el {d}', v_lastUpdate: 'Última actualización hace {n} días', v_daysLeft: 'Quedan {n} días', v_hoursLeft: 'Quedan {n} h para enviar', v_evidenceDue: 'Pruebas antes del {d}',
      o_approve_t: 'Aún no se envió: aprueba el reembolso', o_approve_b: 'No hay nada que devolver. El dinero vuelve al comprador al instante.',
      o_intercept_t: 'Está en camino: intercéptalo y luego reembolsa', o_intercept_b: 'Pedimos al transportista que devuelva el paquete. El reembolso se completa cuando llega.',
      o_return_t: 'Entregado: acepta la devolución', o_return_b: 'Envía tu dirección de devolución. Reembolsa cuando el artículo vuelva y lo revises.',
      o_evidence_t: 'La plataforma está revisando: aporta tus pruebas', o_evidence_b: 'Sube fotos, chats o el seguimiento antes del {d}. Un agente toma la decisión final.',
      o_ship_t: 'Envíalo en menos de 8 horas', o_ship_b: 'Después del plazo cuenta como envío tardío. ¿No llegas? Notifica un retraso ahora.',
      o_stuck_t: 'El seguimiento se detuvo: consulta al transportista', o_stuck_b: 'Sin novedades desde hace 3 días. Pedimos al transportista que lo revise y avisamos al comprador.',
      o_confirm_t: 'Entregado: el pago se libera al confirmar', o_confirm_b: 'Si el comprador no confirma, el pedido se confirma solo en 7 días.',
      o_fix_t: 'Edita el anuncio para levantar la sanción', o_fix_b: 'Quita la frase. Lo revisamos de nuevo automáticamente y levantamos la sanción.',
      o_appeal_t: 'Apela con pruebas', o_appeal_b: 'Adjunta una prueba, como el registro de recogida del transportista o un certificado. Un agente revisa cada apelación.',
      a_approve: 'Aprobar reembolso', a_contact: 'Escribir al comprador', a_intercept: 'Solicitar intercepción', a_return: 'Aceptar y enviar dirección', a_decline: 'Rechazar con un motivo',
      a_evidence: 'Subir pruebas', a_delay: 'Notificar un retraso', a_label: 'Imprimir etiqueta de envío', a_courier: 'Pedir revisión al transportista', a_remind: 'Recordar al comprador',
      a_edit: 'Editar anuncio', a_appealInstead: 'Prefiero apelar', a_appeal: 'Apelar con pruebas', a_progress: 'Ver el estado',
      p_misleading: 'Publicidad engañosa', p_late: 'Envío tardío', r_rule: 'Norma', r_evidence: 'Prueba', r_points: 'Puntos', r_impact: 'Efecto',
      rule_misleading: 'Los anuncios no pueden usar superlativos como «n.º 1» o «el mejor del mundo».', ev_misleading: 'Título: «Crema hidratante n.º 1 del mundo»', imp_hidden: 'Oculto en la búsqueda durante 7 días',
      rule_late: 'Los pedidos deben enviarse en las 48 horas siguientes al pago.', ev_late: 'El pedido #5733 se envió con 30 horas de retraso', imp_comp: 'Compensación al comprador del 5 % del pedido',
      pts: '{n} puntos', pts0: 'Sin puntos',
      ap_title: 'Tus pruebas', ap_submit: 'Enviar apelación', ap_file_p1: 'Certificado del premio.pdf', ap_note_p1: 'La frase cita un premio del sector; adjunto el certificado.',
      ap_file_p2: 'Registro de recogida.jpg', ap_note_p2: 'El transportista recogió el paquete 30 horas después de la hora acordada.',
      sub_t: 'Apelación enviada: en revisión', sub_b: 'Un agente revisa cada apelación, normalmente en 1–3 días.',
      pr_submitted: 'Enviada', pr_review: 'Revisión del agente', pr_now: 'En curso', pr_result: 'Resultado', pr_none: 'Aún no hay apelaciones. Consulta primero una sanción.', pr_open: 'Consultar sanciones',
      bot: 'Asistente', greet: '¡Hola! ¿Qué ocurre? Elige una opción o escríbelo con tus palabras.',
      greetCtx: 'Revisaste {case}. Resultado: {outcome}. ¿Qué sigue sin resolverse?', else: 'Otra cosa',
      matched: 'Parece que «{sit}». Déjame revisarlo.', open: 'Abrir: {tool}',
      fallback: 'No estoy seguro de haberlo entendido. Elige una opción o habla con un agente.',
      helpful: '¿Se resolvió?', ok: 'Sí, gracias', notOk: 'Todavía no', glad: '¡Genial! Me alegra que esté resuelto.', toAgent: 'Te paso con un agente.',
      inputPh: 'Escribe un mensaje', send: 'Enviar',
      fr_noIntercept: 'El transportista no puede interceptarlo', fr_noIntercept_a: 'Entonces deja que llegue. Si el comprador lo rechaza, vuelve a ti y el reembolso se completa solo.',
      fr_disagree: 'El comprador no está de acuerdo', fr_disagree_a: 'Cualquiera de los dos puede pedir que intervenga la plataforma. Tú aportas pruebas y un agente decide.',
      fr_courier: 'El transportista no responde', fr_courier_a: 'Ya avisé al transportista. Tendrás novedades aquí en 24 horas.',
      fr_when: '¿Cuándo tendré respuesta?', fr_when_a: 'Las apelaciones se revisan en 1–3 días. Te avisaremos y puedes ver el estado cuando quieras.',
      queue: 'Estás en el puesto {n} de la cola', joined: '{name} se unió al chat', agentName: 'Mia',
      hiCtx: 'Hola, soy {name}. Veo {case} y las comprobaciones que ya hiciste. No hace falta repetir nada; yo me encargo.',
      hi: 'Hola, soy {name}. ¿En qué puedo ayudarte?', noted: 'Gracias, lo añadí a tu caso.',
      closing: 'Sin respuesta desde hace un rato. Este chat se cierra en {s} s.', ended: 'Chat finalizado.', home: 'Volver al centro de servicio',
      j_self: 'Autoservicio', j_bot: 'Asistente', j_agent: 'Agente', hs_queue: 'En cola', hs_live: 'Conectado', hs_closing: 'Cerrando', hs_ended: 'Finalizado',
      caseOrder: 'el pedido {code}', casePenalty: 'la sanción «{p}»', localTag: 'Local', illus: 'Contenido ilustrativo',
      local_deposit: 'Depósito de la tienda', local_salestax: 'Impuesto sobre las ventas', local_vat: 'Facturas con IVA', local_cod: 'Pago contra reembolso',
      region_CN: 'China', region_US: 'Estados Unidos', region_ES: 'España', region_SA: 'Arabia Saudí'
    },
    ar: {
      app: 'مركز خدمة البائعين', hello: 'مرحبًا، كيف يمكننا مساعدتك؟', searchPh: 'صف المشكلة، مثل: استرداد',
      notice: 'يجب شحن الطلب #5830 خلال 8 ساعات.', noticeGo: 'تحقق', tools: 'الخدمة الذاتية',
      t_refund: 'طلب استرداد', t_order: 'حالة الطلب', t_penalty: 'المخالفات', t_progress: 'متابعة التظلم', t_assistant: 'اسأل المساعد',
      faq: 'أسئلة شائعة', sit_refund: 'استرداد', sit_order: 'طلب متوقف', sit_penalty: 'مخالفة',
      sl_refund: 'مشترٍ يريد استرداد المبلغ', sl_order: 'طلب متوقف', sl_penalty: 'تلقيت مخالفة',
      team_refunds: 'الاسترداد', team_orders: 'الطلبات', team_logistics: 'الشحن', team_aftersales: 'ما بعد البيع', team_disputes: 'النزاعات', team_rules: 'القواعد', team_funds: 'الأموال',
      q1: 'طلب المشتري استرداد المبلغ بعد الشحن', q2: 'المشتري يريد إرجاع منتج', q3: 'طلب المشتري تدخل المنصة',
      q4: 'اقترب موعد شحن أحد الطلبات', q5: 'لم يتحدث التتبع منذ أيام', q6: 'لماذا أُخفي منتجي؟', q7: 'كيف أتظلم من مخالفة؟',
      back: 'رجوع', pickOrder: 'أي طلب؟', pickPenalty: 'أي مخالفة؟', checking: 'جارٍ فحص الطلب…', checkingP: 'جارٍ البحث عن السجل…',
      weChecked: 'ما فحصناه', notNeeded: 'غير مطلوب', yes: 'نعم', no: 'لا', whatToDo: 'ما الذي تفعله',
      notSolved: 'لم تُحل؟ اسأل المساعد', agent: 'تحدث إلى موظف', toastDone: '{a}: تم (عرض توضيحي)',
      i_shirt: 'قميص كتان', i_mug: 'طقم أكواب خزفية', i_lamp: 'مصباح مكتب', i_buds: 'سماعات لاسلكية', i_case: 'غطاء هاتف', i_shoes: 'حذاء جري', i_tote: 'حقيبة قماشية', i_cream: 'كريم مرطب للوجه',
      req_refund: 'استرداد فقط', req_return: 'إرجاع واسترداد', req_platform: 'تدخلت المنصة',
      st_notShipped: 'لم يُشحن', st_transit: 'قيد التوصيل', st_delivered: 'تم التسليم',
      f_dispute: 'تدخلت المنصة', f_shipped: 'تم الشحن', f_delivered: 'تم التسليم', f_returnReq: 'طُلب الإرجاع', f_paid: 'تم الدفع',
      f_tracking: 'تحديث التتبع خلال 48 ساعة', f_confirmed: 'أكد المشتري الاستلام', f_fixable: 'يمكن إصلاحها بالتعديل', f_window: 'مهلة التظلم مفتوحة',
      v_shippedOn: 'شُحن في {d}', v_deliveredOn: 'سُلّم في {d}', v_lastUpdate: 'آخر تحديث قبل {n} أيام', v_daysLeft: 'متبقٍ {n} أيام', v_hoursLeft: 'متبقٍ {n} ساعات للشحن', v_evidenceDue: 'الأدلة قبل {d}',
      o_approve_t: 'لم يُشحن بعد: وافق على الاسترداد', o_approve_b: 'لا شيء لإرجاعه. يعود المبلغ إلى المشتري فورًا.',
      o_intercept_t: 'في الطريق: أوقف الشحنة ثم استرد', o_intercept_b: 'نطلب من شركة الشحن إعادة الطرد. يكتمل الاسترداد عند وصوله.',
      o_return_t: 'تم التسليم: وافق على الإرجاع', o_return_b: 'أرسل عنوان الإرجاع. استرد المبلغ بعد عودة المنتج وفحصه.',
      o_evidence_t: 'المنصة تراجع الحالة: أضف أدلتك', o_evidence_b: 'ارفع الصور أو المحادثات أو التتبع قبل {d}. يتخذ الموظف القرار النهائي.',
      o_ship_t: 'اشحن خلال 8 ساعات', o_ship_b: 'بعد الموعد يُحتسب شحنًا متأخرًا. لن تلحق؟ أبلغ عن التأخير الآن.',
      o_stuck_t: 'توقف التتبع: اسأل شركة الشحن', o_stuck_b: 'لا تحديث منذ 3 أيام. نطلب من شركة الشحن التحقق ونُبلغ المشتري.',
      o_confirm_t: 'تم التسليم: يُصرف المبلغ عند التأكيد', o_confirm_b: 'إذا لم يؤكد المشتري، يتأكد الطلب تلقائيًا بعد 7 أيام.',
      o_fix_t: 'عدّل المنتج لرفع المخالفة', o_fix_b: 'احذف العبارة. نعيد الفحص تلقائيًا ونرفع المخالفة.',
      o_appeal_t: 'تظلّم مع إثبات', o_appeal_b: 'أرفق إثباتك، مثل سجل استلام الشحنة أو شهادة. يراجع موظف كل تظلم.',
      a_approve: 'الموافقة على الاسترداد', a_contact: 'راسل المشتري', a_intercept: 'طلب إيقاف الشحنة', a_return: 'موافقة وإرسال العنوان', a_decline: 'رفض مع ذكر السبب',
      a_evidence: 'رفع الأدلة', a_delay: 'الإبلاغ عن تأخير', a_label: 'طباعة ملصق الشحن', a_courier: 'اطلب التحقق من شركة الشحن', a_remind: 'تذكير المشتري',
      a_edit: 'تعديل المنتج', a_appealInstead: 'أفضّل التظلم', a_appeal: 'تظلّم مع أدلة', a_progress: 'متابعة الحالة',
      p_misleading: 'ادعاء مضلل', p_late: 'شحن متأخر', r_rule: 'القاعدة', r_evidence: 'الدليل', r_points: 'النقاط', r_impact: 'الأثر',
      rule_misleading: 'لا يجوز استخدام عبارات مثل «رقم 1» أو «الأفضل في العالم» في المنتجات.', ev_misleading: 'العنوان: «الكريم المرطب رقم 1 في العالم»', imp_hidden: 'مخفي من البحث لمدة 7 أيام',
      rule_late: 'يجب شحن الطلبات خلال 48 ساعة من الدفع.', ev_late: 'شُحن الطلب #5733 متأخرًا 30 ساعة', imp_comp: 'تعويض المشتري بنسبة 5% من الطلب',
      pts: '{n} نقاط', pts0: 'بلا نقاط',
      ap_title: 'أدلتك', ap_submit: 'إرسال التظلم', ap_file_p1: 'شهادة الجائزة.pdf', ap_note_p1: 'العبارة مقتبسة من جائزة في القطاع، والشهادة مرفقة.',
      ap_file_p2: 'سجل استلام الشحنة.jpg', ap_note_p2: 'استلمت شركة الشحن الطرد بعد 30 ساعة من الموعد المحدد.',
      sub_t: 'تم إرسال التظلم: قيد المراجعة', sub_b: 'يراجع موظف كل تظلم، عادةً خلال 1–3 أيام.',
      pr_submitted: 'أُرسل', pr_review: 'مراجعة الموظف', pr_now: 'قيد المعالجة', pr_result: 'النتيجة', pr_none: 'لا توجد تظلمات بعد. افحص مخالفة أولًا.', pr_open: 'فحص المخالفات',
      bot: 'المساعد', greet: 'مرحبًا! ما المشكلة؟ اختر خيارًا أو اكتبها بكلماتك.',
      greetCtx: 'فحصت {case}. النتيجة: {outcome}. ما الذي لم يُحل بعد؟', else: 'شيء آخر',
      matched: 'يبدو أنها «{sit}». دعني أتحقق لك.', open: 'فتح: {tool}',
      fallback: 'لم أفهم تمامًا. اختر أحد الخيارات أو تحدث إلى موظف.',
      helpful: 'هل حُلت المشكلة؟', ok: 'نعم، شكرًا', notOk: 'ليس بعد', glad: 'رائع، يسعدني أنها حُلت.', toAgent: 'سأحوّلك إلى موظف.',
      inputPh: 'اكتب رسالة', send: 'إرسال',
      fr_noIntercept: 'شركة الشحن لا تستطيع إيقافها', fr_noIntercept_a: 'دعها تصل إذن. إذا رفض المشتري الطرد، يعود إليك ويكتمل الاسترداد تلقائيًا.',
      fr_disagree: 'المشتري غير موافق', fr_disagree_a: 'يمكن لأي منكما طلب تدخل المنصة. تضيف أدلتك ويقرر الموظف.',
      fr_courier: 'شركة الشحن لا ترد', fr_courier_a: 'أبلغت شركة الشحن. ستصلك إجابة هنا خلال 24 ساعة.',
      fr_when: 'متى أعرف النتيجة؟', fr_when_a: 'تُراجع التظلمات خلال 1–3 أيام. سنرسل لك رسالة، ويمكنك المتابعة في أي وقت.',
      queue: 'ترتيبك في الانتظار: {n}', joined: 'انضمت {name} إلى المحادثة', agentName: 'ميا',
      hiCtx: 'مرحبًا، أنا {name}. أرى {case} والفحوصات التي أجريتها. لا داعي للتكرار، سأتولى الأمر.',
      hi: 'مرحبًا، أنا {name}. كيف أساعدك؟', noted: 'شكرًا، أضفت ذلك إلى حالتك.',
      closing: 'لا رد منذ مدة. ستُغلق المحادثة خلال {s} ث.', ended: 'انتهت المحادثة.', home: 'العودة إلى مركز الخدمة',
      j_self: 'خدمة ذاتية', j_bot: 'المساعد', j_agent: 'موظف', hs_queue: 'في الانتظار', hs_live: 'متصل', hs_closing: 'يُغلق', hs_ended: 'انتهت',
      caseOrder: 'الطلب {code}', casePenalty: 'مخالفة «{p}»', localTag: 'محلي', illus: 'محتوى توضيحي',
      local_deposit: 'تأمين المتجر', local_salestax: 'ضريبة المبيعات', local_vat: 'فواتير الضريبة', local_cod: 'الدفع عند الاستلام',
      region_CN: 'الصين', region_US: 'الولايات المتحدة', region_ES: 'إسبانيا', region_SA: 'السعودية'
    }
  };

  /* Local modules: one per region, written in every language (illustrative content). */
  var ART = {
    en: {
      deposit: { t: 'Store deposit', b: 'Some categories ask for a refundable deposit before you can sell. It protects buyers.', s: ['Check your balance and your category’s minimum', 'Top up if it drops below the minimum', 'Withdraw it after you close the store'] },
      salestax: { t: 'Sales tax', b: 'In many states the platform collects sales tax from buyers and pays it for you.', s: ['See which states we collect for', 'Tax shows as its own line on each order', 'Download a yearly tax report'] },
      vat: { t: 'VAT invoices', b: 'Business buyers can ask for an invoice that shows VAT.', s: ['Add your VAT number in settings', 'An invoice is created when the order ships', 'Buyers download it from the order page'] },
      cod: { t: 'Cash on delivery', b: 'Buyers pay the courier in cash when the parcel arrives.', s: ['Turn on cash on delivery for your store', 'The courier collects the payment at the door', 'The money reaches you once delivery is confirmed'] }
    },
    zh: {
      deposit: { t: '店铺保证金', b: '部分类目需要先缴纳保证金才能经营，用于保障买家权益，可退还。', s: ['查看余额和所在类目的最低额度', '低于最低额度时及时补缴', '关店后可申请解冻提现'] },
      salestax: { t: '销售税', b: '在许多州，平台会向买家代收销售税并代为缴纳。', s: ['查看平台代收的州', '税额在每笔订单中单独列出', '下载年度税务报表'] },
      vat: { t: '增值税发票', b: '企业买家可以申请开具含增值税的发票。', s: ['在设置中填写你的增值税号', '订单发货时自动生成发票', '买家在订单页下载发票'] },
      cod: { t: '货到付款', b: '买家在包裹送达时向快递员支付现金。', s: ['为店铺开通货到付款', '快递员上门时代收货款', '确认签收后货款到账'] }
    },
    es: {
      deposit: { t: 'Depósito de la tienda', b: 'Algunas categorías piden un depósito reembolsable antes de vender. Protege a los compradores.', s: ['Consulta tu saldo y el mínimo de tu categoría', 'Recárgalo si baja del mínimo', 'Retíralo cuando cierres la tienda'] },
      salestax: { t: 'Impuesto sobre las ventas', b: 'En muchos estados, la plataforma cobra el impuesto a los compradores y lo paga por ti.', s: ['Consulta en qué estados lo cobramos', 'El impuesto aparece en una línea aparte de cada pedido', 'Descarga un informe fiscal anual'] },
      vat: { t: 'Facturas con IVA', b: 'Los compradores profesionales pueden pedir una factura con IVA.', s: ['Añade tu número de IVA en la configuración', 'La factura se crea cuando se envía el pedido', 'El comprador la descarga desde la página del pedido'] },
      cod: { t: 'Pago contra reembolso', b: 'El comprador paga en efectivo al transportista cuando llega el paquete.', s: ['Activa el pago contra reembolso en tu tienda', 'El transportista cobra en la puerta', 'El dinero te llega cuando se confirma la entrega'] }
    },
    ar: {
      deposit: { t: 'تأمين المتجر', b: 'تطلب بعض الفئات تأمينًا قابلًا للاسترداد قبل البيع، لحماية المشترين.', s: ['تحقق من رصيدك والحد الأدنى لفئتك', 'أضف رصيدًا إذا انخفض عن الحد الأدنى', 'اسحبه بعد إغلاق المتجر'] },
      salestax: { t: 'ضريبة المبيعات', b: 'في ولايات كثيرة تحصّل المنصة ضريبة المبيعات من المشترين وتدفعها عنك.', s: ['اعرف الولايات التي نحصّل فيها الضريبة', 'تظهر الضريبة في سطر مستقل في كل طلب', 'نزّل تقريرًا ضريبيًا سنويًا'] },
      vat: { t: 'فواتير ضريبة القيمة المضافة', b: 'يمكن للمشترين من الشركات طلب فاتورة تتضمن ضريبة القيمة المضافة.', s: ['أضف رقمك الضريبي في الإعدادات', 'تُنشأ الفاتورة عند شحن الطلب', 'ينزّلها المشتري من صفحة الطلب'] },
      cod: { t: 'الدفع عند الاستلام', b: 'يدفع المشتري نقدًا لمندوب الشحن عند وصول الطرد.', s: ['فعّل الدفع عند الاستلام لمتجرك', 'يحصّل المندوب المبلغ عند الباب', 'يصلك المبلغ بعد تأكيد التسليم'] }
    }
  };

  /* ---------------- Explanations (English / 中文) ---------------- */
  var C = {
    en: {
      title: 'Seller Service Center', demo: 'Demo data', region: 'Region', lang: 'Language', yes: 'Yes', no: 'No',
      hint: 'Pick a tool and watch it check the order, then ask the assistant or an agent. Switch language or region to see the site adapt.',
      tabLogic: 'Logic', tabCat: 'Categories', tabLang: 'Languages',
      lh_t: 'From self-service to a person', lh_b: 'Every question starts in self-service and reaches a person only when it needs one.',
      lh_1t: 'Self-service', lh_1b: 'Tools read the order and run the checks an agent would run. Articles explain the rules.',
      lh_2t: 'Assistant', lh_2b: 'Guided options first, free text as a fallback. It already knows what you checked.',
      lh_3t: 'Agent', lh_3b: 'Only for steps that need an agent’s permission, or when you ask. The case arrives with its history.',
      lh_try: 'Try it', lh_try1: 'Buyer wants money back: pick a different order each time', lh_try2: 'The order #5830 notice: help before the merchant asks', lh_try3: 'Penalty check: see what used to be agent-only',
      sop: 'SOP', flow: 'Flow', rules: 'Rules', before: 'Before', now: 'Now', whoRuns: 'Who runs each step',
      vis_merchant: 'Merchant sees it', vis_agent: 'Agent only',
      beforeNote: 'Before: the merchant asked, and an agent ran every step in the back office.',
      now_refund: 'Now: the merchant sees every check. Only the ruling in a dispute needs an agent.',
      now_order: 'Now: fully self-service. An agent is a fallback, not a step.',
      now_penalty: 'Now: the record, rule, evidence and impact are all shown. Only the appeal review needs an agent.',
      pickHint: 'Pick a case in the product to run the checks.',
      start_refund: 'Merchant: “The buyer wants money back.”', start_order: 'Merchant: “What’s going on with this order?”', start_penalty: 'Merchant: “Why was I penalised?”',
      col_step: '#', col_factor: 'Factor · source', col_when: 'When', col_then: 'Then', col_owner: 'Owner · visible to',
      otherwise: 'Otherwise', always: 'Always', show: 'Show to merchant',
      configNote: 'Operations set these rules in a configurator. The same factors drive the tool, the assistant and the agent’s view.',
      out_approve: 'Approve refund', out_intercept: 'Intercept, then refund', out_return: 'Agree to return', out_partial: 'Partial refund or ask for photos',
      out_evidence: 'Merchant adds evidence', out_ruling: 'Ruling', out_unpaid: 'Wait for payment', out_ship: 'Ship or report a delay',
      out_stuck: 'Ask the courier to check', out_confirm: 'Auto-confirm in 7 days', out_done: 'Completed',
      out_fix: 'Edit listing, auto re-check', out_appeal: 'Merchant appeals with proof', out_review: 'Appeal review', out_result: 'Result and progress', out_closed: 'Window closed: explain the rule',
      look_record: 'Penalty record', look_rule: 'Rule and evidence', look_impact: 'Points and impact',
      fq_dispute: 'Platform stepped in?', fq_shipped: 'Shipped?', fq_delivered: 'Delivered?', fq_returnReq: 'Return requested?', fq_paid: 'Paid?',
      fq_tracking: 'Tracking updated in 48 h?', fq_confirmed: 'Buyer confirmed?', fq_fixable: 'Fixable by editing?', fq_window: 'Appeal window open?',
      ctx_bot: 'What the assistant already knows', ctx_agent: 'What the agent sees',
      ctx_none: 'Nothing yet: the merchant came straight to chat, so the assistant starts with guided options.',
      ctx_merchant: 'Merchant', ctx_site: 'Site', ctx_path: 'Path', ctx_tool: 'Tool', ctx_case: 'Case', ctx_checks: 'Checks', ctx_result: 'Result',
      ctx_actions: 'Actions taken', ctx_last: 'Last message', ctx_noAct: 'None yet', ctx_noMsg: '—',
      ctx_note: 'The case moves with its context, so the merchant never repeats themselves.', store: 'Demo Store',
      cat_t: 'Sorted by the merchant’s situation, not by team',
      cat_b: 'Teams name problems after themselves: refunds, logistics, disputes. A merchant only knows what happened: the buyer wants money back. One refund question sat under three teams.',
      cat_view: 'Home page sorted by', cat_sit: 'Situation · now', cat_team: 'Team · before',
      cat_teams: 'Teams behind it', cat_routed: 'Routed by', cat_try: 'Try it',
      cat_sitNote: 'One entry per situation. The tool reads the order’s facts and routes to the right team’s rules, so the merchant never picks a team.',
      cat_teamNote: 'The same question had several homes, and the merchant had to guess which tab was right.',
      cat_q: 'Question', cat_in: 'in {n} teams',
      sl_refund: 'A buyer wants money back', sl_order: 'An order is stuck', sl_penalty: 'I got a penalty',
      lg_t: 'One product for every site', lg_formula: 'Product + Region + Language = the page you see',
      lg_region: 'Region: content and format', lg_lang: 'Language: text and layout',
      lg_currency: 'Currency', lg_date: 'Date', lg_local: 'Local module',
      lg_font: 'Font size', lg_len: 'Text length', lg_align: 'Direction', lg_layout: 'Tool layout',
      len_short: 'Short', len_medium: 'Medium', len_long: 'Long', dir_ltr: 'Left to right', dir_rtl: 'Right to left',
      lay_short: '4-column grid', lay_medium: '2 columns', lay_long: 'One per row',
      lg_rules: 'Layout rules by language', lg_rulesNote: 'Chinese takes the English size minus 2 px. Tool and category columns keep a fixed width; the content stretches to fill the rest.',
      lg_r_en: 'English, German, French, Italian', lg_r_zh: 'Chinese', lg_r_es: 'Spanish, Portuguese', lg_r_ar: 'Arabic',
      lg_core: 'Global core', lg_coreB: 'Same on every site: self-service tools, common questions, assistant, agent.',
      lg_ext: 'Local extension', lg_extB: 'Each region adds its own modules for tax, payment and logistics.',
      lg_scale: 'In production: 20+ regions and 8 languages. The demo shows four of each.',
      region_CN: 'China', region_US: 'United States', region_ES: 'Spain', region_SA: 'Saudi Arabia'
    },
    zh: {
      title: '商家服务大厅', demo: '演示数据', region: '地区', lang: '语言', yes: '是', no: '否',
      hint: '选一个工具，看它如何检查订单；再试试智能助手和人工客服。切换语言或地区，看页面如何适配。',
      tabLogic: '逻辑', tabCat: '分类', tabLang: '多语言',
      lh_t: '从自助到人工', lh_b: '每个问题都从自助开始，只有真正需要时才转到人工。',
      lh_1t: '自助', lh_1b: '工具直接读取订单，跑一遍小二会做的检查；文章负责解释规则。',
      lh_2t: '智能助手', lh_2b: '先给引导选项，自由输入兜底；它知道你已经查过什么。',
      lh_3t: '人工', lh_3b: '只在需要小二权限的节点，或用户主动要求时介入；工单带着上下文过去。',
      lh_try: '试一试', lh_try1: '买家要退款：每次选不同的订单', lh_try2: '订单 #5830 提醒：在商家开口之前提供帮助', lh_try3: '违规查询：看看以前只有小二能看的信息',
      sop: 'SOP', flow: '流程', rules: '规则', before: '以前', now: '现在', whoRuns: '每一步由谁处理',
      vis_merchant: '商家可见', vis_agent: '仅小二',
      beforeNote: '以前：商家来问，小二在后台把每一步走一遍。',
      now_refund: '现在：每个校验点都展示给商家，只有纠纷判定需要小二。',
      now_order: '现在：全程自助，人工只是兜底，不是必经节点。',
      now_penalty: '现在：处罚记录、规则、证据和影响全部公开，只有申诉审核需要小二。',
      pickHint: '在左侧产品里选一个案例，开始检查。',
      start_refund: '商家：“买家要退款。”', start_order: '商家：“这个订单怎么了？”', start_penalty: '商家：“我为什么被处罚？”',
      col_step: '#', col_factor: '因子 · 数据来源', col_when: '条件', col_then: '下一步', col_owner: '归属 · 可见',
      otherwise: '否则', always: '始终', show: '展示给商家',
      configNote: '运营在规则配置器里配置这些规则；同一套因子同时驱动自助工具、智能助手和小二工作台。',
      out_approve: '同意退款', out_intercept: '先拦截，再退款', out_return: '同意退货', out_partial: '部分退款或要求补充照片',
      out_evidence: '商家提交凭证', out_ruling: '判定', out_unpaid: '等待付款', out_ship: '发货或报备延迟',
      out_stuck: '请快递核查', out_confirm: '7 天后自动确认', out_done: '已完成',
      out_fix: '修改商品，自动复检', out_appeal: '商家提交证明申诉', out_review: '申诉审核', out_result: '结果与进度', out_closed: '申诉期已过：解释规则',
      look_record: '处罚记录', look_rule: '规则与证据', look_impact: '扣分与影响',
      fq_dispute: '平台已介入？', fq_shipped: '已发货？', fq_delivered: '已签收？', fq_returnReq: '要求退货？', fq_paid: '已付款？',
      fq_tracking: '48 小时内有物流更新？', fq_confirmed: '买家已确认收货？', fq_fixable: '可修改解除？', fq_window: '仍在申诉期？',
      ctx_bot: '智能助手已经知道的', ctx_agent: '小二看到的',
      ctx_none: '暂无：商家直接进入对话，助手从引导选项开始。',
      ctx_merchant: '商家', ctx_site: '站点', ctx_path: '路径', ctx_tool: '工具', ctx_case: '案例', ctx_checks: '检查结果', ctx_result: '结论',
      ctx_actions: '已执行操作', ctx_last: '最后一条消息', ctx_noAct: '暂无', ctx_noMsg: '—',
      ctx_note: '工单带着上下文流转，商家不用重复描述。', store: '演示店铺',
      cat_t: '按商家遇到的情况分类，而不是按业务团队',
      cat_b: '业务方习惯按自己的语义命名问题：退款、物流、纠纷。商家只知道发生了什么：买家要退钱。同一个退款问题，曾经分属三个团队。',
      cat_view: '首页分类方式', cat_sit: '按情况 · 现在', cat_team: '按团队 · 以前',
      cat_teams: '背后的团队', cat_routed: '分流依据', cat_try: '试一试',
      cat_sitNote: '每种情况只有一个入口。工具读取订单事实，再路由到对应团队的规则，商家不用自己判断该找哪个团队。',
      cat_teamNote: '同一个问题挂在好几个分类下，商家只能猜哪个才是对的。',
      cat_q: '问题', cat_in: '出现在 {n} 个团队',
      sl_refund: '买家要退款', sl_order: '订单卡住了', sl_penalty: '收到处罚',
      lg_t: '一套产品，适配所有站点', lg_formula: '产品 + 地区 + 语言 = 你看到的页面',
      lg_region: '地区：决定内容和格式', lg_lang: '语言：决定文字和布局',
      lg_currency: '货币', lg_date: '日期', lg_local: '本地模块',
      lg_font: '字号', lg_len: '文本长度', lg_align: '方向', lg_layout: '工具布局',
      len_short: '短', len_medium: '中', len_long: '长', dir_ltr: '从左到右', dir_rtl: '从右到左',
      lay_short: '四列宫格', lay_medium: '两列', lay_long: '每行一个',
      lg_rules: '各语言的布局规则', lg_rulesNote: '中文以英文为基准，字号减 2 px。工具、类目列固定宽度，其余内容弹性撑满。',
      lg_r_en: '英语、德语、法语、意大利语', lg_r_zh: '中文', lg_r_es: '西班牙语、葡萄牙语', lg_r_ar: '阿拉伯语',
      lg_core: '全球统一', lg_coreB: '所有站点一致：自助工具、常见问题、智能助手、人工客服。',
      lg_ext: '本地扩展', lg_extB: '各地区按需增加税务、支付、物流等本地模块。',
      lg_scale: '线上版本：20+ 个地区、8 种语言。演示各选了 4 个。',
      region_CN: '中国', region_US: '美国', region_ES: '西班牙', region_SA: '沙特阿拉伯'
    }
  };

  var ICON = {
    refund: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v3.8h3.8"/><path d="M14.4 9.6c-.4-.9-1.3-1.4-2.4-1.4-1.4 0-2.4.8-2.4 1.9 0 2.6 4.9 1.4 4.9 4 0 1.1-1.1 1.9-2.5 1.9-1.1 0-2.1-.5-2.5-1.4M12 7v1.2M12 15.9v1.2"/>',
    order: '<path d="M3.8 7.6 12 3.2l8.2 4.4v8.8L12 20.8l-8.2-4.4z"/><path d="M3.8 7.6 12 12l8.2-4.4M12 12v8.8"/>',
    penalty: '<path d="M12 3.2 5 6v5.6c0 4.3 3 7.9 7 9.2 4-1.3 7-4.9 7-9.2V6z"/><path d="M12 8.2v4.6M12 15.8v.2"/>',
    local: '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2M12 3.4c2.4 2.4 3.4 5.4 3.4 8.6s-1 6.2-3.4 8.6c-2.4-2.4-3.4-5.4-3.4-8.6s1-6.2 3.4-8.6z"/>',
    progress: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3 2"/>',
    assistant: '<path d="M4.2 5.4h15.6v10.2H9.4l-5.2 4z"/><path d="M8.6 10.5h.01M12 10.5h.01M15.4 10.5h.01"/>',
    agent: '<circle cx="12" cy="8.2" r="3.8"/><path d="M4.6 20.4c0-3.9 3.3-6.4 7.4-6.4s7.4 2.5 7.4 6.4"/>',
    search: '<circle cx="11" cy="11" r="6.4"/><path d="m15.8 15.8 4.2 4.2"/>',
    back: '<path d="M14.8 5.2 8 12l6.8 6.8"/>', chev: '<path d="M9.2 5.2 16 12l-6.8 6.8"/>',
    check: '<path d="M5 12.6 9.4 17 19 7.4"/>', minus: '<path d="M6.5 12h11"/>', dash: '<path d="M8 12h8" stroke-dasharray="2 2.5"/>',
    lock: '<rect x="5.4" y="10.6" width="13.2" height="9.4" rx="2"/><path d="M8.6 10.6V8.2a3.4 3.4 0 0 1 6.8 0v2.4"/>',
    eye: '<path d="M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="2.8"/>',
    send: '<path d="M4.4 12 19.6 4.6l-5.4 15-2.6-6.3z"/>', file: '<path d="M7 3.4h7l4 4v13.2H7z"/><path d="M14 3.4v4h4"/>',
    bell: '<path d="M6.4 16.4V11a5.6 5.6 0 0 1 11.2 0v5.4l1.6 1.8H4.8z"/><path d="M10 20.6a2.2 2.2 0 0 0 4 0"/>'
  };
  function ico(n, cls) { return '<svg class="hx-i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICON[n] + '</svg>'; }
  function fill(s, v) { if (v) Object.keys(v).forEach(function (k) { s = s.split('{' + k + '}').join(v[k]); }); return s; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }

  /* ---------------- Surfaces: Help Center website, Seller Center plugin, mobile app ---------------- */
  var SURFACES = ['web', 'plugin', 'app'];
  var PAGES = ['home', 'orders', 'after', 'pen'];
  var PAGE_ICON = { home: 'home', orders: 'order', after: 'refund', pen: 'penalty' };
  /* URL group: the plugin puts the tool for the page it sits on first. */
  var PAGE_TOOL = { orders: 'order', after: 'refund', pen: 'penalty' };
  var PAGE_TAB = { home: 0, orders: 1, after: 0, pen: 2 };
  var PAGE_PATH = { home: 'home', orders: 'orders', after: 'after-sales', pen: 'penalties' };
  var FRAME_H = 600, FRAME_MIN = 900;

  var PX = {
    en: {
      hello2: 'Seller Service Center, here to help', minimize: 'Minimize',
      hot_refund: 'Refund requests', hot_order: 'Shipping deadline', hot_penalty: 'Appeal a penalty',
      onPage: 'On this page', op_orders: '1 order is close to its shipping deadline', op_after: '{n} refund requests waiting', op_pen: '{n} open penalties',
      ball_help: 'Help', ball_live: 'With agent',
      botSub: 'Automated help', agentSub: 'Human support', queueSub: 'In line · number {n}', closingSub: 'Closes in {s} s',
      qa_order: 'Send order', qa_image: 'Send image', qa_agent: 'Agent', qa_end: 'End service',
      imgName: 'photo.jpg', agentCard: 'Official agent 0816', returnSoon: 'An agent has joined. Come back to the chat.',
      orderChecked: 'I checked {case}. Result: {outcome}.', imgBot: 'Thanks. I can’t read photos, but an agent can. Shall I bring one in?',
      w_nav_kb: 'Knowledge base', w_banner: 'Seller Service Center, here to help!', w_topicsSit: 'Browse by situation', w_topicsTeam: 'Browse by team',
      w_progress: 'Service progress', w_review: 'Appeals under review', w_online: 'Online service', w_onlineB: 'The assistant first; an agent when you need one.', w_chat: 'Chat now', crumb: 'Service Center',
      sc_name: 'Seller Center', nav_home: 'Home', nav_orders: 'Orders', nav_after: 'After-sales', nav_pen: 'Penalties',
      sc_hi: 'Good morning, Demo Store', stat_ship: 'To ship', stat_refund: 'Refund requests', stat_pen: 'Open penalties',
      th_order: 'Order', th_item: 'Item', th_amount: 'Amount', th_status: 'Status', th_request: 'Request', th_penalty: 'Penalty', th_subject: 'Listing or order', th_points: 'Points', th_impact: 'Impact', getHelp: 'Get help'
    },
    zh: {
      hello2: '商家服务大厅，为您服务', minimize: '收起',
      hot_refund: '退款申请', hot_order: '发货时限', hot_penalty: '处罚申诉',
      onPage: '当前页面', op_orders: '1 笔订单快到发货时限', op_after: '{n} 个退款申请待处理', op_pen: '{n} 条处罚记录',
      ball_help: '帮助', ball_live: '人工中',
      botSub: '智能客服', agentSub: '人工客服', queueSub: '排队中 · 第 {n} 位', closingSub: '{s} 秒后断开',
      qa_order: '发送订单', qa_image: '发送图片', qa_agent: '人工', qa_end: '结束服务',
      imgName: '图片.jpg', agentCard: '官方客服 0816', returnSoon: '人工客服已接入，请尽快返回对话。',
      orderChecked: '我查了{case}，结果：{outcome}。', imgBot: '收到图片。我看不了图片，人工客服可以帮你看，需要转人工吗？',
      w_nav_kb: '知识库', w_banner: '商家服务大厅，为您服务！', w_topicsSit: '按情况查找', w_topicsTeam: '按团队查找',
      w_progress: '服务进度', w_review: '审核中的申诉', w_online: '在线服务', w_onlineB: '先由智能助手解答，需要时转人工。', w_chat: '立即咨询', crumb: '服务大厅',
      sc_name: '商家中心', nav_home: '首页', nav_orders: '订单管理', nav_after: '售后管理', nav_pen: '违规处罚',
      sc_hi: '早上好，演示店铺', stat_ship: '待发货', stat_refund: '退款申请', stat_pen: '处罚记录',
      th_order: '订单', th_item: '商品', th_amount: '金额', th_status: '状态', th_request: '申请类型', th_penalty: '处罚', th_subject: '商品或订单', th_points: '扣分', th_impact: '影响', getHelp: '求助'
    },
    es: {
      hello2: 'Centro de servicio al vendedor, a tu servicio', minimize: 'Minimizar',
      hot_refund: 'Reembolsos', hot_order: 'Plazo de envío', hot_penalty: 'Apelar una sanción',
      onPage: 'En esta página', op_orders: '1 pedido está a punto de superar el plazo de envío', op_after: '{n} solicitudes de reembolso pendientes', op_pen: '{n} sanciones abiertas',
      ball_help: 'Ayuda', ball_live: 'Con agente',
      botSub: 'Ayuda automática', agentSub: 'Atención personal', queueSub: 'En cola · puesto {n}', closingSub: 'Se cierra en {s} s',
      qa_order: 'Enviar pedido', qa_image: 'Enviar imagen', qa_agent: 'Agente', qa_end: 'Finalizar',
      imgName: 'foto.jpg', agentCard: 'Agente oficial 0816', returnSoon: 'Un agente se ha unido. Vuelve al chat.',
      orderChecked: 'Revisé {case}. Resultado: {outcome}.', imgBot: 'Gracias. No puedo leer fotos, pero un agente sí. ¿Te paso con uno?',
      w_nav_kb: 'Base de conocimiento', w_banner: 'Centro de servicio al vendedor, ¡a tu servicio!', w_topicsSit: 'Buscar por situación', w_topicsTeam: 'Buscar por equipo',
      w_progress: 'Estado del servicio', w_review: 'Apelaciones en revisión', w_online: 'Atención en línea', w_onlineB: 'Primero el asistente; un agente cuando lo necesites.', w_chat: 'Chatear ahora', crumb: 'Centro de servicio',
      sc_name: 'Centro del vendedor', nav_home: 'Inicio', nav_orders: 'Pedidos', nav_after: 'Posventa', nav_pen: 'Sanciones',
      sc_hi: 'Buenos días, Tienda Demo', stat_ship: 'Por enviar', stat_refund: 'Solicitudes de reembolso', stat_pen: 'Sanciones abiertas',
      th_order: 'Pedido', th_item: 'Artículo', th_amount: 'Importe', th_status: 'Estado', th_request: 'Solicitud', th_penalty: 'Sanción', th_subject: 'Anuncio o pedido', th_points: 'Puntos', th_impact: 'Efecto', getHelp: 'Ayuda'
    },
    ar: {
      hello2: 'مركز خدمة البائعين في خدمتك', minimize: 'تصغير',
      hot_refund: 'طلبات الاسترداد', hot_order: 'موعد الشحن', hot_penalty: 'التظلم من مخالفة',
      onPage: 'في هذه الصفحة', op_orders: 'طلب واحد اقترب موعد شحنه', op_after: '{n} طلبات استرداد بانتظارك', op_pen: '{n} مخالفات مفتوحة',
      ball_help: 'مساعدة', ball_live: 'مع موظف',
      botSub: 'مساعدة آلية', agentSub: 'دعم بشري', queueSub: 'في الانتظار · الترتيب {n}', closingSub: 'تُغلق خلال {s} ث',
      qa_order: 'إرسال طلب', qa_image: 'إرسال صورة', qa_agent: 'موظف', qa_end: 'إنهاء الخدمة',
      imgName: 'صورة.jpg', agentCard: 'الموظف الرسمي 0816', returnSoon: 'انضم موظف. عد إلى المحادثة.',
      orderChecked: 'فحصت {case}. النتيجة: {outcome}.', imgBot: 'شكرًا. لا أستطيع قراءة الصور، لكن الموظف يستطيع. هل أحوّلك إليه؟',
      w_nav_kb: 'قاعدة المعرفة', w_banner: 'مركز خدمة البائعين في خدمتك!', w_topicsSit: 'تصفح حسب الحالة', w_topicsTeam: 'تصفح حسب الفريق',
      w_progress: 'متابعة الخدمة', w_review: 'تظلمات قيد المراجعة', w_online: 'الخدمة المباشرة', w_onlineB: 'المساعد أولًا، وموظف عند الحاجة.', w_chat: 'ابدأ المحادثة', crumb: 'مركز الخدمة',
      sc_name: 'مركز البائع', nav_home: 'الرئيسية', nav_orders: 'الطلبات', nav_after: 'ما بعد البيع', nav_pen: 'المخالفات',
      sc_hi: 'صباح الخير، متجر تجريبي', stat_ship: 'بانتظار الشحن', stat_refund: 'طلبات الاسترداد', stat_pen: 'مخالفات مفتوحة',
      th_order: 'الطلب', th_item: 'المنتج', th_amount: 'المبلغ', th_status: 'الحالة', th_request: 'نوع الطلب', th_penalty: 'المخالفة', th_subject: 'المنتج أو الطلب', th_points: 'النقاط', th_impact: 'الأثر', getHelp: 'مساعدة'
    }
  };
  var CX = {
    en: {
      surface: 'Surface', sf_web: 'Website', sf_plugin: 'Plugin', sf_app: 'App',
      st_self: 'Self-service', st_bot: 'Assistant', st_agent: 'Agent',
      hs_queue: 'In line', hs_live: 'Connected', hs_closing: 'Closing', hs_ended: 'Ended',
      hint_web: 'The Help Center website. Pick a tool or a question, or chat with us.',
      hint_plugin: 'The help plugin inside Seller Center. Click Help, or Get help on any row. Switch pages and the plugin follows.',
      hint_app: 'The mobile app. Same content and tools, phone layout.',
      hint_narrow: 'Shown scaled down; best on a larger screen.',
      lp_t: 'Where the merchant is', lp_web: 'On the Help Center website: tools, topics, service progress and online service on one page.',
      lp_plugin: 'In Seller Center, on the {page} page. The plugin reads the page’s URL group and puts that page’s tools first.',
      lp_app: 'In the mobile app: the same tools and topics, in a phone layout.',
      lp_one: 'One content system, three surfaces: website, plugin and app share the tools, topics and chat.',
      ctx_entry: 'Entry', entry_web: 'Help Center website', entry_plugin: 'Plugin · {page} page', entry_app: 'Mobile app'
    },
    zh: {
      surface: '端', sf_web: '网站', sf_plugin: '插件', sf_app: 'App',
      st_self: '自助', st_bot: '智能助手', st_agent: '人工',
      hs_queue: '排队中', hs_live: '服务中', hs_closing: '即将结束', hs_ended: '已结束',
      hint_web: '服务大厅网站：选一个工具或问题，或者直接咨询。',
      hint_plugin: '商家中心里的帮助插件：点右下角“帮助”，或任意一行的“求助”。切换页面，插件内容跟着变。',
      hint_app: '移动端 App：同一套内容和工具，手机布局。',
      hint_narrow: '已缩小显示，建议在大屏查看。',
      lp_t: '商家在哪里', lp_web: '服务大厅网站：工具、问题分类、服务进度和在线服务都在一页。',
      lp_plugin: '在商家中心的“{page}”页面。插件读取当前页面的 URL 分组，把这一页相关的工具放在最前面。',
      lp_app: '移动端 App：同样的工具和问题分类，手机布局。',
      lp_one: '一套内容，三个端：网站、插件、App 共用工具、问题分类和对话。',
      ctx_entry: '入口', entry_web: '服务大厅网站', entry_plugin: '插件 · {page}页', entry_app: '移动端 App'
    }
  };
  LANGS.forEach(function (L) { Object.keys(PX[L]).forEach(function (k) { P[L][k] = PX[L][k]; }); });
  ['en', 'zh'].forEach(function (L) { Object.keys(CX[L]).forEach(function (k) { C[L][k] = CX[L][k]; }); });
  ICON.home = '<path d="M4 11 12 4.5 20 11v8.5h-5.5v-5h-5v5H4z"/>';
  ICON.min = '<path d="M6 12h12"/>';
  ICON.help = '<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6M12 16.6v.2"/>';
  ICON.image = '<rect x="3.6" y="5" width="16.8" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4.5 17.5 5-4.5 3.5 3 2.5-2 4 3.5"/>';

  Array.prototype.forEach.call(hosts, init);

  function init(host) {
    var narrow = host.clientWidth < 760;
    var S = {
      surface: narrow ? 'app' : 'plugin', page: 'orders', panel: false,
      lang: 'en', region: 'US', view: 'home', tool: null, id: null, phase: 'pick', shown: 0, justResult: false,
      cat: 'sit', ftab: narrow ? 0 : PAGE_TAB.orders, query: '', tab: 'logic', exposure: 'now', sopView: 'flow',
      override: {}, appealed: {}, done: {}, sheet: false,
      chatOn: false, chat: [], stage: 'bot', from: null, human: null, unread: 0, draft: '', scrollChat: false
    };
    var timers = { check: null, later: [], idle: null, cd: null, toast: null };

    /* ---------- text helpers ---------- */
    function pl(L, k, v) { var s = P[L][k]; if (s == null) s = P.en[k]; return s == null ? k : fill(s, v); }
    function p(k, v) { return pl(S.lang, k, v); }
    function cl() { return S.lang === 'zh' ? 'zh' : 'en'; }
    function c(k, v) { var s = C[cl()][k]; if (s == null) s = C.en[k]; return s == null ? k : fill(s, v); }
    function loc(L) { return L === 'ar' ? 'ar-' + S.region + '-u-nu-latn' : L + '-' + S.region; }
    function money(usd, L) {
      var r = REG[S.region], v = Math.round(usd * r.rate * 100) / 100;
      try { return new Intl.NumberFormat(loc(L), { style: 'currency', currency: r.cur }).format(v); } catch (e) { return r.cur + ' ' + v.toFixed(2); }
    }
    function moneySample(L) { var r = REG[S.region]; try { return new Intl.NumberFormat(loc(L), { style: 'currency', currency: r.cur }).format(1234.5); } catch (e) { return r.cur + ' 1234.50'; } }
    function date(day, L) {
      var d = new Date(TODAY[0], TODAY[1], TODAY[2] + (day || 0));
      try { return new Intl.DateTimeFormat(loc(L), { month: 'short', day: 'numeric' }).format(d); } catch (e) { return d.toDateString(); }
    }
    function num(n, L) { try { return new Intl.NumberFormat(loc(L || S.lang)).format(n); } catch (e) { return String(n); } }
    function mmss(s) { return num(0) + ':' + (s < 10 ? num(0) : '') + num(s); }

    /* ---------- case helpers ---------- */
    function caseOf(tool, id) { var l = CASES[tool] || []; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
    function cur() { return S.tool && S.id ? caseOf(S.tool, S.id) : null; }
    function subjectOf(cs, L) { return cs.subject.charAt(0) === '#' ? pl(L, 'caseOrder', { code: '<bdi>' + cs.subject + '</bdi>' }) : pl(L, cs.subject); }
    function caseLabel(tool, cs, L) { return tool === 'penalty' ? pl(L, 'casePenalty', { p: pl(L, cs.type) }) : pl(L, 'caseOrder', { code: '<bdi>' + cs.code + '</bdi>' }); }
    function V(cs, f, L) {
      var v = cs.f[f];
      switch (f) {
        case 'dispute': return v ? pl(L, 'v_evidenceDue', { d: date(cs.dueDay, L) }) : pl(L, 'no');
        case 'shipped': return v ? pl(L, 'v_shippedOn', { d: date(cs.shipDay, L) }) : pl(L, 'no') + (cs.hoursLeft ? ' · ' + pl(L, 'v_hoursLeft', { n: num(cs.hoursLeft, L) }) : '');
        case 'delivered': return v ? pl(L, 'v_deliveredOn', { d: date(cs.delDay, L) }) : pl(L, 'no') + ' · ' + pl(L, 'st_transit');
        case 'returnReq': return v ? pl(L, 'req_return') : pl(L, 'req_refund');
        case 'tracking': return v ? pl(L, 'yes') : pl(L, 'no') + ' · ' + pl(L, 'v_lastUpdate', { n: num(cs.lastUpd, L) });
        case 'window': return v ? pl(L, 'v_daysLeft', { n: num(cs.daysLeft, L) }) : pl(L, 'no');
        default: return pl(L, v ? 'yes' : 'no');
      }
    }
    function lookVal(k, cs, L) {
      if (k === 'record') return pl(L, cs.type) + ' · ' + subjectOf(cs, L);
      if (k === 'rule') return pl(L, cs.ev);
      return (cs.points ? pl(L, 'pts', { n: num(cs.points, L) }) : pl(L, 'pts0')) + ' · ' + pl(L, cs.imp);
    }
    /* Walk the SOP: check factors in order until one decides the next step. */
    function evaluate(tool, cs) {
      var dec = SOP[tool].dec, steps = [], out = null;
      var appealing = tool === 'penalty' && (S.override[cs.id] || S.appealed[cs.id]);
      for (var i = 0; i < dec.length; i++) {
        var d = dec[i], v = !!cs.f[d.f];
        if (appealing && d.f === 'fixable') { steps.push({ i: i, f: d.f, v: v }); continue; }
        if (v === d.exit) { steps.push({ i: i, f: d.f, v: v, decisive: true, taken: 'exit' }); out = d.out; break; }
        if (d.alt) { steps.push({ i: i, f: d.f, v: v, decisive: true, taken: 'alt' }); out = d.alt; break; }
        steps.push({ i: i, f: d.f, v: v });
      }
      return { steps: steps, out: out };
    }
    function outcome(tool, cs) { if (tool === 'penalty' && S.appealed[cs.id]) return 'review'; return evaluate(tool, cs).out; }
    function outcomeTitle(tool, cs, L) { var o = outcome(tool, cs); return o === 'review' ? pl(L, 'sub_t') : pl(L, 'o_' + o + '_t'); }
    function stepOf(ev, i) { for (var j = 0; j < ev.steps.length; j++) if (ev.steps[j].i === i) return ev.steps[j]; return null; }
    function looks(tool) { return tool === 'penalty' ? 4 : 0; }
    function total(tool, cs) { return looks(tool) + evaluate(tool, cs).steps.length; }
    function chainOf(sop, o) { var out = [o], x = sop.outs[o]; while (x && x.next) { out.push(x.next); x = sop.outs[x.next]; } return out; }
    function currentNode(tool, cs) {
      if (!cs) return null;
      if (tool === 'penalty' && S.appealed[cs.id]) return 'review';
      if (tool === 'refund' && (S.done[cs.id] || []).indexOf('a_evidence') >= 0) return 'ruling';
      return null;
    }
    function route(text) {
      var t = text.toLowerCase(), keys = ['refund', 'penalty', 'order'];
      for (var i = 0; i < keys.length; i++) for (var j = 0; j < KW[keys[i]].length; j++) if (t.indexOf(KW[keys[i]][j]) >= 0) return keys[i];
      return null;
    }
    function humanOn() { return !!(S.human && S.human.st !== 'ended'); }
    function chatHidden() { return !S.chatOn || (S.surface === 'plugin' && !S.panel); }
    function scaled() { return S.surface !== 'app' && root.clientWidth - 32 < FRAME_MIN; }

    /* ---------- skeleton ---------- */
    host.innerHTML = '<div class="hx" lang="en"><div class="hx-top"></div><div class="hx-rail"></div><div class="hx-body">' +
      '<div class="hx-stage"><div class="hx-prod"></div><div class="hx-toast" role="status" aria-live="polite"></div></div>' +
      '<div class="hx-panel"><div class="hx-ptabs" role="tablist"></div><div class="hx-pbody"></div></div></div></div>';
    var root = host.firstChild, top = root.querySelector('.hx-top'), rail = root.querySelector('.hx-rail'), stage = root.querySelector('.hx-stage');
    var prod = root.querySelector('.hx-prod'), toastEl = root.querySelector('.hx-toast'), ptabs = root.querySelector('.hx-ptabs'), pbody = root.querySelector('.hx-pbody');

    function seg(name, opts, val, cls) {
      return '<span class="hx-seg' + (cls ? ' ' + cls : '') + '" role="group">' + opts.map(function (o) {
        return '<button type="button" data-set="' + name + ':' + o[0] + '" aria-pressed="' + (o[0] === val) + '"' + (o[2] ? ' lang="' + o[2] + '"' : '') + '>' + o[1] + '</button>';
      }).join('') + '</span>';
    }
    function langSeg() { return seg('lang', LANGS.map(function (k) { return [k, LANG[k].short, LANG[k].tag]; }), S.lang, 'is-lang'); }

    /* ---------- outer layer: controls and the stage rail ---------- */
    function topHTML() {
      return '<div class="hx-brand"><span class="hx-dot"></span><b>' + c('title') + '</b><span class="hx-demo">' + c('demo') + '</span></div>' +
        '<div class="hx-ctrls"><span class="hx-ctl"><span class="hx-ctl-k">' + c('surface') + '</span>' + seg('surface', SURFACES.map(function (k) { return [k, c('sf_' + k)]; }), S.surface, 'is-surface') + '</span>' +
        '<label class="hx-sel"><span>' + c('region') + '</span><select data-region>' + REGIONS.map(function (k) {
          return '<option value="' + k + '"' + (k === S.region ? ' selected' : '') + '>' + c('region_' + k) + '</option>';
        }).join('') + '</select></label><span class="hx-ctl"><span class="hx-ctl-k">' + c('lang') + '</span>' + langSeg() + '</span></div>';
    }
    function railHTML() {
      var lvl = humanOn() ? 2 : S.chatOn ? 1 : 0;
      return '<div class="hx-st3">' + ['st_self', 'st_bot', 'st_agent'].map(function (k, i) {
        return (i ? '<span class="hx-stl' + (i <= lvl ? ' is-on' : '') + '"></span>' : '') +
          '<span class="hx-st' + (i < lvl ? ' is-past' : i === lvl ? ' is-on' : '') + '"><i>' + (i + 1) + '</i><b>' + c(k) + '</b>' +
          (i === 2 && lvl === 2 ? '<em>' + c('hs_' + S.human.st) + '</em>' : '') + '</span>';
      }).join('') + '</div><div class="hx-railhint">' + c('hint_' + S.surface) + (scaled() ? ' ' + c('hint_narrow') : '') + '</div>';
    }

    /* ---------- product: shared help content ---------- */
    function siteAttrs(cls) {
      var Lg = LANG[S.lang];
      return ' class="hx-site ' + cls + '" dir="' + Lg.dir + '" lang="' + Lg.tag + '" data-len="' + Lg.len + '" style="--hx-fs:' + Lg.fs + 'px;--hx-fl:' + Lg.fl + 'px;--hx-fx:' + Lg.fx + 'px"';
    }
    function headHTML(title, right) {
      return '<div class="hx-head"><button type="button" class="hx-back" data-back aria-label="' + esc(p('back')) + '">' + ico('back') + '</button><b>' + title + '</b>' + (right || '') + '</div>';
    }
    function searchHTML() {
      return '<form class="hx-search" role="search">' + ico('search') + '<input type="search" name="q" autocomplete="off" placeholder="' + esc(p('searchPh')) + '" value="' + esc(S.query) + '" aria-label="' + esc(p('searchPh')) + '"></form><div class="hx-sugg"></div>';
    }
    function hotHTML() {
      return '<div class="hx-hot">' + [['refund', 'hot_refund'], ['order', 'hot_order'], ['penalty', 'hot_penalty']].map(function (t) {
        return '<button type="button" data-tile="' + t[0] + '">' + p(t[1]) + '</button>';
      }).join('') + '</div>';
    }
    function noticeHTML() { return '<button type="button" class="hx-notice" data-notice>' + ico('bell') + '<span>' + p('notice') + '</span><b>' + p('noticeGo') + '</b></button>'; }
    function toolsCard(kind) {
      var keys = ['refund', 'order', 'penalty'], first = kind === 'plugin' && PAGE_TOOL[S.page];
      if (first) keys = [first].concat(keys.filter(function (k) { return k !== first; }));
      keys.push('local');
      return '<div class="hx-card"><div class="hx-ct">' + p('tools') + '</div><div class="hx-tools' + (kind === 'web' ? ' is-web' : '') + '">' + keys.map(function (k) {
        var label = k === 'local' ? p('local_' + REG[S.region].local) : p('t_' + k);
        return '<button type="button" class="hx-tile is-' + k + '" data-tile="' + k + '"><span class="hx-tico">' + ico(k) + '</span><span class="hx-tl">' + label +
          (k === 'local' ? '<span class="hx-local">' + p('localTag') + '</span>' : '') + '</span>' + ico('chev', 'hx-tchev') + '</button>';
      }).join('') + '</div></div>';
    }
    function qBtn(q) {
      var n = Q[q].teams.length;
      return '<button type="button" class="hx-q" data-q="' + q + '"><span>' + p(q) + '</span>' +
        (S.cat === 'team' && n > 1 ? '<span class="hx-dup" title="' + esc(c('cat_in', { n: n })) + '">×' + n + '</span>' : '') + ico('chev', 'hx-qchev') + '</button>';
    }
    function catTabs() {
      return S.cat === 'sit'
        ? ['refund', 'order', 'penalty'].map(function (k) { return { k: 'sit_' + k, list: SIT[k] }; })
        : TEAMS.map(function (t) { return { k: 'team_' + t, list: Object.keys(Q).filter(function (q) { return Q[q].teams.indexOf(t) >= 0; }) }; });
    }
    function faqCard() {
      var tabs = catTabs(), ft = Math.min(S.ftab, tabs.length - 1);
      return '<div class="hx-card"><div class="hx-ct">' + p('faq') + '</div><div class="hx-ftabs" role="tablist">' + tabs.map(function (t, i) {
        return '<button type="button" role="tab" data-ftab="' + i + '" aria-selected="' + (i === ft) + '">' + p(t.k) + '</button>';
      }).join('') + '</div><div class="hx-faq">' + tabs[ft].list.map(qBtn).join('') + '</div></div>';
    }
    function statusPill() {
      if (!humanOn()) return '';
      var st = S.human.st, t = st === 'queue' ? p('hs_queue') : st === 'live' ? p('ball_live') : '<span class="hx-cdm">' + mmss(S.human.left) + '</span>';
      return '<em class="hx-pill is-' + st + '">' + t + '</em>';
    }
    function badge() { return S.unread ? '<span class="hx-badge">' + num(S.unread) + '</span>' : ''; }
    function barHTML() {
      return '<div class="hx-bar"><button type="button" data-tile="progress">' + ico('progress') + '<span>' + p('t_progress') + '</span></button>' +
        '<button type="button" data-tile="assistant">' + ico('assistant') + '<span>' + p('t_assistant') + '</span>' + statusPill() + badge() + '</button></div>';
    }
    function onPageHTML() {
      if (S.page === 'home') return noticeHTML();
      var text = S.page === 'orders' ? p('op_orders') : S.page === 'after' ? p('op_after', { n: num(CASES.refund.length) }) : p('op_pen', { n: num(CASES.penalty.length) });
      return '<div class="hx-onpage"><div class="hx-k">' + ico('eye') + p('onPage') + ' · ' + p('nav_' + S.page) + '</div><button type="button" data-onpage>' + ico(PAGE_TOOL[S.page]) + '<span>' + text + '</span>' + ico('chev', 'hx-qchev') + '</button></div>';
    }
    function homeHTML(kind) {
      var hero = kind === 'plugin'
        ? '<div class="hx-hero is-pl"><div class="hx-hello">' + p('hello') + '</div>' + searchHTML() + hotHTML() + '</div>'
        : '<div class="hx-hero"><div class="hx-app">' + p('app') + ' · ' + p('region_' + S.region) + '</div><div class="hx-hello">' + p('hello') + '</div>' + searchHTML() + '</div>';
      return hero + (kind === 'plugin' ? onPageHTML() : noticeHTML()) + toolsCard(kind) + faqCard() + barHTML();
    }
    function chip(text, cls) { return '<span class="hx-chip' + (cls ? ' ' + cls : '') + '">' + text + '</span>'; }
    function caseCard(tool, cs, asButton) {
      var inner;
      if (tool === 'penalty') {
        inner = '<span class="hx-cline"><b>' + p(cs.type) + '</b>' + chip(cs.points ? p('pts', { n: num(cs.points) }) : p('pts0'), 'is-red') + '</span><span class="hx-cmeta">' + subjectOf(cs, S.lang) + '</span>';
      } else {
        inner = '<span class="hx-cline"><b>' + cs.code + '</b><span class="hx-amt">' + money(cs.usd, S.lang) + '</span></span><span class="hx-cmeta">' + p(cs.item) + '</span>' +
          '<span class="hx-cchips">' + chip(p(cs.status)) + (cs.req ? chip(p(cs.req), cs.req === 'req_platform' ? 'is-red' : 'is-blue') : '') + '</span>';
      }
      return asButton ? '<button type="button" class="hx-case" data-case="' + cs.id + '">' + inner + ico('chev', 'hx-qchev') + '</button>' : '<div class="hx-case is-static">' + inner + '</div>';
    }
    function checkRow(label, value, state) {
      var icon = state === 'skip' ? ico('dash') : state === 'info' ? ico('eye') : state.indexOf('yes') >= 0 ? ico('check') : ico('minus');
      return '<div class="hx-chk is-' + state.split(' ').join(' is-') + '"><span class="hx-chk-i">' + icon + '</span><span class="hx-chk-l">' + label + '</span><span class="hx-chk-v">' + value + '</span></div>';
    }
    function toolHTML() {
      var tool = S.tool, cs = cur(), h = headHTML(p('t_' + tool));
      if (S.phase === 'pick' || !cs) {
        return h + '<div class="hx-sub">' + p(tool === 'penalty' ? 'pickPenalty' : 'pickOrder') + '</div><div class="hx-cases">' + CASES[tool].map(function (x) { return caseCard(tool, x, true); }).join('') + '</div>';
      }
      var ev = evaluate(tool, cs), items = [], skipped = [];
      if (tool === 'penalty') {
        items.push(checkRow(p('r_rule'), p(cs.rule), 'info'), checkRow(p('r_evidence'), p(cs.ev), 'info'),
          checkRow(p('r_points'), cs.points ? p('pts', { n: num(cs.points) }) : p('pts0'), 'info'), checkRow(p('r_impact'), p(cs.imp), 'info'));
      }
      SOP[tool].dec.forEach(function (d, i) {
        var st = stepOf(ev, i);
        if (st) items.push(checkRow(p('f_' + d.f), V(cs, d.f, S.lang), (st.v ? 'yes' : 'no') + (st.decisive ? ' decisive' : '')));
        else skipped.push(checkRow(p('f_' + d.f), p('notNeeded'), 'skip'));
      });
      var done = S.phase === 'result', shown = done ? items.length : S.shown;
      var head = done ? p('weChecked') : '<span class="hx-spin"></span>' + p(tool === 'penalty' ? 'checkingP' : 'checking');
      h += '<div class="hx-cur">' + caseCard(tool, cs, false) + '</div><div class="hx-checks"><div class="hx-k">' + head + '</div>' + items.slice(0, shown).join('') + (done ? skipped.join('') : '') + '</div>';
      return done ? h + resultHTML(tool, cs) : h;
    }
    function timelineHTML() {
      return '<div class="hx-tl3"><span class="is-done">' + ico('check') + '<b>' + p('pr_submitted') + '</b><em>' + date(0, S.lang) + '</em></span>' +
        '<span class="is-cur">' + ico('lock') + '<b>' + p('pr_review') + '</b><em>' + p('pr_now') + '</em></span><span>' + ico('dash') + '<b>' + p('pr_result') + '</b><em>—</em></span></div>';
    }
    function resultHTML(tool, cs) {
      var out = outcome(tool, cs), acts = ACTS[out] || [], done = S.done[cs.id] || [];
      var t = out === 'review' ? p('sub_t') : p('o_' + out + '_t'), b = out === 'review' ? p('sub_b') : p('o_' + out + '_b', { d: date(cs.dueDay, S.lang) });
      var btns = acts.map(function (a, i) {
        var did = done.indexOf(a) >= 0;
        return '<button type="button" class="hx-btn' + (i === 0 ? ' is-primary' : '') + (did ? ' is-done' : '') + '" data-act="' + a + '"' + (did ? ' disabled' : '') + '>' + (did ? ico('check') : '') + '<span>' + p(a) + '</span></button>';
      }).join('');
      return '<div class="hx-result"><div class="hx-k">' + p('whatToDo') + '</div><div class="hx-rt">' + t + '</div><div class="hx-rb">' + b + '</div>' +
        (out === 'review' ? timelineHTML() : '') + (btns ? '<div class="hx-acts">' + btns + '</div>' : '') + '</div>' +
        '<button type="button" class="hx-link" data-tochat>' + ico('assistant') + '<span>' + p('notSolved') + '</span></button>';
    }
    function articleHTML() {
      var a = ART[S.lang][REG[S.region].local];
      return headHTML(a.t) + '<div class="hx-art"><div class="hx-k">' + p('localTag') + ' · ' + p('region_' + S.region) + '</div><div class="hx-rt">' + a.t + '</div><div class="hx-rb">' + a.b + '</div>' +
        '<div class="hx-steps">' + a.s.map(function (x, i) { return '<span><i>' + num(i + 1) + '</i>' + x + '</span>'; }).join('') + '</div><div class="hx-illus">' + p('illus') + '</div></div>' +
        '<button type="button" class="hx-link" data-tochat>' + ico('assistant') + '<span>' + p('notSolved') + '</span></button>';
    }
    function progressHTML() {
      var list = CASES.penalty.filter(function (x) { return S.appealed[x.id]; }), h = headHTML(p('t_progress'));
      if (!list.length) return h + '<div class="hx-empty"><div class="hx-rb">' + p('pr_none') + '</div><button type="button" class="hx-btn is-primary" data-tile="penalty"><span>' + p('pr_open') + '</span></button></div>';
      return h + list.map(function (x) {
        return '<div class="hx-result">' + caseCard('penalty', x, false) + timelineHTML() + '<div class="hx-acts"><button type="button" class="hx-btn" data-agent-case="' + x.id + '"><span>' + p('agent') + '</span></button></div></div>';
      }).join('');
    }
    function viewHTML(kind) {
      return S.view === 'tool' ? toolHTML() : S.view === 'article' ? articleHTML() : S.view === 'progress' ? progressHTML() : homeHTML(kind);
    }

    /* ---------- product: chat (assistant, then agent, in the same thread) ---------- */
    function msgText(m) { return m.text != null ? esc(m.text) : p(m.k, m.fn ? m.fn(S.lang) : null); }
    function chipLabel(ch) { return ch.act === 'sit' ? p('sl_' + ch.sit) : ch.act === 'fr' ? p(ch.k) : ch.act === 'agent' ? p('agent') : p(ch.act); }
    function msgHTML(m, last) {
      if (m.who === 'sys') return '<div class="hx-sys' + (m.live ? ' is-live' : '') + '">' + msgText(m) + '</div>';
      if (m.who === 'agentcard') return '<div class="hx-agentcard"><span class="hx-av is-agent">' + ico('agent') + '</span><span><b>' + p('agentCard') + '</b><span>' + p('agentSub') + '</span></span></div>';
      if (m.typing) return '<div class="hx-msg is-bot"><span class="hx-av">' + ico('assistant') + '</span><div class="hx-mcol"><div class="hx-bubble hx-typing"><i></i><i></i><i></i></div></div></div>';
      var body;
      if (m.type === 'order') { var cs = caseOf(m.tool, m.id); body = '<div class="hx-ordcard">' + ico('order') + '<span><b>' + cs.code + '</b><span>' + p(cs.item) + ' · ' + money(cs.usd, S.lang) + '</span></span></div>'; }
      else if (m.type === 'image') body = '<div class="hx-imgmsg">' + ico('image') + '<span>' + p('imgName') + '</span></div>';
      else body = msgText(m);
      var av = m.who === 'me' ? '' : '<span class="hx-av' + (m.who === 'agent' ? ' is-agent' : '') + '">' + ico(m.who === 'agent' ? 'agent' : 'assistant') + '</span>';
      var card = m.card ? '<button type="button" class="hx-cardbtn" data-help="' + m.card.tool + ':' + (m.card.id || '') + '">' + ico(m.card.tool) + '<span>' + p('open', { tool: p('t_' + m.card.tool) }) + '</span>' + ico('chev', 'hx-qchev') + '</button>' : '';
      var chips = last && m.chips ? '<div class="hx-chips">' + m.chips.map(function (ch, i) { return '<button type="button" data-chip="' + i + '"' + (ch.act === 'agent' ? ' class="is-agent"' : '') + '>' + chipLabel(ch) + '</button>'; }).join('') + '</div>' : '';
      return '<div class="hx-msg is-' + m.who + (m.type ? ' is-' + m.type : '') + '">' + av + '<div class="hx-mcol"><div class="hx-bubble">' + body + card + '</div>' + chips + '</div></div>';
    }
    function chatHTML(kind) {
      var h = S.stage === 'human' && S.human, title, sub, av = 'assistant';
      if (!h) { title = p('bot'); sub = p('botSub'); }
      else {
        av = 'agent';
        title = h.st === 'queue' ? p('j_agent') : p('agentName');
        sub = h.st === 'queue' ? p('queueSub', { n: num(h.pos) }) : h.st === 'closing' ? p('closingSub', { s: '<span class="hx-cd">' + num(h.left) + '</span>' }) : h.st === 'ended' ? p('hs_ended') : p('agentSub');
      }
      var who = '<span class="hx-av' + (av === 'agent' ? ' is-agent' : '') + '">' + ico(av) + '</span><span class="hx-chead-t"><b>' + title + '</b><span class="is-' + (h ? h.st : 'bot') + '">' + sub + '</span></span>';
      var head = kind === 'web'
        ? '<div class="hx-chead is-win">' + who + '<button type="button" class="hx-iconbtn" data-hidechat aria-label="' + esc(p('minimize')) + '">' + ico('min') + '</button></div>'
        : '<div class="hx-chead"><button type="button" class="hx-back" data-hidechat aria-label="' + esc(p('back')) + '">' + ico('back') + '</button>' + who + '</div>';
      var ended = h && h.st === 'ended';
      var qa = ended ? '' : '<div class="hx-qa">' + (h ? ['order', 'image', 'end'] : ['order', 'image', 'agent']).map(function (k) {
        return '<button type="button" data-qa="' + k + '"' + (k === 'agent' || k === 'end' ? ' class="is-' + k + '"' : '') + '>' + (k === 'order' ? ico('order') : k === 'image' ? ico('image') : k === 'agent' ? ico('agent') : '') + '<span>' + p('qa_' + k) + '</span></button>';
      }).join('') + '</div>';
      var comp;
      if (ended) comp = '<div class="hx-composer is-ended"><button type="button" class="hx-btn is-primary" data-endback><span>' + p('home') + '</span></button></div>';
      else {
        var off = h && h.st === 'queue';
        comp = '<form class="hx-composer"><input type="text" name="msg" autocomplete="off" placeholder="' + esc(p('inputPh')) + '" aria-label="' + esc(p('inputPh')) + '" value="' + esc(S.draft) + '"' + (off ? ' disabled' : '') + '>' +
          '<button type="submit" aria-label="' + esc(p('send')) + '"' + (off ? ' disabled' : '') + '>' + ico('send') + '</button></form>';
      }
      return head + '<div class="hx-chat" data-sk="chat">' + S.chat.map(function (m, i) { return msgHTML(m, i === S.chat.length - 1); }).join('') + '</div>' + qa + comp;
    }
    function helpContent(kind) { return S.chatOn ? chatHTML(kind) : '<div class="hx-scroll" data-sk="main">' + viewHTML(kind) + '</div>'; }
    function sheetHTML() {
      var cs = cur(); if (!cs || !S.sheet || S.view !== 'tool' || S.chatOn) return '';
      return '<div class="hx-sheet" role="dialog" aria-modal="true" aria-label="' + esc(p('ap_title')) + '"><div class="hx-sheet-in"><div class="hx-rt">' + p('ap_title') + '</div>' +
        '<div class="hx-file">' + ico('file') + '<span>' + p('ap_file_' + cs.id) + '</span>' + ico('check') + '</div><div class="hx-rb">' + p('ap_note_' + cs.id) + '</div>' +
        '<div class="hx-acts"><button type="button" class="hx-btn is-primary" data-submit-appeal><span>' + p('ap_submit') + '</span></button><button type="button" class="hx-btn" data-close-sheet><span>' + p('back') + '</span></button></div></div></div>';
    }
    /* Floating Help button: carries the chat state when the chat is out of view. */
    function ballHTML() {
      var st = humanOn() ? S.human.st : '', label = !st ? p('ball_help') : st === 'queue' ? p('hs_queue') : st === 'live' ? p('ball_live') : '<span class="hx-cdm">' + mmss(S.human.left) + '</span>';
      return '<button type="button" class="hx-ball' + (st ? ' is-' + st : '') + '" data-ball>' + ico(st ? 'agent' : 'assistant') + '<span>' + label + '</span>' + badge() + '</button>';
    }

    /* ---------- product: the three surfaces ---------- */
    function browser(url, inner) {
      return '<div class="hx-fit"><div class="hx-scale"><div class="hx-browser"><div class="hx-bbar"><i></i><i></i><i></i><span class="hx-url">' + ico('lock') + '<span>' + url + '</span></span></div>' + inner + '</div></div></div>';
    }
    function topicsCard() {
      var cards = S.cat === 'sit'
        ? ['refund', 'order', 'penalty'].map(function (k) { return { t: p('sit_' + k), list: SIT[k], icon: k }; })
        : TEAMS.map(function (t) { return { t: p('team_' + t), list: Object.keys(Q).filter(function (q) { return Q[q].teams.indexOf(t) >= 0; }), team: t }; });
      return '<div class="hx-card"><div class="hx-ct">' + p(S.cat === 'sit' ? 'w_topicsSit' : 'w_topicsTeam') + '</div><div class="hx-topics' + (S.cat === 'team' ? ' is-team' : '') + '">' + cards.map(function (x) {
        return '<div class="hx-topic"><div class="hx-topic-t">' + (x.icon ? '<span class="hx-tico is-' + x.icon + '">' + ico(x.icon) + '</span>' : '<i class="hx-dotm t-' + x.team + '"></i>') + '<b>' + x.t + '</b></div>' + x.list.map(qBtn).join('') + '</div>';
      }).join('') + '</div></div>';
    }
    function webHTML() {
      var n = CASES.penalty.filter(function (x) { return S.appealed[x.id]; }).length;
      var main = S.view === 'home'
        ? '<div class="hx-wbanner"><div class="hx-wb-t">' + p('w_banner') + '</div><div class="hx-wsearch">' + searchHTML() + '</div>' + hotHTML() + '</div>' +
          '<div class="hx-wgrid"><div class="hx-wleft">' + noticeHTML() + toolsCard('web') + topicsCard() + '</div><div class="hx-wright">' +
          '<div class="hx-card"><div class="hx-ct">' + p('w_progress') + '</div><button type="button" class="hx-wprog" data-tile="progress"><b>' + num(n) + '</b><span>' + p('w_review') + '</span>' + ico('chev', 'hx-qchev') + '</button></div>' +
          '<div class="hx-card hx-wonline"><div class="hx-ct">' + p('w_online') + '</div><div class="hx-rb">' + p('w_onlineB') + '</div><button type="button" class="hx-btn is-primary" data-tile="assistant">' + ico('assistant') + '<span>' + p('w_chat') + '</span>' + statusPill() + badge() + '</button></div></div></div>'
        : '<div class="hx-wcrumb"><button type="button" data-whome>' + p('crumb') + '</button>' + ico('chev', 'hx-qchev') + '<span>' + (S.view === 'tool' ? p('t_' + S.tool) : S.view === 'article' ? p('local_' + REG[S.region].local) : p('t_progress')) + '</span></div><div class="hx-wcol">' + viewHTML('web') + '</div>';
      return '<div class="hx-wnav"><span class="hx-wlogo">' + ico('assistant') + '</span><b>' + p('app') + '</b><button type="button" data-whome' + (S.view === 'home' ? ' aria-current="page"' : '') + '>' + p('nav_home') + '</button><span class="hx-wnav-x">' + p('w_nav_kb') + '</span><span class="hx-wnav-r">' + ico('bell') + '</span></div>' +
        '<div class="hx-wmain" data-sk="main">' + main + '</div>' + (S.chatOn ? '<div class="hx-wchat" role="dialog" aria-label="' + esc(p('w_online')) + '">' + chatHTML('web') + '</div>' : ballHTML()) + sheetHTML();
    }
    /* First cell: the record, with a contextual Get help that opens the plugin on this case. */
    function firstCell(label, tool, id) { return '<td><span class="hx-first"><b>' + label + '</b><button type="button" class="hx-rowhelp" data-help="' + tool + ':' + id + '">' + ico('help') + '<span>' + p('getHelp') + '</span></button></span></td>'; }
    function table(heads, rows) { return '<div class="hx-sctable"><table><thead><tr>' + heads.map(function (h) { return '<th>' + (h ? p(h) : '') + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
    function scPage() {
      var title = '<div class="hx-sct">' + (S.page === 'home' ? p('sc_hi') : p('nav_' + S.page)) + '</div>';
      if (S.page === 'home') {
        return title + '<div class="hx-stats">' + [['orders', 1, 'stat_ship'], ['after', CASES.refund.length, 'stat_refund'], ['pen', CASES.penalty.length, 'stat_pen']].map(function (s) {
          return '<button type="button" class="hx-stat" data-page="' + s[0] + '"><b>' + num(s[1]) + '</b><span>' + p(s[2]) + '</span></button>';
        }).join('') + '</div>' + noticeHTML();
      }
      if (S.page === 'orders') return title + table(['th_order', 'th_item', 'th_amount', 'th_status'], CASES.order.map(function (cs) {
        return '<tr>' + firstCell(cs.code, 'order', cs.id) + '<td>' + p(cs.item) + '</td><td>' + money(cs.usd, S.lang) + '</td><td>' + chip(p(cs.status)) + (cs.hoursLeft ? chip(p('v_hoursLeft', { n: num(cs.hoursLeft) }), 'is-red') : '') + '</td></tr>';
      }));
      if (S.page === 'after') return title + table(['th_order', 'th_item', 'th_amount', 'th_request', 'th_status'], CASES.refund.map(function (cs) {
        return '<tr>' + firstCell(cs.code, 'refund', cs.id) + '<td>' + p(cs.item) + '</td><td>' + money(cs.usd, S.lang) + '</td><td>' + chip(p(cs.req), cs.req === 'req_platform' ? 'is-red' : 'is-blue') + '</td><td>' + chip(p(cs.status)) + '</td></tr>';
      }));
      return title + table(['th_penalty', 'th_subject', 'th_points', 'th_impact'], CASES.penalty.map(function (cs) {
        return '<tr>' + firstCell(p(cs.type), 'penalty', cs.id) + '<td>' + subjectOf(cs, S.lang) + '</td><td>' + (cs.points ? p('pts', { n: num(cs.points) }) : p('pts0')) + '</td><td>' + p(cs.imp) + '</td></tr>';
      }));
    }
    function pluginHTML() {
      var nav = '<div class="hx-scnav"><div class="hx-sclogo">' + ico('order') + '<b>' + p('sc_name') + '</b></div>' + PAGES.map(function (pg) {
        return '<button type="button" data-page="' + pg + '"' + (pg === S.page ? ' aria-current="page"' : '') + '>' + ico(PAGE_ICON[pg]) + '<span>' + p('nav_' + pg) + '</span></button>';
      }).join('') + '</div>';
      var panel = S.panel
        ? '<div class="hx-pl" role="dialog" aria-label="' + esc(p('app')) + '"><div class="hx-pl-top"><span class="hx-pl-logo">' + ico('assistant') + '</span><b>' + p('app') + '</b>' +
          '<button type="button" class="hx-iconbtn" data-min aria-label="' + esc(p('minimize')) + '">' + ico('min') + '</button></div><div class="hx-pl-body">' + helpContent('plugin') + '</div>' + sheetHTML() + '</div>'
        : ballHTML();
      return nav + '<div class="hx-scmain" data-sk="page">' + scPage() + '</div>' + panel;
    }
    function productHTML() {
      if (S.surface === 'app') return '<div class="hx-phone"><div' + siteAttrs('hx-appsite') + '>' + helpContent('app') + sheetHTML() + '</div></div>';
      if (S.surface === 'web') {
        var path = S.view === 'tool' ? 'tools/' + S.tool : S.view === 'article' ? 'articles/' + REG[S.region].local : S.view === 'progress' ? 'progress' : '';
        return browser('help.seller.example/' + path, '<div' + siteAttrs('hx-web') + '>' + webHTML() + '</div>');
      }
      return browser('seller.example/' + PAGE_PATH[S.page], '<div' + siteAttrs('hx-sc') + '>' + pluginHTML() + '</div>');
    }
    function fit() {
      var f = prod.querySelector('.hx-fit'); if (!f) return;
      var sc = f.firstChild, cs = getComputedStyle(stage), avail = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (avail >= FRAME_MIN) { sc.style.width = '100%'; sc.style.height = '100%'; sc.style.transform = ''; f.style.width = ''; f.style.height = FRAME_H + 'px'; }
      else { var s = avail / FRAME_MIN; sc.style.width = FRAME_MIN + 'px'; sc.style.height = FRAME_H + 'px'; sc.style.transform = 'scale(' + s + ')'; f.style.width = Math.floor(FRAME_MIN * s) + 'px'; f.style.height = Math.round(FRAME_H * s) + 'px'; }
    }

    /* ---------- behind the scenes ---------- */
    function vis(v) { v = S.exposure === 'before' ? 'agent' : v; return '<span class="hx-vis is-' + v + '">' + ico(v === 'agent' ? 'lock' : 'eye') + c('vis_' + v) + '</span>'; }
    function team(t) { return '<span class="hx-team t-' + t + '">' + pl(cl(), 'team_' + t) + '</span>'; }
    function branchHTML(sop, o, label, taken, curNode) {
      return '<div class="hx-br' + (taken ? ' is-taken' : '') + '"><span class="hx-bl">' + label + '</span><span class="hx-chain">' + chainOf(sop, o).map(function (id, j) {
        var od = sop.outs[id];
        return (j ? '<span class="hx-arr">→</span>' : '') + '<span class="hx-out' + (od.vis === 'agent' ? ' is-agent' : '') + (taken && curNode === id ? ' is-cur' : '') + '"><b>' + c('out_' + id) + '</b>' + team(od.team) + vis(od.vis || 'merchant') + '</span>';
      }).join('') + '</span></div>';
    }
    function flowHTML(tool, cs, ev, reveal, lookOn) {
      var sop = SOP[tool], L = cl(), curNode = currentNode(tool, cs), on = !!ev;
      var h = '<div class="hx-sop"><div class="hx-n is-start' + (on ? ' is-on' : '') + '"><span class="hx-nd"></span><div class="hx-nb"><b>' + c('start_' + tool) + '</b></div></div>';
      (sop.look || []).forEach(function (k) {
        h += '<div class="hx-n is-look' + (lookOn ? ' is-on' : '') + '"><span class="hx-nd"></span><div class="hx-nb"><div class="hx-nrow"><b>' + c('look_' + k) + '</b>' + vis('merchant') + '</div>' +
          '<code>' + sop.src[k] + '</code>' + (lookOn ? '<div class="hx-val">' + lookVal(k, cs, L) + '</div>' : '') + '</div></div>';
      });
      sop.dec.forEach(function (d, i) {
        var st = ev && stepOf(ev, i), shown = st && i < reveal, skip = ev && S.phase === 'result' && !st;
        var yesNo = function (b) { return c(b ? 'yes' : 'no') + ' →'; };
        h += '<div class="hx-n is-dec' + (shown ? ' is-on' + (st.decisive ? ' is-decisive' : '') : skip ? ' is-skip' : '') + '"><span class="hx-nd"></span><div class="hx-nb"><div class="hx-nrow"><b>' + c('fq_' + d.f) + '</b>' +
          (shown ? '<span class="hx-val is-' + (st.v ? 'yes' : 'no') + '">' + V(cs, d.f, L) + '</span>' : '') + '</div><code>' + sop.src[d.f] + '</code>' +
          branchHTML(sop, d.out, yesNo(d.exit), shown && st.taken === 'exit', curNode) + (d.alt ? branchHTML(sop, d.alt, yesNo(!d.exit), shown && st.taken === 'alt', curNode) : '') + '</div></div>';
      });
      return h + '</div>';
    }
    function configHTML(tool, cs, ev, reveal, lookOn) {
      var sop = SOP[tool], rows = [], n = 0;
      function then(o) { return chainOf(sop, o).map(function (id) { return c('out_' + id); }).join(' → '); }
      function who(o) {
        var agent = chainOf(sop, o).some(function (id) { return sop.outs[id].vis === 'agent'; });
        return team(sop.outs[o].team) + (agent && S.exposure !== 'before' ? vis('merchant') + vis('agent') : vis(agent ? 'agent' : 'merchant'));
      }
      (sop.look || []).forEach(function (k) {
        n++;
        rows.push('<tr class="' + (lookOn ? 'is-on' : '') + '"><td>' + n + '</td><td><b>' + c('look_' + k) + '</b><code>' + sop.src[k] + '</code></td><td>' + c('always') + '</td><td>' + c('show') + '</td><td>' + team('rules') + vis('merchant') + '</td></tr>');
      });
      sop.dec.forEach(function (d, i) {
        n++;
        var st = ev && stepOf(ev, i), shown = st && i < reveal;
        rows.push('<tr class="' + (shown ? 'is-on' : '') + (shown && st.taken === 'exit' ? ' is-taken' : '') + '"><td>' + n + '</td><td><b>' + c('fq_' + d.f) + '</b><code>' + sop.src[d.f] + '</code></td><td><code>' + sop.cond[d.f] + '</code></td><td>' + then(d.out) + '</td><td>' + who(d.out) + '</td></tr>');
        if (d.alt) rows.push('<tr class="' + (shown ? 'is-on' : '') + (shown && st.taken === 'alt' ? ' is-taken' : '') + '"><td></td><td></td><td>' + c('otherwise') + '</td><td>' + then(d.alt) + '</td><td>' + who(d.alt) + '</td></tr>');
      });
      return '<div class="hx-tablewrap"><table class="hx-rules"><thead><tr><th>' + c('col_step') + '</th><th>' + c('col_factor') + '</th><th>' + c('col_when') + '</th><th>' + c('col_then') + '</th><th>' + c('col_owner') + '</th></tr></thead><tbody>' +
        rows.join('') + '</tbody></table></div><div class="hx-pnote">' + c('configNote') + '</div>';
    }
    function sopHTML() {
      var tool = S.tool, cs = cur(), active = !!(cs && S.phase !== 'pick');
      var ev = active ? evaluate(tool, cs) : null;
      var reveal = !active ? 0 : S.phase === 'result' ? 99 : Math.max(0, S.shown - looks(tool));
      var lookOn = active && (S.phase === 'result' || S.shown > 0), before = S.exposure === 'before';
      return '<div class="hx-phead"><div class="hx-ph">' + c('sop') + ' · ' + pl(cl(), 't_' + tool) + '</div>' + seg('sopView', [['flow', c('flow')], ['config', c('rules')]], S.sopView) + '</div>' +
        '<div class="hx-who"><span>' + c('whoRuns') + '</span>' + seg('exposure', [['before', c('before')], ['now', c('now')]], S.exposure) + '</div>' +
        '<div class="hx-pnote' + (before ? ' is-before' : ' is-now') + '">' + (before ? c('beforeNote') : c('now_' + tool)) + '</div>' +
        (active ? '' : '<div class="hx-phint">' + c('pickHint') + '</div>') + (S.sopView === 'config' ? configHTML(tool, cs, ev, reveal, lookOn) : flowHTML(tool, cs, ev, reveal, lookOn));
    }
    function homeLogicHTML() {
      var L = cl(), where = S.surface === 'plugin' ? c('lp_plugin', { page: pl(L, 'nav_' + S.page) }) : c('lp_' + S.surface);
      var extra = S.surface === 'plugin' ? '<div class="hx-urlg"><code>url_group = ' + PAGE_PATH[S.page] + '</code><span>→</span>' +
        (PAGE_TOOL[S.page] ? '<span class="hx-fchip">' + pl(L, 't_' + PAGE_TOOL[S.page]) + '</span>' : '<span class="hx-fchip">' + pl(L, 'notice') + '</span>') + '</div>' : '';
      return '<div class="hx-ph">' + c('lh_t') + '</div><div class="hx-pp">' + c('lh_b') + '</div><div class="hx-layers">' + [1, 2, 3].map(function (i) {
        return '<div class="hx-layer is-l' + i + '"><span class="hx-ln">' + i + '</span><div><b>' + c('lh_' + i + 't') + '</b><span>' + c('lh_' + i + 'b') + '</span></div></div>';
      }).join('') + '</div><div class="hx-pk">' + c('lp_t') + '</div><div class="hx-where"><div>' + where + '</div>' + extra + '<div class="hx-pnote">' + c('lp_one') + '</div></div>' +
        '<div class="hx-pk">' + c('lh_try') + '</div><div class="hx-tries">' +
        '<button type="button" data-tile="refund">' + ico('refund') + '<span>' + c('lh_try1') + '</span></button>' +
        '<button type="button" data-notice>' + ico('bell') + '<span>' + c('lh_try2') + '</span></button>' +
        '<button type="button" data-tile="penalty">' + ico('penalty') + '<span>' + c('lh_try3') + '</span></button></div>';
    }
    function row(k, v) { return '<div class="hx-crow"><span class="hx-ck">' + k + '</span><div class="hx-cv">' + v + '</div></div>'; }
    function ctxHTML(kind) {
      var L = cl(), F = S.from, cs = F ? caseOf(F.tool, F.id) : null, rows = [];
      rows.push(row(c('ctx_merchant'), c('store') + ' · ' + c('region_' + S.region)));
      rows.push(row(c('ctx_entry'), S.surface === 'plugin' ? c('entry_plugin', { page: pl(L, 'nav_' + S.page) }) : c('entry_' + S.surface)));
      rows.push(row(c('ctx_site'), LANG[S.lang].name + ' · ' + S.region));
      var reached = [!!F, true, kind === 'agent'];
      rows.push(row(c('ctx_path'), '<span class="hx-path">' + ['st_self', 'st_bot', 'st_agent'].map(function (k, i) {
        return (i ? '<i>→</i>' : '') + '<span class="' + (reached[i] ? 'is-on' : '') + '">' + c(k) + '</span>';
      }).join('') + '</span>'));
      if (cs) {
        var ev = evaluate(F.tool, cs), done = S.done[cs.id] || [];
        rows.push(row(c('ctx_tool'), pl(L, 't_' + F.tool)));
        rows.push(row(c('ctx_case'), caseLabel(F.tool, cs, L) + ' · ' + (F.tool === 'penalty' ? subjectOf(cs, L) : pl(L, cs.item))));
        rows.push(row(c('ctx_checks'), '<span class="hx-ctxchk">' + ev.steps.map(function (s) { return '<span><span>' + c('fq_' + s.f) + '</span><b>' + V(cs, s.f, L) + '</b></span>'; }).join('') + '</span>'));
        rows.push(row(c('ctx_result'), outcomeTitle(F.tool, cs, L)));
        rows.push(row(c('ctx_actions'), done.length ? done.map(function (a) { return pl(L, a); }).join(' · ') : c('ctx_noAct')));
      }
      var last = null;
      for (var i = S.chat.length - 1; i >= 0; i--) {
        var m = S.chat[i];
        if (m.who !== 'me') continue;
        last = m.type === 'order' ? pl(L, 'qa_order') + ' · ' + caseOf(m.tool, m.id).code : m.type === 'image' ? pl(L, 'qa_image') : m.text != null ? esc(m.text) : pl(L, m.k);
        break;
      }
      rows.push(row(c('ctx_last'), last || c('ctx_noMsg')));
      return '<div class="hx-ph">' + c(kind === 'agent' ? 'ctx_agent' : 'ctx_bot') + '</div>' + (cs ? '' : '<div class="hx-pp">' + c('ctx_none') + '</div>') +
        '<div class="hx-ctx' + (kind === 'agent' ? ' is-agent' : '') + '">' + rows.join('') + '</div><div class="hx-pnote">' + c('ctx_note') + '</div>';
    }
    function catHTML() {
      var L = cl();
      var h = '<div class="hx-ph">' + c('cat_t') + '</div><div class="hx-pp">' + c('cat_b') + '</div>' +
        '<div class="hx-who"><span>' + c('cat_view') + '</span>' + seg('cat', [['sit', c('cat_sit')], ['team', c('cat_team')]], S.cat) + '</div>';
      if (S.cat === 'sit') {
        return h + '<div class="hx-sits">' + ['refund', 'order', 'penalty'].map(function (k) {
          var m = SITMAP[k];
          return '<button type="button" class="hx-sit" data-tile="' + k + '"><span class="hx-sit-h"><b>' + c('sl_' + k) + '</b><span>' + c('cat_try') + ' →</span></span>' +
            '<span class="hx-sit-r"><span class="hx-sit-k">' + c('cat_teams') + '</span>' + m.teams.map(team).join('') + '</span>' +
            '<span class="hx-sit-r"><span class="hx-sit-k">' + c('cat_routed') + '</span>' + m.f.map(function (f) { return '<span class="hx-fchip">' + c('fq_' + f) + '</span>'; }).join('') + '</span></button>';
        }).join('') + '</div><div class="hx-pnote">' + c('cat_sitNote') + '</div>';
      }
      return h + '<div class="hx-tablewrap"><table class="hx-matrix"><thead><tr><th>' + c('cat_q') + '</th>' + TEAMS.map(function (t) { return '<th>' + team(t) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        Object.keys(Q).map(function (q) {
          var n = Q[q].teams.length;
          return '<tr class="' + (n > 1 ? 'is-dup' : '') + '"><td><button type="button" data-q="' + q + '">' + pl(L, q) + '</button>' + (n > 1 ? '<span class="hx-dupb">' + c('cat_in', { n: n }) + '</span>' : '') + '</td>' +
            TEAMS.map(function (t) { return '<td>' + (Q[q].teams.indexOf(t) >= 0 ? '<i class="hx-dotm t-' + t + '"></i>' : '') + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div><div class="hx-pnote">' + c('cat_teamNote') + '</div>';
    }
    function dl(k, v) { return '<div><span>' + k + '</span><b>' + v + '</b></div>'; }
    function langHTML() {
      var Lg = LANG[S.lang], r = REG[S.region];
      return '<div class="hx-ph">' + c('lg_t') + '</div><div class="hx-formula">' + c('lg_formula') + '</div><div class="hx-vars">' +
        '<div class="hx-var"><div class="hx-pk">' + c('lg_region') + '</div>' + seg('region', REGIONS.map(function (k) { return [k, c('region_' + k)]; }), S.region) +
        '<div class="hx-dl">' + dl(c('lg_currency'), '<bdi>' + moneySample(S.lang) + '</bdi>') + dl(c('lg_date'), '<bdi>' + date(0, S.lang) + '</bdi>') + dl(c('lg_local'), '<bdi>' + p('local_' + r.local) + '</bdi>') + '</div></div>' +
        '<div class="hx-var"><div class="hx-pk">' + c('lg_lang') + '</div>' + langSeg() +
        '<div class="hx-dl">' + dl(c('lg_font'), Lg.fs + ' px') + dl(c('lg_len'), c('len_' + Lg.len)) + dl(c('lg_align'), c('dir_' + Lg.dir)) + dl(c('lg_layout'), c('lay_' + Lg.len)) + '</div></div></div>' +
        '<div class="hx-pk">' + c('lg_rules') + '</div><div class="hx-tablewrap"><table class="hx-lrules"><thead><tr><th></th><th>' + c('lg_font') + '</th><th>' + c('lg_len') + '</th><th>' + c('lg_align') + '</th></tr></thead><tbody>' +
        ['en', 'zh', 'es', 'ar'].map(function (k) {
          return '<tr class="' + (k === S.lang ? 'is-on' : '') + '"><td><button type="button" data-set="lang:' + k + '">' + c('lg_r_' + k) + '</button></td><td>' + LANG[k].fs + ' px</td><td>' + c('len_' + LANG[k].len) + '</td><td>' + c('dir_' + LANG[k].dir) + '</td></tr>';
        }).join('') + '</tbody></table></div><div class="hx-pnote">' + c('lg_rulesNote') + '</div>' +
        '<div class="hx-coreext"><div><b>' + c('lg_core') + '</b><span>' + c('lg_coreB') + '</span></div><div><b>' + c('lg_ext') + '</b><span>' + c('lg_extB') + '</span></div></div>' +
        '<div class="hx-pnote">' + c('lg_scale') + '</div>';
    }
    function renderPanel() {
      ptabs.innerHTML = [['logic', 'tabLogic'], ['cat', 'tabCat'], ['lang', 'tabLang']].map(function (t) {
        return '<button type="button" role="tab" data-ptab="' + t[0] + '" aria-selected="' + (S.tab === t[0]) + '">' + c(t[1]) + '</button>';
      }).join('');
      pbody.innerHTML = S.tab === 'cat' ? catHTML() : S.tab === 'lang' ? langHTML()
        : S.chatOn ? ctxHTML(humanOn() || (S.human && S.stage === 'human') ? 'agent' : 'bot') : S.view === 'tool' ? sopHTML() : homeLogicHTML();
    }

    /* ---------- render ---------- */
    var lastKey = '', lastPKey = '';
    function render() {
      var scrolls = {};
      Array.prototype.forEach.call(prod.querySelectorAll('[data-sk]'), function (el) { scrolls[el.getAttribute('data-sk')] = el.scrollTop; });
      var pst = pbody.scrollTop, ae = document.activeElement, refocus = ae && root.contains(ae) && ae.name === 'msg';
      var key = [S.surface, S.page, S.panel, S.view, S.tool, S.phase === 'pick' ? 'pick' : S.id, S.chatOn].join('|');
      var pkey = [S.tab, S.view, S.tool, S.chatOn, S.cat, S.surface].join('|');
      root.setAttribute('data-surface', S.surface);
      root.setAttribute('lang', cl() === 'zh' ? 'zh-Hans' : 'en');
      top.innerHTML = topHTML();
      rail.innerHTML = railHTML();
      prod.innerHTML = productHTML();
      renderPanel();
      fit();
      var same = key === lastKey;
      Array.prototype.forEach.call(prod.querySelectorAll('[data-sk]'), function (el) {
        var k = el.getAttribute('data-sk');
        if (k === 'chat') { if (S.scrollChat || !same || !(k in scrolls)) el.scrollTop = el.scrollHeight; else el.scrollTop = scrolls[k]; }
        else if ((same || k === 'page') && k in scrolls) el.scrollTop = scrolls[k];
      });
      if (S.justResult) {
        var main = prod.querySelector('[data-sk="main"]'), res = main && main.querySelector('.hx-result');
        if (res) {
          var r0 = main.getBoundingClientRect(), r1 = res.getBoundingClientRect(), bottom = r1.bottom - r0.top + main.scrollTop;
          if (r1.bottom > r0.bottom) main.scrollTop = Math.min(r1.top - r0.top + main.scrollTop - 56, bottom - main.clientHeight + 12);
        }
      }
      if (pkey === lastPKey) pbody.scrollTop = pst;
      lastKey = key; lastPKey = pkey; S.scrollChat = false; S.justResult = false;
      if (S.query) suggest(S.query);
      if (refocus) { var inp = prod.querySelector('input[name="msg"]'); if (inp && !inp.disabled) inp.focus(); }
    }
    function toast(msg) {
      toastEl.textContent = msg; toastEl.classList.add('is-on');
      clearTimeout(timers.toast); timers.toast = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
    }

    /* ---------- flows ---------- */
    function later(ms, fn) { timers.later.push(setTimeout(fn, ms)); }
    function stopHumanTimers() { timers.later.forEach(clearTimeout); timers.later = []; clearTimeout(timers.idle); clearInterval(timers.cd); }
    function showIn() { if (S.surface === 'plugin') S.panel = true; }
    function goHome() { clearTimeout(timers.check); S.view = 'home'; S.sheet = false; S.query = ''; S.chatOn = false; render(); }
    function openTool(tool, id) {
      clearTimeout(timers.check);
      S.sheet = false; S.view = 'tool'; S.tool = tool; S.chatOn = false; S.tab = 'logic'; S.query = ''; showIn();
      if (id) runCase(id); else { S.phase = 'pick'; S.id = null; render(); }
    }
    function runCase(id) {
      clearTimeout(timers.check);
      S.id = id; S.phase = 'checking'; S.shown = 0;
      var n = total(S.tool, cur());
      if (reduce) { S.shown = n; S.phase = 'result'; S.justResult = true; render(); return; }
      render();
      (function step() {
        timers.check = setTimeout(function () {
          S.shown++;
          if (S.shown >= n) { S.phase = 'result'; S.justResult = true; }
          render();
          if (S.phase !== 'result') step();
        }, S.shown ? 360 : 300);
      })();
    }
    function openView(v) { clearTimeout(timers.check); S.view = v; S.chatOn = false; S.sheet = false; S.query = ''; showIn(); if (v === 'article') S.tab = 'lang'; render(); }
    function openTile(t) {
      if (t === 'refund' || t === 'order' || t === 'penalty') openTool(t);
      else if (t === 'local') openView('article');
      else if (t === 'progress') openView('progress');
      else if (t === 'assistant') showChat();
    }
    function goBack() {
      if (S.view === 'tool' && S.phase !== 'pick') { clearTimeout(timers.check); S.sheet = false; S.phase = 'pick'; S.id = null; render(); return; }
      goHome();
    }
    function doAction(a) {
      var cs = cur(); if (!cs) return;
      if (a === 'agent') { startHuman({ tool: S.tool, id: cs.id }); return; }
      if (a === 'a_appealInstead') { S.override[cs.id] = 'appeal'; S.justResult = true; render(); return; }
      if (a === 'a_appeal') { S.sheet = true; render(); var b = prod.querySelector('[data-submit-appeal]'); if (b) b.focus(); return; }
      if (a === 'a_progress') { openView('progress'); return; }
      (S.done[cs.id] = S.done[cs.id] || []).push(a);
      toast(p('toastDone', { a: p(a) }));
      render();
    }
    function submitAppeal() {
      var cs = cur(); if (!cs) return;
      S.appealed[cs.id] = true; S.sheet = false; S.justResult = true;
      (S.done[cs.id] = S.done[cs.id] || []).push('a_appeal');
      toast(p('toastDone', { a: p('a_appeal') }));
      render();
    }
    function sitChips() { return ['refund', 'order', 'penalty'].map(function (k) { return { act: 'sit', sit: k }; }); }
    function followups(F) {
      var out = outcome(F.tool, caseOf(F.tool, F.id));
      if (F.tool === 'refund') return (out === 'intercept' ? [{ act: 'fr', k: 'fr_noIntercept' }] : []).concat([{ act: 'fr', k: 'fr_disagree' }, { act: 'agent' }]);
      if (F.tool === 'order') return [{ act: 'fr', k: 'fr_courier' }, { act: 'agent' }];
      return [{ act: 'fr', k: 'fr_when' }, { act: 'agent' }];
    }
    /* Show the chat. A live agent session is always resumed; F (null or a case) starts a new assistant chat. */
    function showChat(F) {
      if (!humanOn() && (F !== undefined || !S.chat.length || (S.human && S.human.st === 'ended'))) {
        stopHumanTimers();
        S.stage = 'bot'; S.human = null; S.from = F || null; S.chat = [];
        if (F) S.chat.push({ who: 'bot', k: 'greetCtx', chips: followups(F), fn: function (L) { var cs = caseOf(F.tool, F.id); return { case: caseLabel(F.tool, cs, L), outcome: outcomeTitle(F.tool, cs, L) }; } });
        else S.chat.push({ who: 'bot', k: 'greet', chips: sitChips().concat([{ act: 'else' }]) });
      }
      S.chatOn = true; S.unread = 0; S.sheet = false; S.draft = ''; S.tab = 'logic'; S.scrollChat = true; showIn();
      render();
    }
    function botSay(m, then) {
      m.who = 'bot';
      if (reduce) { S.chat.push(m); S.scrollChat = true; render(); if (then) then(); return; }
      var typing = { who: 'bot', typing: true };
      S.chat.push(typing); S.scrollChat = true; render();
      later(520, function () {
        var i = S.chat.indexOf(typing); if (i >= 0) S.chat.splice(i, 1, m); else S.chat.push(m);
        S.scrollChat = true; render(); if (then) then();
      });
    }
    function sitParam(k) { return function (L) { return { sit: pl(L, 'sl_' + k) }; }; }
    function onChip(i) {
      var m = S.chat[S.chat.length - 1], ch = m && m.chips && m.chips[i]; if (!ch) return;
      if (ch.act === 'agent') { startHuman(); return; }
      if (ch.act === 'sit') { S.chat.push({ who: 'me', k: 'sl_' + ch.sit }); botSay({ k: 'matched', fn: sitParam(ch.sit), card: { tool: ch.sit } }); return; }
      if (ch.act === 'else') { S.chat.push({ who: 'me', k: 'else' }); botSay({ k: 'fallback', chips: sitChips().concat([{ act: 'agent' }]) }); return; }
      if (ch.act === 'fr') { S.chat.push({ who: 'me', k: ch.k }); botSay({ k: ch.k + '_a' }, function () { botSay({ k: 'helpful', chips: [{ act: 'ok' }, { act: 'notOk' }] }); }); return; }
      if (ch.act === 'ok') { S.chat.push({ who: 'me', k: 'ok' }); botSay({ k: 'glad' }); return; }
      if (ch.act === 'notOk') { S.chat.push({ who: 'me', k: 'notOk' }); botSay({ k: 'toAgent', chips: [{ act: 'agent' }] }); }
    }
    function onQuick(k) {
      if (k === 'agent') { startHuman(); return; }
      if (k === 'end') { endService(); return; }
      if (k === 'image') {
        S.chat.push({ who: 'me', type: 'image' });
        if (S.stage === 'human') humanReply(); else botSay({ k: 'imgBot', chips: [{ act: 'agent' }] });
        return;
      }
      var F = S.from && S.from.tool !== 'penalty' ? S.from : { tool: 'refund', id: 'r2' }, cs = caseOf(F.tool, F.id);
      S.chat.push({ who: 'me', type: 'order', tool: F.tool, id: F.id });
      if (S.stage === 'human') { humanReply(); return; }
      botSay({ k: 'orderChecked', card: { tool: F.tool, id: F.id }, fn: function (L) { return { case: caseLabel(F.tool, cs, L), outcome: outcomeTitle(F.tool, cs, L) }; } });
    }
    function send(text) {
      text = text.trim(); if (!text) return;
      S.draft = ''; S.chat.push({ who: 'me', text: text });
      if (S.stage === 'human') { humanReply(); return; }
      var sit = route(text);
      if (sit) botSay({ k: 'matched', fn: sitParam(sit), card: { tool: sit } });
      else botSay({ k: 'fallback', chips: sitChips().concat([{ act: 'agent' }]) });
    }
    function search(q) {
      q = q.trim(); if (!q) return;
      var sit = route(q);
      if (sit) { openTool(sit); return; }
      showChat(null); S.chat.push({ who: 'me', text: q }); botSay({ k: 'fallback', chips: sitChips().concat([{ act: 'agent' }]) });
    }
    function suggest(q) {
      var box = prod.querySelector('.hx-sugg'); if (!box) return;
      q = q.trim().toLowerCase();
      if (!q) { box.innerHTML = ''; return; }
      var sit = route(q);
      box.innerHTML = Object.keys(Q).filter(function (k) { return p(k).toLowerCase().indexOf(q) >= 0 || (sit && Q[k].tool === sit); }).slice(0, 4).map(function (k) {
        return '<button type="button" data-q="' + k + '">' + ico('search') + '<span>' + p(k) + '</span></button>';
      }).join('');
    }
    function pushAgent(m) { S.chat.push(m); if (chatHidden()) S.unread++; S.scrollChat = true; }
    function startHuman(F) {
      if (F !== undefined) { S.from = F; S.chat = []; }
      stopHumanTimers();
      S.stage = 'human'; S.chatOn = true; S.unread = 0; S.sheet = false; S.tab = 'logic'; showIn();
      S.human = { st: 'queue', pos: 2, left: 59 };
      var qm = { who: 'sys', k: 'queue', n: 2 };
      qm.fn = function (L) { return { n: num(qm.n, L) }; };
      S.chat.push(qm); S.scrollChat = true; render();
      later(1300, function () {
        qm.n = 1; S.human.pos = 1; render();
        later(1400, function () {
          var ctx = S.from;
          S.human.st = 'live';
          S.chat.push({ who: 'agentcard' });
          pushAgent({ who: 'agent', k: ctx ? 'hiCtx' : 'hi', fn: function (L) {
            var o = { name: pl(L, 'agentName') };
            if (ctx) o.case = caseLabel(ctx.tool, caseOf(ctx.tool, ctx.id), L);
            return o;
          } });
          if (chatHidden()) toast(p('returnSoon'));
          render(); armIdle();
        });
      });
    }
    function dropLive() { S.chat = S.chat.filter(function (m) { return !m.live; }); }
    function tickCountdown() {
      Array.prototype.forEach.call(root.querySelectorAll('.hx-cd'), function (el) { el.textContent = num(S.human.left); });
      Array.prototype.forEach.call(root.querySelectorAll('.hx-cdm'), function (el) { el.textContent = mmss(S.human.left); });
    }
    function armIdle() {
      clearTimeout(timers.idle); clearInterval(timers.cd);
      timers.idle = setTimeout(function () {
        if (!S.human || S.human.st !== 'live') return;
        S.human.st = 'closing'; S.human.left = 59;
        S.chat.push({ who: 'sys', k: 'closing', live: true, fn: function (L) { return { s: '<span class="hx-cd">' + num(S.human ? S.human.left : 0, L) + '</span>' }; } });
        S.scrollChat = true; render();
        timers.cd = setInterval(function () {
          if (!S.human) { clearInterval(timers.cd); return; }
          S.human.left--; tickCountdown();
          if (S.human.left <= 0) { clearInterval(timers.cd); finish(); }
        }, 1000);
      }, 15000);
    }
    function finish() { stopHumanTimers(); dropLive(); S.human.st = 'ended'; S.chat.push({ who: 'sys', k: 'ended' }); S.scrollChat = true; render(); }
    function endService() { if (S.human) finish(); }
    function endBack() { stopHumanTimers(); S.chat = []; S.human = null; S.stage = 'bot'; S.from = null; S.chatOn = false; S.unread = 0; render(); }
    function humanReply() {
      if (S.human.st === 'closing') { clearInterval(timers.cd); dropLive(); S.human.st = 'live'; }
      clearTimeout(timers.idle);
      S.scrollChat = true; render();
      later(900, function () { if (!humanOn()) return; pushAgent({ who: 'agent', k: 'noted' }); render(); armIdle(); });
    }
    function setVal(k, v) {
      if (k === 'lang' || k === 'region') { S[k] = v; S.tab = 'lang'; render(); return; }
      if (k === 'surface') {
        S.surface = v; S.ftab = v === 'plugin' && S.cat === 'sit' ? PAGE_TAB[S.page] : 0;
        if (v === 'plugin' && (S.view !== 'home' || S.chatOn)) S.panel = true;
        if (!chatHidden()) S.unread = 0;
        render(); return;
      }
      if (k === 'cat') { S.cat = v; S.ftab = 0; clearTimeout(timers.check); S.view = 'home'; S.chatOn = false; S.sheet = false; showIn(); render(); return; }
      S[k] = v; render();
    }

    /* ---------- events ---------- */
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !root.contains(b) || b.disabled) return;
      var d = b.dataset;
      if (d.set) { var kv = d.set.split(':'); setVal(kv[0], kv[1]); return; }
      if (d.ptab) { S.tab = d.ptab; render(); return; }
      if ('back' in d) { goBack(); return; }
      if ('whome' in d) { goHome(); return; }
      if (d.page) { S.page = d.page; if (S.cat === 'sit') S.ftab = PAGE_TAB[d.page]; render(); return; }
      if (d.help) { var h = d.help.split(':'); openTool(h[0], h[1] || null); return; }
      if (d.tile) { openTile(d.tile); return; }
      if ('notice' in d) { openTool('order', 'o1'); return; }
      if ('onpage' in d) { if (S.page === 'orders') openTool('order', 'o1'); else openTool(PAGE_TOOL[S.page]); return; }
      if (d.q) { openTool(Q[d.q].tool, Q[d.q].id); return; }
      if (d.ftab) { S.ftab = +d.ftab; render(); return; }
      if (d.case) { runCase(d.case); return; }
      if (d.act) { doAction(d.act); return; }
      if ('tochat' in d) { showChat(S.view === 'tool' && S.id ? { tool: S.tool, id: S.id } : null); return; }
      if ('ball' in d) { if (S.surface === 'plugin') { S.panel = true; if (humanOn()) S.chatOn = true; if (S.chatOn) { S.unread = 0; S.scrollChat = true; } render(); } else showChat(); return; }
      if ('min' in d) { S.panel = false; render(); return; }
      if ('hidechat' in d) { S.chatOn = false; render(); return; }
      if ('endback' in d) { endBack(); return; }
      if (d.qa) { onQuick(d.qa); return; }
      if (d.agentCase) { S.tool = 'penalty'; S.id = d.agentCase; startHuman({ tool: 'penalty', id: d.agentCase }); return; }
      if ('submitAppeal' in d) { submitAppeal(); return; }
      if ('closeSheet' in d) { S.sheet = false; render(); return; }
      if (d.chip) onChip(+d.chip);
    });
    root.addEventListener('change', function (e) { if (e.target.matches('[data-region]')) setVal('region', e.target.value); });
    root.addEventListener('input', function (e) {
      if (e.target.name === 'q') { S.query = e.target.value; suggest(S.query); }
      if (e.target.name === 'msg') S.draft = e.target.value;
    });
    root.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      if (f.classList.contains('hx-search')) search(f.elements.q.value);
      if (f.classList.contains('hx-composer')) send(f.elements.msg.value);
    });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.sheet) { S.sheet = false; render(); } });
    var rz;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { fit(); rail.innerHTML = railHTML(); }, 120); });
    render();
  }
})();
